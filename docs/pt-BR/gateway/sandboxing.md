---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Como o sandboxing do OpenClaw funciona: modos, escopos, acesso ao workspace e imagens'
title: Sandboxing
x-i18n:
    generated_at: "2026-06-27T17:33:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw pode executar **ferramentas dentro de backends de sandbox** para reduzir o raio de impacto. Isso é **opcional** e controlado por configuração (`agents.defaults.sandbox` ou `agents.list[].sandbox`). Se o sandbox estiver desativado, as ferramentas rodam no host. O Gateway permanece no host; a execução de ferramentas roda em um sandbox isolado quando habilitada.

<Note>
Este não é um limite de segurança perfeito, mas limita materialmente o acesso ao sistema de arquivos e a processos quando o modelo faz algo inadequado.
</Note>

## O que entra em sandbox

- Execução de ferramentas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navegador em sandbox opcional (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Detalhes do navegador em sandbox">
    - Por padrão, o navegador do sandbox inicia automaticamente (garante que o CDP esteja acessível) quando a ferramenta de navegador precisa dele. Configure via `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Por padrão, os contêineres do navegador do sandbox usam uma rede Docker dedicada (`openclaw-sandbox-browser`) em vez da rede global `bridge`. Configure com `agents.defaults.sandbox.browser.network`.
    - O `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe a entrada CDP na borda do contêiner com uma lista de permissões CIDR (por exemplo, `172.21.0.1/32`).
    - O acesso de observador noVNC é protegido por senha por padrão; o OpenClaw emite uma URL de token de curta duração que serve uma página de bootstrap local e abre o noVNC com a senha no fragmento da URL (não em logs de consulta/cabeçalho).
    - `agents.defaults.sandbox.browser.allowHostControl` permite que sessões em sandbox apontem explicitamente para o navegador do host.
    - Listas de permissões opcionais controlam `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Não entra em sandbox:

- O próprio processo do Gateway.
- Qualquer ferramenta explicitamente autorizada a rodar fora do sandbox (por exemplo, `tools.elevated`).
  - **Exec elevado ignora o sandbox e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o alvo do exec é `node`).**
  - Se o sandbox estiver desativado, `tools.elevated` não altera a execução (já está no host). Consulte [Modo Elevado](/pt-BR/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **quando** o sandbox é usado:

<Tabs>
  <Tab title="off">
    Sem sandbox.
  </Tab>
  <Tab title="non-main">
    Coloca em sandbox apenas sessões **não principais** (padrão se você quiser chats normais no host).

    `"non-main"` é baseado em `session.mainKey` (padrão `"main"`), não no id do agente. Sessões de grupo/canal usam suas próprias chaves, portanto contam como não principais e entrarão em sandbox.

  </Tab>
  <Tab title="all">
    Toda sessão roda em um sandbox.
  </Tab>
</Tabs>

## Escopo

`agents.defaults.sandbox.scope` controla **quantos contêineres** são criados:

- `"agent"` (padrão): um contêiner por agente.
- `"session"`: um contêiner por sessão.
- `"shared"`: um contêiner compartilhado por todas as sessões em sandbox.

## Backend

`agents.defaults.sandbox.backend` controla **qual runtime** fornece o sandbox:

- `"docker"` (padrão quando o sandbox está habilitado): runtime de sandbox local baseado em Docker.
- `"ssh"`: runtime de sandbox remoto genérico baseado em SSH.
- `"openshell"`: runtime de sandbox baseado no OpenShell.

A configuração específica de SSH fica em `agents.defaults.sandbox.ssh`. A configuração específica do OpenShell fica em `plugins.entries.openshell.config`.

### Escolhendo um backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Onde roda**       | Contêiner local                  | Qualquer host acessível por SSH | Sandbox gerenciado pelo OpenShell                  |
| **Configuração**    | `scripts/sandbox-setup.sh`       | Chave SSH + host de destino     | Plugin OpenShell habilitado                         |
| **Modelo de workspace** | Bind mount ou cópia          | Canônico remoto (semeia uma vez) | `mirror` ou `remote`                               |
| **Controle de rede** | `docker.network` (padrão: none) | Depende do host remoto          | Depende do OpenShell                                |
| **Sandbox de navegador** | Compatível                 | Não compatível                  | Ainda não compatível                                |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Melhor para**     | Desenvolvimento local, isolamento completo | Descarregar para uma máquina remota | Sandboxes remotos gerenciados com sincronização bidirecional opcional |

### Backend Docker

O sandbox fica desativado por padrão. Se você habilitar o sandbox e não escolher um backend, o OpenClaw usa o backend Docker. Ele executa ferramentas e navegadores em sandbox localmente via socket do daemon Docker (`/var/run/docker.sock`). O isolamento do contêiner de sandbox é determinado pelos namespaces do Docker.

Para expor GPUs do host a sandboxes Docker, defina `agents.defaults.sandbox.docker.gpus` ou a substituição por agente `agents.list[].sandbox.docker.gpus`. O valor é passado para a flag `--gpus` do Docker como um argumento separado, por exemplo `"all"` ou `"device=GPU-uuid"`, e exige um runtime de host compatível, como NVIDIA Container Toolkit.

<Warning>
**Restrições de Docker-out-of-Docker (DooD)**

Se você implantar o próprio Gateway do OpenClaw como um contêiner Docker, ele orquestra contêineres de sandbox irmãos usando o socket Docker do host (DooD). Isso introduz uma restrição específica de mapeamento de caminhos:

- **A configuração exige caminhos do host**: A configuração `workspace` de `openclaw.json` DEVE conter o **caminho absoluto do host** (por exemplo, `/home/user/.openclaw/workspaces`), não o caminho interno do contêiner do Gateway. Quando o OpenClaw pede ao daemon Docker para iniciar um sandbox, o daemon avalia caminhos em relação ao namespace do sistema operacional do host, não ao namespace do Gateway.
- **Paridade da ponte FS (mapa de volumes idêntico)**: O processo nativo do Gateway do OpenClaw também grava arquivos de Heartbeat e de ponte no diretório `workspace`. Como o Gateway avalia exatamente a mesma string (o caminho do host) de dentro do seu próprio ambiente conteinerizado, a implantação do Gateway DEVE incluir um mapa de volume idêntico vinculando o namespace do host nativamente (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **Modo de código do Codex**: Quando um sandbox do OpenClaw está ativo, o OpenClaw desativa o Modo de Código nativo do servidor de aplicativo do Codex, servidores MCP do usuário e execução de Plugin baseada em aplicativo para essa rodada porque essas superfícies nativas rodam a partir do processo do servidor de aplicativo do host do Gateway em vez do backend de sandbox do OpenClaw. O acesso ao shell é exposto por ferramentas baseadas no sandbox do OpenClaw, como `sandbox_exec` e `sandbox_process`, quando as ferramentas normais de exec/process estão disponíveis. Não monte o socket Docker do host em contêineres de sandbox de agentes nem em sandboxes Codex personalizados.

Em hosts Ubuntu/AppArmor, `workspace-write` do Codex pode falhar antes da inicialização do shell
quando você executa intencionalmente `workspace-write` nativo do Codex sem
sandbox ativo do OpenClaw e o usuário do serviço não tem permissão para criar
namespaces de usuário sem privilégio. Quando a saída do sandbox Docker está
desativada (`network: "none"`, o padrão), o Codex também precisa de um namespace
de rede sem privilégio. Sintomas comuns são
`bwrap: setting up uid map: Permission denied` e
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. Execute
`openclaw doctor`; se ele relatar uma falha na sondagem de namespace bwrap do Codex, prefira
um perfil AppArmor que conceda os namespaces necessários ao processo de serviço
do OpenClaw. `kernel.apparmor_restrict_unprivileged_userns=0` é uma alternativa
para todo o host com tradeoffs de segurança; use-a somente quando essa postura
do host for aceitável.

Se você mapear caminhos internamente sem paridade absoluta com o host, o OpenClaw lança nativamente um erro de permissão `EACCES` ao tentar gravar seu Heartbeat dentro do ambiente do contêiner porque a string de caminho totalmente qualificada não existe nativamente.
</Warning>

### Backend SSH

Use `backend: "ssh"` quando você quiser que o OpenClaw coloque `exec`, ferramentas de arquivo e leituras de mídia em sandbox em uma máquina arbitrária acessível por SSH.

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
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Como funciona">
    - O OpenClaw cria uma raiz remota por escopo em `sandbox.ssh.workspaceRoot`.
    - No primeiro uso após criar ou recriar, o OpenClaw semeia esse workspace remoto a partir do workspace local uma vez.
    - Depois disso, `exec`, `read`, `write`, `edit`, `apply_patch`, leituras de mídia de prompt e staging de mídia de entrada rodam diretamente contra o workspace remoto via SSH.
    - O OpenClaw não sincroniza automaticamente alterações remotas de volta para o workspace local.

  </Accordion>
  <Accordion title="Material de autenticação">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usam arquivos locais existentes e os passam pela configuração do OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usam strings inline ou SecretRefs. O OpenClaw os resolve por meio do snapshot normal do runtime de segredos, grava-os em arquivos temporários com `0600` e os exclui quando a sessão SSH termina.
    - Se tanto `*File` quanto `*Data` estiverem definidos para o mesmo item, `*Data` prevalece nessa sessão SSH.

  </Accordion>
  <Accordion title="Consequências do modelo canônico remoto">
    Este é um modelo **canônico remoto**. O workspace SSH remoto se torna o estado real do sandbox após a semeadura inicial.

    - Edições locais no host feitas fora do OpenClaw após a etapa de semeadura não ficam visíveis remotamente até você recriar o sandbox.
    - `openclaw sandbox recreate` exclui a raiz remota por escopo e semeia novamente a partir do local no próximo uso.
    - Sandbox de navegador não é compatível com o backend SSH.
    - Configurações `sandbox.docker.*` não se aplicam ao backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Use `backend: "openshell"` quando você quiser que o OpenClaw coloque ferramentas em sandbox em um ambiente remoto gerenciado pelo OpenShell. Para o guia completo de configuração, a referência de configuração e a comparação de modos de workspace, consulte a [página do OpenShell](/pt-BR/gateway/openshell) dedicada.

O OpenShell reutiliza o mesmo transporte SSH central e a mesma ponte de sistema de arquivos remoto do backend SSH genérico, e adiciona ciclo de vida específico do OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) mais o modo de workspace `mirror` opcional.

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
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

Modos do OpenShell:

- `mirror` (padrão): o workspace local permanece canônico. O OpenClaw sincroniza arquivos locais para o OpenShell antes do exec e sincroniza o workspace remoto de volta após o exec.
- `remote`: o workspace OpenShell é canônico depois que o sandbox é criado. O OpenClaw semeia o workspace remoto uma vez a partir do workspace local; em seguida, ferramentas de arquivo e exec rodam diretamente contra o sandbox remoto sem sincronizar alterações de volta.

<AccordionGroup>
  <Accordion title="Detalhes do transporte remoto">
    - O OpenClaw solicita ao OpenShell a configuração SSH específica do sandbox via `openshell sandbox ssh-config <name>`.
    - O core grava essa configuração SSH em um arquivo temporário, abre a sessão SSH e reutiliza a mesma ponte de sistema de arquivos remoto usada por `backend: "ssh"`.
    - No modo `mirror`, apenas o ciclo de vida difere: sincroniza o local para o remoto antes do exec e depois sincroniza de volta após o exec.

  </Accordion>
  <Accordion title="Limitações atuais do OpenShell">
    - o navegador do sandbox ainda não é compatível
    - `sandbox.docker.binds` não é compatível no backend do OpenShell
    - controles de runtime específicos do Docker em `sandbox.docker.*` ainda se aplicam apenas ao backend Docker

  </Accordion>
</AccordionGroup>

#### Modos de workspace

O OpenShell tem dois modelos de workspace. Esta é a parte que mais importa na prática.

<Tabs>
  <Tab title="mirror (local canônico)">
    Use `plugins.entries.openshell.config.mode: "mirror"` quando quiser que o **workspace local permaneça canônico**.

    Comportamento:

    - Antes de `exec`, o OpenClaw sincroniza o workspace local para o sandbox do OpenShell.
    - Após `exec`, o OpenClaw sincroniza o workspace remoto de volta para o workspace local.
    - As ferramentas de arquivo ainda operam pela ponte do sandbox, mas o workspace local continua sendo a fonte da verdade entre turnos.

    Use isto quando:

    - você edita arquivos localmente fora do OpenClaw e quer que essas alterações apareçam no sandbox automaticamente
    - você quer que o sandbox do OpenShell se comporte o mais parecido possível com o backend Docker
    - você quer que o workspace do host reflita as gravações do sandbox após cada turno de exec

    Tradeoff: custo extra de sincronização antes e depois do exec.

  </Tab>
  <Tab title="remote (OpenShell canônico)">
    Use `plugins.entries.openshell.config.mode: "remote"` quando quiser que o **workspace do OpenShell se torne canônico**.

    Comportamento:

    - Quando o sandbox é criado pela primeira vez, o OpenClaw inicializa o workspace remoto a partir do workspace local uma vez.
    - Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam diretamente no workspace remoto do OpenShell.
    - O OpenClaw **não** sincroniza alterações remotas de volta para o workspace local após o exec.
    - Leituras de mídia no momento do prompt ainda funcionam porque as ferramentas de arquivo e mídia leem pela ponte do sandbox em vez de assumir um caminho local do host.
    - O transporte é SSH para o sandbox do OpenShell retornado por `openshell sandbox ssh-config`.

    Consequências importantes:

    - Se você editar arquivos no host fora do OpenClaw após a etapa de inicialização, o sandbox remoto **não** verá essas alterações automaticamente.
    - Se o sandbox for recriado, o workspace remoto será inicializado a partir do workspace local novamente.
    - Com `scope: "agent"` ou `scope: "shared"`, esse workspace remoto é compartilhado nesse mesmo escopo.

    Use isto quando:

    - o sandbox deve viver principalmente no lado remoto do OpenShell
    - você quer menor sobrecarga de sincronização por turno
    - você não quer que edições locais do host sobrescrevam silenciosamente o estado do sandbox remoto

  </Tab>
</Tabs>

Escolha `mirror` se você pensa no sandbox como um ambiente de execução temporário. Escolha `remote` se você pensa no sandbox como o workspace real.

#### Ciclo de vida do OpenShell

Os sandboxes do OpenShell ainda são gerenciados pelo ciclo de vida normal de sandbox:

- `openclaw sandbox list` mostra runtimes do OpenShell e também runtimes Docker
- `openclaw sandbox recreate` exclui o runtime atual e permite que o OpenClaw o recrie no próximo uso
- a lógica de prune também é ciente do backend

Para o modo `remote`, recriar é especialmente importante:

- recriar exclui o workspace remoto canônico desse escopo
- o próximo uso inicializa um workspace remoto novo a partir do workspace local

Para o modo `mirror`, recriar principalmente redefine o ambiente de execução remoto, porque o workspace local permanece canônico de qualquer forma.

## Acesso ao workspace

`agents.defaults.sandbox.workspaceAccess` controla **o que o sandbox pode ver**:

<Tabs>
  <Tab title="none (padrão)">
    As ferramentas veem um workspace de sandbox em `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta o workspace do agente como somente leitura em `/agent` (desabilita `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta o workspace do agente como leitura/gravação em `/workspace`.
  </Tab>
</Tabs>

Com o backend do OpenShell:

- o modo `mirror` ainda usa o workspace local como a fonte canônica entre turnos de exec
- o modo `remote` usa o workspace remoto do OpenShell como a fonte canônica após a inicialização inicial
- `workspaceAccess: "ro"` e `"none"` ainda restringem o comportamento de gravação da mesma forma

Mídia de entrada é copiada para o workspace ativo do sandbox (`media/inbound/*`).

<Note>
**Observação sobre Skills:** a ferramenta `read` é enraizada no sandbox. Com `workspaceAccess: "none"`, o OpenClaw espelha Skills qualificadas para o workspace do sandbox (`.../skills`) para que possam ser lidas. Com `"rw"`, Skills do workspace são legíveis em `/workspace/skills`, e Skills gerenciadas, empacotadas ou de Plugin qualificadas são materializadas no caminho somente leitura gerado `/workspace/.openclaw/sandbox-skills/skills`.
</Note>

## Montagens bind personalizadas

`agents.defaults.sandbox.docker.binds` monta diretórios adicionais do host no contêiner. Formato: `host:container:mode` (por exemplo, `"/home/user/source:/source:rw"`).

Binds globais e por agente são **mesclados** (não substituídos). Em `scope: "shared"`, binds por agente são ignorados.

`agents.defaults.sandbox.browser.binds` monta diretórios adicionais do host apenas no contêiner do **navegador do sandbox**.

- Quando definido (incluindo `[]`), ele substitui `agents.defaults.sandbox.docker.binds` para o contêiner do navegador.
- Quando omitido, o contêiner do navegador recorre a `agents.defaults.sandbox.docker.binds` (compatível com versões anteriores).

Exemplo (código-fonte somente leitura + um diretório de dados extra):

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
**Segurança de bind**

- Binds contornam o sistema de arquivos do sandbox: eles expõem caminhos do host com qualquer modo que você definir (`:ro` ou `:rw`).
- O OpenClaw bloqueia fontes de bind perigosas (por exemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e montagens pai que as exporiam).
- O OpenClaw também bloqueia raízes comuns de credenciais do diretório inicial, como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- A validação de bind não é apenas correspondência de strings. O OpenClaw normaliza o caminho de origem e depois o resolve novamente pelo ancestral existente mais profundo antes de verificar novamente caminhos bloqueados e raízes permitidas.
- Isso significa que escapes por symlink em diretórios pai ainda falham de modo fechado, mesmo quando a folha final ainda não existe. Exemplo: `/workspace/run-link/new-file` ainda resolve como `/var/run/...` se `run-link` apontar para lá.
- Raízes de origem permitidas são canonicalizadas da mesma forma, então um caminho que só parece estar dentro da allowlist antes da resolução de symlink ainda é rejeitado como `outside allowed roots`.
- Montagens sensíveis (segredos, chaves SSH, credenciais de serviço) devem ser `:ro`, a menos que seja absolutamente necessário.
- Combine com `workspaceAccess: "ro"` se você só precisar de acesso de leitura ao workspace; os modos de bind permanecem independentes.
- Consulte [Sandbox vs Política de Ferramentas vs Elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para saber como binds interagem com a política de ferramentas e exec elevado.

</Warning>

## Imagens e configuração

Imagem Docker padrão: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout de código-fonte vs npm install**

Os scripts auxiliares `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` e `scripts/sandbox-browser-setup.sh` só estão disponíveis ao executar a partir de um [checkout de código-fonte](https://github.com/openclaw/openclaw). Eles não estão incluídos no pacote npm.

Se você instalou o OpenClaw via `npm install -g openclaw`, use os comandos `docker build` inline mostrados abaixo.
</Note>

<Steps>
  <Step title="Crie a imagem padrão">
    A partir de um checkout de código-fonte:

    ```bash
    scripts/sandbox-setup.sh
    ```

    A partir de uma instalação npm (sem necessidade de checkout de código-fonte):

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

    A imagem padrão **não** inclui Node. Se uma Skill precisar de Node (ou outros runtimes), inclua em uma imagem personalizada ou instale via `sandbox.docker.setupCommand` (requer saída de rede + root gravável + usuário root).

    O OpenClaw não substitui silenciosamente por `debian:bookworm-slim` puro quando `openclaw-sandbox:bookworm-slim` está ausente. Execuções de sandbox que miram a imagem padrão falham rapidamente com uma instrução de build até que você a crie, porque a imagem empacotada carrega `python3` para auxiliares de gravação/edição do sandbox.

  </Step>
  <Step title="Opcional: crie a imagem comum">
    Para uma imagem de sandbox mais funcional com ferramentas comuns (por exemplo, `curl`, `jq`, Node 24, pnpm, `python3` e `git`):

    A partir de um checkout de código-fonte:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    A partir de uma instalação npm, crie a imagem padrão primeiro (veja acima) e depois crie a imagem comum sobre ela usando o [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) do repositório.

    Depois defina `agents.defaults.sandbox.docker.image` como `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: crie a imagem do navegador do sandbox">
    A partir de um checkout de código-fonte:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    A partir de uma instalação npm, crie usando o [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) do repositório.

  </Step>
</Steps>

Por padrão, contêineres de sandbox Docker são executados **sem rede**. Substitua com `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Padrões do Chromium do navegador do sandbox">
    A imagem empacotada do navegador do sandbox também aplica padrões conservadores de inicialização do Chromium para cargas de trabalho conteinerizadas. Os padrões atuais do contêiner incluem:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-3d-apis`
    - `--disable-gpu`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-extensions`
    - `--disable-features=TranslateUI`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--disable-software-rasterizer`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--renderer-process-limit=2`
    - `--no-sandbox` quando `noSandbox` está habilitado.
    - As três flags de reforço gráfico (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) são opcionais e são úteis quando contêineres não têm suporte a GPU. Defina `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se sua carga de trabalho exigir WebGL ou outros recursos 3D/de navegador.
    - `--disable-extensions` é habilitado por padrão e pode ser desabilitado com `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para fluxos que dependem de extensões.
    - `--renderer-process-limit=2` é controlado por `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, em que `0` mantém o padrão do Chromium.

    Se você precisar de um perfil de runtime diferente, use uma imagem de navegador personalizada e forneça seu próprio entrypoint. Para perfis locais (não contêiner) do Chromium, use `browser.extraArgs` para anexar flags adicionais de inicialização.

  </Accordion>
  <Accordion title="Padrões de segurança de rede">
    - `network: "host"` é bloqueado.
    - `network: "container:<id>"` é bloqueado por padrão (risco de bypass por ingresso no namespace).
    - Substituição de emergência: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

As instalações com Docker e o Gateway em contêiner ficam aqui: [Docker](/pt-BR/install/docker)

Para implantações do Gateway com Docker, `scripts/docker/setup.sh` pode inicializar a configuração do sandbox. Defina `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) para habilitar esse caminho. Você pode substituir o local do socket com `OPENCLAW_DOCKER_SOCKET`. Configuração completa e referência de env: [Docker](/pt-BR/install/docker#agent-sandbox).

## setupCommand (configuração única do contêiner)

`setupCommand` é executado **uma vez** depois que o contêiner do sandbox é criado (não em toda execução). Ele é executado dentro do contêiner via `sh -lc`.

Caminhos:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Armadilhas comuns">
    - O `docker.network` padrão é `"none"` (sem saída), então instalações de pacotes vão falhar.
    - `docker.network: "container:<id>"` exige `dangerouslyAllowContainerNamespaceJoin: true` e deve ser usado apenas como substituição de emergência.
    - `readOnlyRoot: true` impede gravações; defina `readOnlyRoot: false` ou crie uma imagem personalizada.
    - `user` deve ser root para instalações de pacotes (omita `user` ou defina `user: "0:0"`).
    - Execução no sandbox **não** herda o `process.env` do host. Use `agents.defaults.sandbox.docker.env` (ou uma imagem personalizada) para chaves de API de Skills.
    - Valores em `agents.defaults.sandbox.docker.env` são passados como variáveis de ambiente explícitas do contêiner Docker. Qualquer pessoa com acesso ao daemon do Docker pode inspecioná-los com comandos de metadados do Docker, como `docker inspect`. Use uma imagem personalizada, um arquivo de segredo montado ou outro caminho de entrega de segredos se essa exposição de metadados não for aceitável.

  </Accordion>
</AccordionGroup>

## Política de ferramentas e rotas de escape

As políticas de permissão/bloqueio de ferramentas ainda se aplicam antes das regras de sandbox. Se uma ferramenta for negada globalmente ou por agente, o sandbox não a reabilita.

`tools.elevated` é uma rota de escape explícita que executa `exec` fora do sandbox (`gateway` por padrão, ou `node` quando o alvo de exec é `node`). Diretivas `/exec` só se aplicam a remetentes autorizados e persistem por sessão; para desabilitar `exec` rigidamente, use uma política de negação de ferramenta (veja [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuração:

- Use `openclaw sandbox explain` para inspecionar o modo de sandbox efetivo, a política de ferramentas e as chaves de configuração de correção.
- Veja [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para o modelo mental de "por que isto está bloqueado?".

Mantenha tudo bloqueado.

## Substituições para vários agentes

Cada agente pode substituir sandbox + ferramentas: `agents.list[].sandbox` e `agents.list[].tools` (mais `agents.list[].tools.sandbox.tools` para a política de ferramentas do sandbox). Veja [Multi-Agent Sandbox & Tools](/pt-BR/tools/multi-agent-sandbox-tools) para a precedência.

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

- [Multi-Agent Sandbox & Tools](/pt-BR/tools/multi-agent-sandbox-tools) — substituições por agente e precedência
- [OpenShell](/pt-BR/gateway/openshell) — configuração de backend de sandbox gerenciado, modos de workspace e referência de configuração
- [Configuração de sandbox](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — depuração de "por que isto está bloqueado?"
- [Segurança](/pt-BR/gateway/security)
