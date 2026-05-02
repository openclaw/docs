---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Como funciona o isolamento em sandbox do OpenClaw: modos, escopos, acesso ao espaço de trabalho e imagens'
title: Isolamento em sandbox
x-i18n:
    generated_at: "2026-05-02T05:47:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw pode executar **ferramentas dentro de backends de sandbox** para reduzir o raio de impacto. Isso é **opcional** e controlado pela configuração (`agents.defaults.sandbox` ou `agents.list[].sandbox`). Se o sandboxing estiver desativado, as ferramentas rodam no host. O Gateway permanece no host; a execução de ferramentas roda em um sandbox isolado quando habilitada.

<Note>
Este não é um limite de segurança perfeito, mas limita materialmente o acesso ao sistema de arquivos e a processos quando o modelo faz algo imprudente.
</Note>

## O que entra no sandbox

- Execução de ferramentas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navegador opcional em sandbox (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - Por padrão, o navegador em sandbox inicia automaticamente (garante que o CDP esteja acessível) quando a ferramenta de navegador precisa dele. Configure via `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Por padrão, os contêineres do navegador em sandbox usam uma rede Docker dedicada (`openclaw-sandbox-browser`) em vez da rede global `bridge`. Configure com `agents.defaults.sandbox.browser.network`.
    - O `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe a entrada CDP na borda do contêiner com uma lista de permissões CIDR (por exemplo, `172.21.0.1/32`).
    - O acesso de observador noVNC é protegido por senha por padrão; o OpenClaw emite uma URL de token de curta duração que serve uma página de bootstrap local e abre o noVNC com a senha no fragmento da URL (não em logs de consulta/cabeçalho).
    - `agents.defaults.sandbox.browser.allowHostControl` permite que sessões em sandbox direcionem explicitamente o navegador do host.
    - Listas de permissão opcionais controlam `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Não entram no sandbox:

- O próprio processo do Gateway.
- Qualquer ferramenta explicitamente autorizada a rodar fora do sandbox (por exemplo, `tools.elevated`).
  - **Exec elevado contorna o sandboxing e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o alvo do exec é `node`).**
  - Se o sandboxing estiver desativado, `tools.elevated` não altera a execução (já está no host). Consulte [Modo Elevado](/pt-BR/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **quando** o sandboxing é usado:

<Tabs>
  <Tab title="off">
    Sem sandboxing.
  </Tab>
  <Tab title="non-main">
    Coloca em sandbox apenas sessões **non-main** (padrão se você quer chats normais no host).

    `"non-main"` é baseado em `session.mainKey` (padrão `"main"`), não no ID do agente. Sessões de grupo/canal usam suas próprias chaves, então contam como non-main e serão colocadas em sandbox.

  </Tab>
  <Tab title="all">
    Todas as sessões rodam em um sandbox.
  </Tab>
</Tabs>

## Escopo

`agents.defaults.sandbox.scope` controla **quantos contêineres** são criados:

- `"agent"` (padrão): um contêiner por agente.
- `"session"`: um contêiner por sessão.
- `"shared"`: um contêiner compartilhado por todas as sessões em sandbox.

## Backend

`agents.defaults.sandbox.backend` controla **qual runtime** fornece o sandbox:

- `"docker"` (padrão quando o sandboxing está habilitado): runtime de sandbox local baseado em Docker.
- `"ssh"`: runtime de sandbox remoto genérico baseado em SSH.
- `"openshell"`: runtime de sandbox baseado em OpenShell.

A configuração específica de SSH fica em `agents.defaults.sandbox.ssh`. A configuração específica de OpenShell fica em `plugins.entries.openshell.config`.

### Escolhendo um backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Onde roda**   | Contêiner local                  | Qualquer host acessível por SSH        | Sandbox gerenciado pelo OpenShell                           |
| **Configuração**           | `scripts/sandbox-setup.sh`       | Chave SSH + host de destino          | Plugin OpenShell habilitado                            |
| **Modelo de espaço de trabalho** | Bind mount ou cópia               | Canônico remoto (semeado uma vez)   | `mirror` ou `remote`                                |
| **Controle de rede** | `docker.network` (padrão: nenhuma) | Depende do host remoto         | Depende do OpenShell                                |
| **Sandbox de navegador** | Compatível                        | Não compatível                  | Ainda não compatível                                   |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Melhor para**        | Desenvolvimento local, isolamento completo        | Descarregar para uma máquina remota | Sandboxes remotos gerenciados com sincronização bidirecional opcional |

### Backend Docker

O sandboxing é desativado por padrão. Se você habilitar o sandboxing e não escolher um backend, o OpenClaw usa o backend Docker. Ele executa ferramentas e navegadores em sandbox localmente via socket do daemon Docker (`/var/run/docker.sock`). O isolamento do contêiner de sandbox é determinado pelos namespaces do Docker.

Para expor GPUs do host aos sandboxes Docker, defina `agents.defaults.sandbox.docker.gpus` ou a substituição por agente `agents.list[].sandbox.docker.gpus`. O valor é passado para a flag `--gpus` do Docker como um argumento separado, por exemplo `"all"` ou `"device=GPU-uuid"`, e exige um runtime de host compatível, como o NVIDIA Container Toolkit.

<Warning>
**Restrições de Docker-out-of-Docker (DooD)**

Se você implantar o próprio OpenClaw Gateway como um contêiner Docker, ele orquestra contêineres de sandbox irmãos usando o socket Docker do host (DooD). Isso introduz uma restrição específica de mapeamento de caminhos:

- **A configuração exige caminhos do host**: A configuração `workspace` do `openclaw.json` DEVE conter o **caminho absoluto do host** (por exemplo, `/home/user/.openclaw/workspaces`), não o caminho interno do contêiner do Gateway. Quando o OpenClaw solicita ao daemon Docker que gere um sandbox, o daemon avalia caminhos relativos ao namespace do SO host, não ao namespace do Gateway.
- **Paridade da ponte FS (mapa de volume idêntico)**: O processo nativo do OpenClaw Gateway também grava arquivos de Heartbeat e de ponte no diretório `workspace`. Como o Gateway avalia exatamente a mesma string (o caminho do host) de dentro de seu próprio ambiente conteinerizado, a implantação do Gateway DEVE incluir um mapa de volume idêntico vinculando o namespace do host nativamente (`-v /home/user/.openclaw:/home/user/.openclaw`).

Se você mapear caminhos internamente sem paridade absoluta com o host, o OpenClaw lança nativamente um erro de permissão `EACCES` ao tentar gravar seu Heartbeat dentro do ambiente do contêiner, porque a string de caminho totalmente qualificada não existe nativamente.
</Warning>

### Backend SSH

Use `backend: "ssh"` quando quiser que o OpenClaw coloque `exec`, ferramentas de arquivo e leituras de mídia em sandbox em uma máquina arbitrária acessível por SSH.

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
  <Accordion title="How it works">
    - O OpenClaw cria uma raiz remota por escopo em `sandbox.ssh.workspaceRoot`.
    - No primeiro uso após criar ou recriar, o OpenClaw semeia esse espaço de trabalho remoto a partir do espaço de trabalho local uma vez.
    - Depois disso, `exec`, `read`, `write`, `edit`, `apply_patch`, leituras de mídia do prompt e preparação de mídia de entrada rodam diretamente contra o espaço de trabalho remoto via SSH.
    - O OpenClaw não sincroniza alterações remotas de volta para o espaço de trabalho local automaticamente.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usam arquivos locais existentes e os passam pela configuração do OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usam strings inline ou SecretRefs. O OpenClaw as resolve pelo snapshot normal do runtime de segredos, grava em arquivos temporários com `0600` e as exclui quando a sessão SSH termina.
    - Se `*File` e `*Data` estiverem definidos para o mesmo item, `*Data` prevalece nessa sessão SSH.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    Este é um modelo **canônico remoto**. O espaço de trabalho SSH remoto se torna o estado real do sandbox após a semeadura inicial.

    - Edições locais do host feitas fora do OpenClaw após a etapa de semeadura não ficam visíveis remotamente até você recriar o sandbox.
    - `openclaw sandbox recreate` exclui a raiz remota por escopo e semeia novamente a partir do local no próximo uso.
    - Sandboxing de navegador não é compatível com o backend SSH.
    - As configurações `sandbox.docker.*` não se aplicam ao backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Use `backend: "openshell"` quando quiser que o OpenClaw coloque ferramentas em sandbox em um ambiente remoto gerenciado pelo OpenShell. Para o guia completo de configuração, referência de configuração e comparação de modos de espaço de trabalho, consulte a [página dedicada do OpenShell](/pt-BR/gateway/openshell).

O OpenShell reutiliza o mesmo transporte SSH central e a ponte de sistema de arquivos remoto do backend SSH genérico, e adiciona ciclo de vida específico do OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) mais o modo opcional de espaço de trabalho `mirror`.

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

- `mirror` (padrão): o espaço de trabalho local permanece canônico. O OpenClaw sincroniza arquivos locais para o OpenShell antes do exec e sincroniza o espaço de trabalho remoto de volta após o exec.
- `remote`: o espaço de trabalho do OpenShell é canônico após o sandbox ser criado. O OpenClaw semeia o espaço de trabalho remoto uma vez a partir do espaço de trabalho local, depois ferramentas de arquivo e exec rodam diretamente contra o sandbox remoto sem sincronizar alterações de volta.

<AccordionGroup>
  <Accordion title="Remote transport details">
    - O OpenClaw solicita ao OpenShell uma configuração SSH específica do sandbox via `openshell sandbox ssh-config <name>`.
    - O core grava essa configuração SSH em um arquivo temporário, abre a sessão SSH e reutiliza a mesma ponte de sistema de arquivos remoto usada por `backend: "ssh"`.
    - No modo `mirror`, apenas o ciclo de vida difere: sincroniza o local para o remoto antes do exec e depois sincroniza de volta após o exec.

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - navegador em sandbox ainda não é compatível
    - `sandbox.docker.binds` não é compatível com o backend OpenShell
    - ajustes de runtime específicos do Docker em `sandbox.docker.*` ainda se aplicam apenas ao backend Docker

  </Accordion>
</AccordionGroup>

#### Modos de espaço de trabalho

O OpenShell tem dois modelos de espaço de trabalho. Esta é a parte que mais importa na prática.

<Tabs>
  <Tab title="mirror (local canonical)">
    Use `plugins.entries.openshell.config.mode: "mirror"` quando quiser que o **espaço de trabalho local permaneça canônico**.

    Comportamento:

    - Antes de `exec`, o OpenClaw sincroniza o espaço de trabalho local para o sandbox OpenShell.
    - Após `exec`, o OpenClaw sincroniza o espaço de trabalho remoto de volta para o espaço de trabalho local.
    - Ferramentas de arquivo ainda operam pela ponte de sandbox, mas o espaço de trabalho local permanece a fonte da verdade entre turnos.

    Use isto quando:

    - você edita arquivos localmente fora do OpenClaw e quer que essas alterações apareçam automaticamente no sandbox
    - você quer que o sandbox OpenShell se comporte o máximo possível como o backend Docker
    - você quer que o workspace do host reflita escritas do sandbox após cada turno de exec

    Trade-off: custo extra de sincronização antes e depois do exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Use `plugins.entries.openshell.config.mode: "remote"` quando quiser que o **workspace OpenShell se torne canônico**.

    Comportamento:

    - Quando o sandbox é criado pela primeira vez, o OpenClaw inicializa o workspace remoto a partir do workspace local uma vez.
    - Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam diretamente no workspace OpenShell remoto.
    - O OpenClaw **não** sincroniza alterações remotas de volta para o workspace local após exec.
    - Leituras de mídia no momento do prompt ainda funcionam porque as ferramentas de arquivo e mídia leem pela ponte do sandbox em vez de presumir um caminho de host local.
    - O transporte é SSH para o sandbox OpenShell retornado por `openshell sandbox ssh-config`.

    Consequências importantes:

    - Se você editar arquivos no host fora do OpenClaw após a etapa de inicialização, o sandbox remoto **não** verá essas alterações automaticamente.
    - Se o sandbox for recriado, o workspace remoto será inicializado a partir do workspace local novamente.
    - Com `scope: "agent"` ou `scope: "shared"`, esse workspace remoto é compartilhado no mesmo escopo.

    Use isto quando:

    - o sandbox deve existir principalmente no lado remoto do OpenShell
    - você quer menor sobrecarga de sincronização por turno
    - você não quer que edições locais do host sobrescrevam silenciosamente o estado remoto do sandbox

  </Tab>
</Tabs>

Escolha `mirror` se você pensa no sandbox como um ambiente de execução temporário. Escolha `remote` se você pensa no sandbox como o workspace real.

#### Ciclo de vida do OpenShell

Sandboxes OpenShell ainda são gerenciados pelo ciclo de vida normal do sandbox:

- `openclaw sandbox list` mostra runtimes OpenShell, assim como runtimes Docker
- `openclaw sandbox recreate` exclui o runtime atual e permite que o OpenClaw o recrie no próximo uso
- a lógica de limpeza também é ciente do backend

Para o modo `remote`, recriar é especialmente importante:

- recriar exclui o workspace remoto canônico desse escopo
- o próximo uso inicializa um workspace remoto novo a partir do workspace local

Para o modo `mirror`, recriar principalmente redefine o ambiente de execução remoto, porque o workspace local continua canônico de qualquer forma.

## Acesso ao workspace

`agents.defaults.sandbox.workspaceAccess` controla **o que o sandbox pode ver**:

<Tabs>
  <Tab title="none (default)">
    As ferramentas veem um workspace de sandbox em `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta o workspace do agente como somente leitura em `/agent` (desativa `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta o workspace do agente com leitura/escrita em `/workspace`.
  </Tab>
</Tabs>

Com o backend OpenShell:

- o modo `mirror` ainda usa o workspace local como a origem canônica entre turnos de exec
- o modo `remote` usa o workspace OpenShell remoto como a origem canônica após a inicialização inicial
- `workspaceAccess: "ro"` e `"none"` ainda restringem o comportamento de escrita da mesma forma

Mídia de entrada é copiada para o workspace ativo do sandbox (`media/inbound/*`).

<Note>
**Observação sobre Skills:** a ferramenta `read` é enraizada no sandbox. Com `workspaceAccess: "none"`, o OpenClaw espelha skills elegíveis no workspace do sandbox (`.../skills`) para que possam ser lidas. Com `"rw"`, skills do workspace podem ser lidas a partir de `/workspace/skills`.
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
- O OpenClaw bloqueia origens de bind perigosas (por exemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e montagens pai que as exporiam).
- O OpenClaw também bloqueia raízes comuns de credenciais de diretórios home, como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- A validação de bind não é apenas correspondência de strings. O OpenClaw normaliza o caminho de origem e depois o resolve novamente pelo ancestral existente mais profundo antes de verificar de novo caminhos bloqueados e raízes permitidas.
- Isso significa que escapes por pai de symlink ainda falham fechados, mesmo quando a folha final ainda não existe. Exemplo: `/workspace/run-link/new-file` ainda é resolvido como `/var/run/...` se `run-link` apontar para lá.
- Raízes de origem permitidas são canonizadas da mesma forma, então um caminho que só parece estar dentro da lista de permissões antes da resolução de symlink ainda é rejeitado como `outside allowed roots`.
- Montagens sensíveis (segredos, chaves SSH, credenciais de serviço) devem ser `:ro`, a menos que seja absolutamente necessário.
- Combine com `workspaceAccess: "ro"` se você só precisa de acesso de leitura ao workspace; os modos de bind permanecem independentes.
- Consulte [Sandbox vs Política de Ferramentas vs Elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para saber como binds interagem com política de ferramentas e exec elevado.

</Warning>

## Imagens e configuração

Imagem Docker padrão: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout do código-fonte vs instalação via npm**

Os scripts auxiliares `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` e `scripts/sandbox-browser-setup.sh` só estão disponíveis ao executar a partir de um [checkout do código-fonte](https://github.com/openclaw/openclaw). Eles não estão incluídos no pacote npm.

Se você instalou o OpenClaw via `npm install -g openclaw`, use os comandos inline de `docker build` mostrados abaixo.
</Note>

<Steps>
  <Step title="Criar a imagem padrão">
    A partir de um checkout do código-fonte:

    ```bash
    scripts/sandbox-setup.sh
    ```

    A partir de uma instalação via npm (sem necessidade de checkout do código-fonte):

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

    A imagem padrão **não** inclui Node. Se uma skill precisar de Node (ou de outros runtimes), crie uma imagem personalizada ou instale via `sandbox.docker.setupCommand` (requer saída de rede + raiz gravável + usuário root).

    O OpenClaw não substitui silenciosamente por `debian:bookworm-slim` simples quando `openclaw-sandbox:bookworm-slim` está ausente. Execuções de sandbox que miram a imagem padrão falham rapidamente com uma instrução de build até que você a crie, porque a imagem incluída traz `python3` para auxiliares de escrita/edição no sandbox.

  </Step>
  <Step title="Opcional: criar a imagem comum">
    Para uma imagem de sandbox mais funcional com ferramentas comuns (por exemplo, `curl`, `jq`, `nodejs`, `python3`, `git`):

    A partir de um checkout do código-fonte:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    A partir de uma instalação via npm, crie primeiro a imagem padrão (veja acima) e depois crie a imagem comum sobre ela usando o [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) do repositório.

    Em seguida, defina `agents.defaults.sandbox.docker.image` como `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: criar a imagem de navegador do sandbox">
    A partir de um checkout do código-fonte:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    A partir de uma instalação via npm, crie usando o [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) do repositório.

  </Step>
</Steps>

Por padrão, containers Docker de sandbox são executados **sem rede**. Substitua com `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Padrões do Chromium do navegador do sandbox">
    A imagem de navegador do sandbox incluída também aplica padrões conservadores de inicialização do Chromium para cargas de trabalho em containers. Os padrões atuais de container incluem:

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
    - As três flags de reforço gráfico (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) são opcionais e são úteis quando containers não têm suporte a GPU. Defina `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se sua carga de trabalho exigir WebGL ou outros recursos 3D/de navegador.
    - `--disable-extensions` é habilitado por padrão e pode ser desabilitado com `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para fluxos que dependem de extensões.
    - `--renderer-process-limit=2` é controlado por `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, em que `0` mantém o padrão do Chromium.

    Se você precisar de um perfil de runtime diferente, use uma imagem de navegador personalizada e forneça seu próprio entrypoint. Para perfis locais (não containerizados) do Chromium, use `browser.extraArgs` para acrescentar flags de inicialização adicionais.

  </Accordion>
  <Accordion title="Padrões de segurança de rede">
    - `network: "host"` é bloqueado.
    - `network: "container:<id>"` é bloqueado por padrão (risco de bypass por associação de namespace).
    - Substituição de emergência: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalações Docker e o Gateway em container ficam aqui: [Docker](/pt-BR/install/docker)

Para implantações do Gateway com Docker, `scripts/docker/setup.sh` pode inicializar a configuração de sandbox. Defina `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) para habilitar esse caminho. Você pode substituir o local do socket com `OPENCLAW_DOCKER_SOCKET`. Configuração completa e referência de ambiente: [Docker](/pt-BR/install/docker#agent-sandbox).

## setupCommand (configuração única do container)

`setupCommand` é executado **uma vez** depois que o container de sandbox é criado (não a cada execução). Ele executa dentro do container via `sh -lc`.

Caminhos:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Armadilhas comuns">
    - O `docker.network` padrão é `"none"` (sem saída), então instalações de pacotes falharão.
    - `docker.network: "container:<id>"` requer `dangerouslyAllowContainerNamespaceJoin: true` e é apenas para emergências.
    - `readOnlyRoot: true` impede gravações; defina `readOnlyRoot: false` ou crie uma imagem personalizada.
    - `user` deve ser root para instalações de pacotes (omita `user` ou defina `user: "0:0"`).
    - A execução no sandbox **não** herda o `process.env` do host. Use `agents.defaults.sandbox.docker.env` (ou uma imagem personalizada) para chaves de API de skills.

  </Accordion>
</AccordionGroup>

## Política de ferramentas e rotas de escape

As políticas de permissão/negação de ferramentas ainda se aplicam antes das regras de sandbox. Se uma ferramenta for negada globalmente ou por agente, o sandbox não a restaura.

`tools.elevated` é uma rota de escape explícita que executa `exec` fora do sandbox (`gateway` por padrão, ou `node` quando o destino de exec é `node`). Diretivas `/exec` se aplicam apenas a remetentes autorizados e persistem por sessão; para desabilitar `exec` completamente, use a negação na política de ferramentas (veja [Sandbox vs Política de ferramentas vs Elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuração:

- Use `openclaw sandbox explain` para inspecionar o modo de sandbox efetivo, a política de ferramentas e as chaves de configuração de correção.
- Veja [Sandbox vs Política de ferramentas vs Elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para o modelo mental de "por que isso está bloqueado?".

Mantenha tudo bloqueado.

## Substituições multiagente

Cada agente pode substituir sandbox + ferramentas: `agents.list[].sandbox` e `agents.list[].tools` (mais `agents.list[].tools.sandbox.tools` para a política de ferramentas do sandbox). Veja [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) para a precedência.

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

- [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) — substituições por agente e precedência
- [OpenShell](/pt-BR/gateway/openshell) — configuração do backend de sandbox gerenciado, modos de workspace e referência de configuração
- [Configuração de sandbox](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Política de ferramentas vs Elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — depuração de "por que isso está bloqueado?"
- [Segurança](/pt-BR/gateway/security)
