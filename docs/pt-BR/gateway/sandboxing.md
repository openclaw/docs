---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Como funciona o sandbox do OpenClaw: modos, escopos, acesso ao workspace e imagens'
title: Isolamento em sandbox
x-i18n:
    generated_at: "2026-07-12T15:14:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw pode executar ferramentas dentro de um backend de sandbox para reduzir o raio de impacto. O sandbox fica desativado por padrão e é controlado por `agents.defaults.sandbox` (globalmente) ou `agents.list[].sandbox` (por agente). O processo do Gateway sempre permanece no host; somente a execução de ferramentas é movida para o sandbox quando ele está ativado.

<Note>
Esse não é um limite de segurança perfeito, mas restringe significativamente o acesso ao sistema de arquivos e aos processos quando o modelo faz algo imprudente.
</Note>

## O que é executado no sandbox

- Execução de ferramentas: `exec`, `read`, `write`, `edit`, `apply_patch`, `process` etc.
- O navegador opcional em sandbox (`agents.defaults.sandbox.browser`).

Não são executados no sandbox:

- O próprio processo do Gateway.
- Qualquer ferramenta explicitamente autorizada a ser executada fora do sandbox por meio de `tools.elevated`. A execução elevada ignora o sandbox e ocorre pelo caminho de escape configurado (`gateway` por padrão ou `node` quando o destino da execução é `node`). Se o sandbox estiver desativado, `tools.elevated` não altera nada, pois a execução já ocorre no host. Consulte [Modo elevado](/pt-BR/tools/elevated).

## Modos, escopo e backend

Três configurações independentes controlam o comportamento do sandbox:

| Configuração | Chave                             | Valores                      | Padrão   |
| ------------ | --------------------------------- | ---------------------------- | -------- |
| Modo         | `agents.defaults.sandbox.mode`    | `off`, `non-main`, `all`     | `off`    |
| Escopo       | `agents.defaults.sandbox.scope`   | `agent`, `session`, `shared` | `agent`  |
| Backend      | `agents.defaults.sandbox.backend` | `docker`, `ssh`, `openshell` | `docker` |

O **modo** controla quando o sandbox é aplicado:

- `off`: sem sandbox.
- `non-main`: executa no sandbox todas as sessões, exceto a sessão principal do agente. A chave da sessão principal é sempre `agent:<agentId>:main` (ou `global` quando `session.scope` é `"global"`); ela não é configurável. As sessões de grupo/canal usam suas próprias chaves, portanto sempre são consideradas não principais e executadas no sandbox.
- `all`: todas as sessões são executadas em um sandbox.

O **escopo** controla quantos contêineres/ambientes são criados:

- `agent`: um contêiner por agente.
- `session`: um contêiner por sessão.
- `shared`: um contêiner compartilhado por todas as sessões em sandbox (as substituições de `docker`/`ssh`/`browser` por agente são ignoradas neste escopo).

O **backend** controla qual ambiente de execução executa as ferramentas em sandbox. A configuração específica de SSH fica em `agents.defaults.sandbox.ssh`; a configuração específica do OpenShell fica em `plugins.entries.openshell.config`.

|                           | Docker                           | SSH                                  | OpenShell                                                 |
| ------------------------- | -------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| **Onde é executado**      | Contêiner local                  | Qualquer host acessível por SSH      | Sandbox gerenciado pelo OpenShell                         |
| **Configuração**          | `scripts/sandbox-setup.sh`       | Chave SSH + host de destino          | Plugin OpenShell ativado                                  |
| **Modelo do workspace**   | Montagem vinculada ou cópia      | Remoto canônico (semeado uma vez)    | `mirror` ou `remote`                                      |
| **Controle de rede**      | `docker.network` (padrão: nenhum)| Depende do host remoto               | Depende do OpenShell                                      |
| **Sandbox do navegador**  | Compatível                       | Não compatível                       | Ainda não compatível                                      |
| **Montagens vinculadas**  | `docker.binds`                   | N/D                                  | N/D                                                       |
| **Ideal para**            | Desenvolvimento local, isolamento completo | Transferência de carga para uma máquina remota | Sandboxes remotos gerenciados com sincronização bidirecional opcional |

## Backend Docker

O Docker é o backend padrão quando o sandbox está ativado. Ele executa ferramentas e navegadores em sandbox localmente por meio do soquete do daemon do Docker (`/var/run/docker.sock`); o isolamento é fornecido pelos namespaces do Docker.

Padrões: `network: "none"` (sem saída), `readOnlyRoot: true`, `capDrop: ["ALL"]`, imagem `openclaw-sandbox:bookworm-slim`.

Para disponibilizar GPUs do host, defina `agents.defaults.sandbox.docker.gpus` (ou a substituição por agente) com um valor como `"all"` ou `"device=GPU-uuid"`. Esse valor é passado para a opção `--gpus` do Docker e requer um ambiente de execução do host compatível, como o NVIDIA Container Toolkit.

<Warning>
**Restrições de Docker-out-of-Docker (DooD)**

Se você implantar o próprio Gateway do OpenClaw como um contêiner Docker, ele orquestrará contêineres de sandbox irmãos usando o soquete Docker do host (DooD). Isso introduz uma restrição de mapeamento de caminhos:

- **A configuração exige caminhos do host**: o `workspace` em `openclaw.json` deve conter o **caminho absoluto do host** (por exemplo, `/home/user/.openclaw/workspaces`), e não o caminho interno do contêiner do Gateway. O daemon do Docker avalia os caminhos em relação ao namespace do sistema operacional host, não ao namespace do próprio Gateway.
- **É necessário um mapeamento de volume correspondente**: o processo do Gateway também grava arquivos de heartbeat e de ponte nesse caminho de `workspace`. Forneça ao contêiner do Gateway um mapeamento de volume idêntico (`-v /home/user/.openclaw:/home/user/.openclaw`) para que o mesmo caminho do host também seja resolvido corretamente dentro do contêiner do Gateway. Mapeamentos incompatíveis se manifestam como `EACCES` quando o Gateway tenta gravar o heartbeat.
- **Modo de código do Codex**: quando um sandbox do OpenClaw está ativo, o OpenClaw desativa, nessa interação, o Modo de Código nativo do app-server do Codex, os servidores MCP do usuário e a execução de plugins apoiados por aplicativos (eles são executados pelo processo do app-server no host do Gateway, não pelo backend de sandbox do OpenClaw), a menos que a política de ferramentas do sandbox exponha as ferramentas necessárias e você habilite o caminho experimental do servidor de execução do sandbox. Nesse caso, o acesso ao shell é encaminhado por ferramentas apoiadas pelo sandbox do OpenClaw, como `sandbox_exec` e `sandbox_process`. Não monte o soquete Docker do host em contêineres de sandbox de agentes nem em sandboxes personalizados do Codex. Consulte [Harness do Codex](/pt-BR/plugins/codex-harness) para obter o comportamento completo.

Em hosts Ubuntu/AppArmor com o modo de sandbox do Docker ativado, a execução de shell `workspace-write` do app-server do Codex precisa de namespaces de usuário sem privilégios dentro do contêiner de sandbox, e isso pode falhar antes da inicialização do shell quando o usuário do serviço não consegue criá-los. Também é necessário um namespace de rede sem privilégios quando a saída do sandbox do Docker está desativada (`network: "none"`, o padrão). Sintomas comuns: `bwrap: setting up uid map: Permission denied` e `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Execute `openclaw doctor`; se ele relatar falha na verificação do namespace bwrap do Codex, prefira um perfil AppArmor que conceda os namespaces necessários ao processo de serviço do OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` é uma alternativa que afeta todo o host e apresenta implicações de segurança; use-a somente quando essa postura for aceitável nesse host.
</Warning>

### Navegador em sandbox

- O navegador em sandbox é iniciado automaticamente (garantindo que o CDP esteja acessível) quando a ferramenta de navegador precisa dele. Configure por meio de `agents.defaults.sandbox.browser.autoStart` (padrão `true`) e `autoStartTimeoutMs` (padrão 12s).
- Os contêineres do navegador em sandbox usam uma rede Docker dedicada (`openclaw-sandbox-browser`) em vez da rede global `bridge`. Configure-a com `agents.defaults.sandbox.browser.network`.
- `agents.defaults.sandbox.browser.cdpSourceRange` restringe a entrada de CDP na borda do contêiner por meio de uma lista de permissões CIDR (por exemplo, `172.21.0.1/32`).
- O acesso do observador noVNC é protegido por senha por padrão; o OpenClaw emite uma URL de token de curta duração que disponibiliza uma página de inicialização local e abre o noVNC com a senha no fragmento da URL (não na string de consulta nem nos logs de cabeçalhos).
- `agents.defaults.sandbox.browser.allowHostControl` (padrão `false`) permite que sessões em sandbox direcionem explicitamente o navegador do host.
- Listas de permissões opcionais controlam `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

## Backend SSH

Use `backend: "ssh"` para executar `exec`, ferramentas de arquivo e leituras de mídia em sandbox em qualquer máquina acessível por SSH.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Ou use SecretRefs / conteúdo em linha em vez de arquivos locais:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Padrões: `command: "ssh"`, `workspaceRoot: "/tmp/openclaw-sandboxes"`, `strictHostKeyChecking: true`, `updateHostKeys: true`.

- **Ciclo de vida**: o OpenClaw cria uma raiz remota por escopo em `sandbox.ssh.workspaceRoot`. No primeiro uso após a criação ou recriação, ele semeia esse workspace remoto uma vez a partir do workspace local. Depois disso, `exec`, `read`, `write`, `edit`, `apply_patch`, leituras de mídia do prompt e preparação de mídia recebida operam diretamente no workspace remoto por SSH. O OpenClaw não sincroniza automaticamente as alterações remotas de volta para o workspace local.
- **Material de autenticação**: `identityFile`/`certificateFile`/`knownHostsFile` fazem referência a arquivos locais existentes. `identityData`/`certificateData`/`knownHostsData` aceitam strings em linha ou SecretRefs, resolvidas pelo snapshot normal do ambiente de execução de segredos, gravadas em arquivos temporários com modo `0600` e excluídas quando a sessão SSH termina. Se uma variante `*File` e uma variante `*Data` forem definidas para o mesmo item, `*Data` terá precedência nessa sessão.
- **Consequências do modelo remoto canônico**: o workspace SSH remoto se torna o estado real do sandbox após a semeadura inicial. Edições locais no host feitas fora do OpenClaw após a etapa de semeadura não ficam visíveis remotamente até que você recrie o sandbox. `openclaw sandbox recreate` exclui a raiz remota por escopo e a semeia novamente a partir do workspace local no próximo uso. O sandbox do navegador não é compatível com esse backend, e as configurações `sandbox.docker.*` não se aplicam a ele.

## Backend OpenShell

Use `backend: "openshell"` para executar ferramentas em sandbox em um ambiente remoto gerenciado pelo OpenShell. O OpenShell reutiliza o mesmo transporte SSH e a mesma ponte de sistema de arquivos remoto do backend SSH genérico e adiciona o ciclo de vida do OpenShell (`sandbox create/get/delete/ssh-config`), além de um modo opcional de sincronização de workspace `mirror`.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote", // mirror | remote
        },
      },
    },
  },
}
```

`mode: "mirror"` (padrão) mantém o workspace local como canônico: o OpenClaw sincroniza o conteúdo local com o sandbox antes de `exec` e sincroniza de volta depois. `mode: "remote"` semeia o workspace remoto uma vez a partir do local e, em seguida, executa `exec`/`read`/`write`/`edit`/`apply_patch` diretamente no workspace remoto sem sincronizar de volta; edições locais após a semeadura ficam invisíveis até que você execute `openclaw sandbox recreate`. Com `scope: "agent"` ou `scope: "shared"`, esse workspace remoto é compartilhado no mesmo escopo. Limitações atuais: o navegador em sandbox ainda não é compatível, e `sandbox.docker.binds` não se aplica a esse backend.

`openclaw sandbox list`/`recreate`/prune tratam ambientes de execução do OpenShell da mesma forma que ambientes de execução do Docker; a lógica de prune considera o backend.

Para ver todos os pré-requisitos, a referência de configuração, a comparação dos modos de workspace e os detalhes do ciclo de vida, consulte [OpenShell](/pt-BR/gateway/openshell).

## Acesso ao workspace

`agents.defaults.sandbox.workspaceAccess` controla o que o sandbox pode acessar:

| Valor            | Comportamento                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `none` (padrão)  | As ferramentas veem um workspace de sandbox isolado em `~/.openclaw/sandboxes`.                |
| `ro`             | Monta o workspace do agente como somente leitura em `/agent` (desativa `write`/`edit`/`apply_patch`). |
| `rw`             | Monta o workspace do agente para leitura/gravação em `/workspace`.                             |

Com o backend OpenShell, o modo `mirror` ainda usa o workspace local como fonte canônica entre as execuções de exec, o modo `remote` usa o workspace remoto do OpenShell como canônico após a carga inicial, e `workspaceAccess: "ro"`/`"none"` ainda restringe o comportamento de gravação da mesma forma.

As mídias recebidas são copiadas para o workspace da sandbox ativa (`media/inbound/*`).

<Note>
**Skills**: a ferramenta `read` tem como raiz a sandbox. Com `workspaceAccess: "none"`, o OpenClaw espelha as skills qualificadas no workspace da sandbox (`.../skills`) para que possam ser lidas. Com `"rw"`, as skills do workspace podem ser lidas em `/workspace/skills`, e as skills qualificadas gerenciadas, integradas ou de plugins são materializadas no caminho somente leitura gerado `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Montagens bind personalizadas

`agents.defaults.sandbox.docker.binds` monta diretórios adicionais do host no contêiner. Formato: `host:container:mode` (por exemplo, `"/home/user/source:/source:rw"`).

As montagens bind globais e por agente são combinadas (não substituídas). Com `scope: "shared"`, as montagens bind por agente são ignoradas.

`agents.defaults.sandbox.browser.binds` monta diretórios adicionais do host somente no contêiner do **navegador da sandbox**. Quando definido (inclusive como `[]`), ele substitui `docker.binds` no contêiner do navegador; quando omitido, o contêiner do navegador usa `docker.binds` como alternativa.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

<Warning>
**Segurança das montagens bind**

- As montagens bind ignoram o sistema de arquivos da sandbox: elas expõem caminhos do host com o modo que você definir (`:ro` ou `:rw`).
- Por padrão, o OpenClaw bloqueia origens de montagem bind perigosas: caminhos do sistema (`/etc`, `/proc`, `/sys`, `/dev`, `/root`, `/boot`), diretórios de sockets do Docker (`/run`, `/var/run` e suas variantes `docker.sock`) e diretórios raiz comuns de credenciais no diretório pessoal (`~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm`, `~/.ssh`).
- A validação normaliza o caminho de origem e o resolve novamente pelo ancestral existente mais profundo antes de verificar outra vez os caminhos bloqueados e as raízes permitidas; assim, tentativas de escape por links simbólicos em diretórios ancestrais falham de forma segura, mesmo quando o elemento final ainda não existe (por exemplo, `/workspace/run-link/new-file` ainda é resolvido como `/var/run/...` se `run-link` apontar para lá).
- Destinos de montagem bind que ocultem os pontos de montagem reservados do contêiner (`/workspace`, `/agent`) também são bloqueados por padrão; substitua esse comportamento com `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true`.
- Origens de montagem bind fora das raízes permitidas do workspace/workspace do agente são bloqueadas por padrão; substitua esse comportamento com `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true`. As raízes permitidas são canonicalizadas da mesma forma, portanto um caminho que só pareça estar dentro da lista de permissões antes da resolução de links simbólicos ainda será rejeitado por estar fora das raízes permitidas.
- Montagens confidenciais (segredos, chaves SSH, credenciais de serviço) devem usar `:ro`, a menos que a gravação seja absolutamente necessária.
- Combine com `workspaceAccess: "ro"` se você precisar apenas de acesso de leitura ao workspace; os modos das montagens bind permanecem independentes.
- Consulte [Sandbox vs. política de ferramentas vs. execução elevada](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para saber como as montagens bind interagem com a política de ferramentas e a execução elevada.

</Warning>

## Imagens e configuração

Imagem padrão do Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout do código-fonte vs. instalação pelo npm**

Os scripts auxiliares `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` e `scripts/sandbox-browser-setup.sh` só estão disponíveis ao executar a partir de um [checkout do código-fonte](https://github.com/openclaw/openclaw). Eles não estão incluídos no pacote npm.

Se você instalou o OpenClaw por meio de `npm install -g openclaw`, use os comandos `docker build` em linha mostrados abaixo.
</Note>

<Steps>
  <Step title="Compile a imagem padrão">
    A partir de um checkout do código-fonte:

    ```bash
    scripts/sandbox-setup.sh
    ```

    A partir de uma instalação pelo npm (sem necessidade de checkout do código-fonte):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    A imagem padrão **não** inclui Node. Se uma skill precisar do Node (ou de outros runtimes), incorpore-os em uma imagem personalizada ou instale-os por meio de `sandbox.docker.setupCommand` (requer acesso de saída à rede + raiz gravável + usuário root).

    O OpenClaw não substitui silenciosamente a imagem ausente `openclaw-sandbox:bookworm-slim` por `debian:bookworm-slim` sem modificações. As execuções de sandbox destinadas à imagem padrão falham imediatamente com uma instrução de compilação até que você a compile, pois a imagem integrada contém `python3` para os auxiliares de gravação/edição da sandbox.

  </Step>
  <Step title="Opcional: compile a imagem comum">
    Para obter uma imagem de sandbox mais funcional com ferramentas comuns (por exemplo, `curl`, `jq`, Node 24, pnpm, `python3` e `git`):

    A partir de um checkout do código-fonte:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    A partir de uma instalação pelo npm, compile primeiro a imagem padrão (veja acima) e depois compile a imagem comum sobre ela usando [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) do repositório.

    Em seguida, defina `agents.defaults.sandbox.docker.image` como `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: compile a imagem do navegador da sandbox">
    A partir de um checkout do código-fonte:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    A partir de uma instalação pelo npm, compile usando [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) do repositório.

  </Step>
</Steps>

Por padrão, os contêineres de sandbox do Docker são executados **sem rede**. Substitua esse comportamento com `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Configurações padrão do Chromium no navegador da sandbox">
    A imagem integrada do navegador da sandbox aplica sinalizadores conservadores de inicialização do Chromium para cargas de trabalho em contêineres:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - `--headless=new` quando `browser.headless` está habilitado.
    - `--no-sandbox --disable-setuid-sandbox` quando `browser.noSandbox` está habilitado.
    - `--disable-3d-apis`, `--disable-gpu`, `--disable-software-rasterizer` por padrão; esses sinalizadores de proteção gráfica ajudam contêineres sem suporte a GPU. Defina `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se sua carga de trabalho precisar de WebGL ou outros recursos 3D.
    - `--disable-extensions` por padrão; defina `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para fluxos que dependam de extensões.
    - `--renderer-process-limit=2` por padrão; controlado por `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, em que `0` mantém o padrão do Chromium.

    Se precisar de um perfil de runtime diferente, use uma imagem de navegador personalizada e forneça seu próprio ponto de entrada. Para perfis locais do Chromium (fora de contêineres), use `browser.extraArgs` para acrescentar outros sinalizadores de inicialização.

  </Accordion>
  <Accordion title="Configurações padrão de segurança de rede">
    - `network: "host"` é bloqueado.
    - `network: "container:<id>"` é bloqueado por padrão (risco de contornar o isolamento ao ingressar no namespace).
    - Substituição emergencial: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

As instalações do Docker e o Gateway em contêiner ficam aqui: [Docker](/pt-BR/install/docker)

Para implantações do Gateway com Docker, `scripts/docker/setup.sh` pode inicializar a configuração da sandbox. Defina `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) para habilitar esse caminho. Substitua a localização do socket com `OPENCLAW_DOCKER_SOCKET`. Referência completa de configuração e variáveis de ambiente: [Docker](/pt-BR/install/docker#agent-sandbox).

## setupCommand (configuração única do contêiner)

`setupCommand` é executado **uma vez** após a criação do contêiner da sandbox (não em todas as execuções). Ele é executado dentro do contêiner por meio de `sh -lc`.

Caminhos:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Armadilhas comuns">
    - O padrão de `docker.network` é `"none"` (sem acesso de saída), portanto as instalações de pacotes falharão.
    - `docker.network: "container:<id>"` requer `dangerouslyAllowContainerNamespaceJoin: true` e destina-se somente a uso emergencial.
    - `readOnlyRoot: true` impede gravações; defina `readOnlyRoot: false` ou incorpore as dependências em uma imagem personalizada.
    - `user` deve ser root para instalar pacotes (omita `user` ou defina `user: "0:0"`).
    - O exec da sandbox **não** herda o `process.env` do host. Use `agents.defaults.sandbox.docker.env` (ou uma imagem personalizada) para as chaves de API das skills.
    - Os valores em `agents.defaults.sandbox.docker.env` são transmitidos como variáveis de ambiente explícitas do contêiner Docker. Qualquer pessoa com acesso ao daemon do Docker pode inspecioná-los com comandos de metadados do Docker, como `docker inspect`. Use uma imagem personalizada, um arquivo de segredos montado ou outro método de entrega de segredos se essa exposição nos metadados não for aceitável.

  </Accordion>
</AccordionGroup>

## Política de ferramentas e mecanismos de escape

As políticas de permissão/negação de ferramentas ainda são aplicadas antes das regras da sandbox. Se uma ferramenta for negada globalmente ou por agente, a sandbox não a disponibilizará novamente.

`tools.elevated` é um mecanismo de escape explícito que executa `exec` fora da sandbox (no `gateway` por padrão ou no `node` quando o destino do exec for `node`). As diretivas `/exec` são aplicáveis somente a remetentes autorizados e persistem por sessão; para desabilitar permanentemente o `exec`, use a negação na política de ferramentas (consulte [Sandbox vs. política de ferramentas vs. execução elevada](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuração:

- `openclaw sandbox list` mostra os contêineres de sandbox, o status, a correspondência da imagem, a idade, o tempo de inatividade e a sessão/o agente associado.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` inspeciona o modo efetivo da sandbox, o workspace do host, o diretório de trabalho do runtime, as montagens do Docker, a política de ferramentas e as chaves de configuração para correção. O campo `workspaceRoot` continua sendo a raiz configurada da sandbox; `effectiveHostWorkspaceRoot` mostra onde o workspace ativo realmente está.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` remove contêineres/ambientes para que sejam recriados com a configuração atual no próximo uso.
- Consulte [Sandbox vs. política de ferramentas vs. execução elevada](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para entender o modelo mental de “por que isso está bloqueado?”.

## Substituições para múltiplos agentes

Cada agente pode substituir as configurações da sandbox e das ferramentas: `agents.list[].sandbox` e `agents.list[].tools` (além de `agents.list[].tools.sandbox.tools` para a política de ferramentas da sandbox). Consulte [Sandbox e ferramentas para múltiplos agentes](/pt-BR/tools/multi-agent-sandbox-tools) para ver a precedência.

## Exemplo mínimo de habilitação

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## Relacionado

- [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) -- substituições por agente e precedência
- [OpenShell](/pt-BR/gateway/openshell) -- configuração do backend de sandbox gerenciado, modos de espaço de trabalho e referência de configuração
- [Configuração do sandbox](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs. política de ferramentas vs. modo elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuração de "por que isto está bloqueado?"
- [Segurança](/pt-BR/gateway/security)
