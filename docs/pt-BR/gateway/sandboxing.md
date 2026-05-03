---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Como funciona o isolamento em sandbox do OpenClaw: modos, escopos, acesso ao espaço de trabalho e imagens'
title: Isolamento em sandbox
x-i18n:
    generated_at: "2026-05-03T21:32:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e887d07ed84d582bb605c75f841499b6bed42cfc94d60690aba33c2f351b272b
    source_path: gateway/sandboxing.md
    workflow: 16
---

O OpenClaw pode executar **ferramentas dentro de backends de sandbox** para reduzir o raio de impacto. Isso é **opcional** e controlado por configuração (`agents.defaults.sandbox` ou `agents.list[].sandbox`). Se o sandboxing estiver desativado, as ferramentas rodam no host. O Gateway permanece no host; a execução de ferramentas roda em um sandbox isolado quando habilitada.

<Note>
Este não é um limite de segurança perfeito, mas limita de forma significativa o acesso ao sistema de arquivos e a processos quando o modelo faz algo inadequado.
</Note>

## O que entra em sandbox

- Execução de ferramentas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navegador opcional em sandbox (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Detalhes do navegador em sandbox">
    - Por padrão, o navegador em sandbox inicia automaticamente (garante que o CDP esteja acessível) quando a ferramenta de navegador precisa dele. Configure por meio de `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Por padrão, os contêineres do navegador em sandbox usam uma rede Docker dedicada (`openclaw-sandbox-browser`) em vez da rede global `bridge`. Configure com `agents.defaults.sandbox.browser.network`.
    - O `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe a entrada CDP na borda do contêiner com uma allowlist CIDR (por exemplo, `172.21.0.1/32`).
    - O acesso de observador noVNC é protegido por senha por padrão; o OpenClaw emite uma URL de token de curta duração que serve uma página local de bootstrap e abre o noVNC com a senha no fragmento da URL (não em logs de consulta/cabeçalho).
    - `agents.defaults.sandbox.browser.allowHostControl` permite que sessões em sandbox apontem explicitamente para o navegador do host.
    - Allowlists opcionais controlam `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Não entram em sandbox:

- O próprio processo do Gateway.
- Qualquer ferramenta explicitamente autorizada a rodar fora do sandbox (por exemplo, `tools.elevated`).
  - **Execução elevada ignora o sandboxing e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o alvo de execução é `node`).**
  - Se o sandboxing estiver desativado, `tools.elevated` não altera a execução (já está no host). Veja [Modo Elevado](/pt-BR/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **quando** o sandboxing é usado:

<Tabs>
  <Tab title="off">
    Sem sandboxing.
  </Tab>
  <Tab title="non-main">
    Coloca em sandbox apenas sessões **non-main** (padrão se você quiser conversas normais no host).

    `"non-main"` se baseia em `session.mainKey` (padrão `"main"`), não no id do agente. Sessões de grupo/canal usam suas próprias chaves, então contam como non-main e serão colocadas em sandbox.

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

- `"docker"` (padrão quando o sandboxing está habilitado): runtime de sandbox local com backend Docker.
- `"ssh"`: runtime de sandbox remoto genérico com backend SSH.
- `"openshell"`: runtime de sandbox com backend OpenShell.

A configuração específica de SSH fica em `agents.defaults.sandbox.ssh`. A configuração específica de OpenShell fica em `plugins.entries.openshell.config`.

### Escolhendo um backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Onde roda**       | Contêiner local                  | Qualquer host acessível por SSH | Sandbox gerenciado pelo OpenShell                   |
| **Configuração**    | `scripts/sandbox-setup.sh`       | Chave SSH + host de destino    | Plugin OpenShell habilitado                         |
| **Modelo de workspace** | Bind mount ou cópia          | Canônico remoto (semeado uma vez) | `mirror` ou `remote`                              |
| **Controle de rede** | `docker.network` (padrão: nenhuma) | Depende do host remoto      | Depende do OpenShell                                |
| **Sandbox de navegador** | Compatível                  | Não compatível                 | Ainda não compatível                                |
| **Bind mounts**     | `docker.binds`                   | N/D                            | N/D                                                 |
| **Melhor para**     | Desenvolvimento local, isolamento completo | Transferir carga para uma máquina remota | Sandboxes remotos gerenciados com sincronização bidirecional opcional |

### Backend Docker

O sandboxing fica desativado por padrão. Se você habilitar o sandboxing e não escolher um backend, o OpenClaw usa o backend Docker. Ele executa ferramentas e navegadores em sandbox localmente por meio do socket do daemon Docker (`/var/run/docker.sock`). O isolamento do contêiner de sandbox é determinado pelos namespaces do Docker.

Para expor GPUs do host aos sandboxes Docker, defina `agents.defaults.sandbox.docker.gpus` ou a substituição por agente `agents.list[].sandbox.docker.gpus`. O valor é passado para a flag `--gpus` do Docker como um argumento separado, por exemplo `"all"` ou `"device=GPU-uuid"`, e exige um runtime de host compatível, como NVIDIA Container Toolkit.

<Warning>
**Restrições de Docker-out-of-Docker (DooD)**

Se você implantar o próprio OpenClaw Gateway como um contêiner Docker, ele orquestra contêineres de sandbox irmãos usando o socket Docker do host (DooD). Isso introduz uma restrição específica de mapeamento de caminhos:

- **A configuração exige caminhos do host**: A configuração `workspace` em `openclaw.json` DEVE conter o **caminho absoluto do host** (por exemplo, `/home/user/.openclaw/workspaces`), não o caminho interno do contêiner do Gateway. Quando o OpenClaw pede ao daemon Docker para criar um sandbox, o daemon avalia caminhos em relação ao namespace do sistema operacional do host, não ao namespace do Gateway.
- **Paridade da ponte FS (mapa de volumes idêntico)**: O processo nativo do OpenClaw Gateway também grava arquivos de Heartbeat e de ponte no diretório `workspace`. Como o Gateway avalia a mesma string exata (o caminho do host) dentro de seu próprio ambiente conteinerizado, a implantação do Gateway DEVE incluir um mapa de volumes idêntico vinculando o namespace do host nativamente (`-v /home/user/.openclaw:/home/user/.openclaw`).

Se você mapear caminhos internamente sem paridade absoluta com o host, o OpenClaw gera nativamente um erro de permissão `EACCES` ao tentar gravar seu Heartbeat dentro do ambiente do contêiner porque a string de caminho totalmente qualificada não existe nativamente.
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
  <Accordion title="Como funciona">
    - O OpenClaw cria uma raiz remota por escopo em `sandbox.ssh.workspaceRoot`.
    - No primeiro uso após criar ou recriar, o OpenClaw semeia esse workspace remoto a partir do workspace local uma vez.
    - Depois disso, `exec`, `read`, `write`, `edit`, `apply_patch`, leituras de mídia de prompt e staging de mídia recebida rodam diretamente no workspace remoto por SSH.
    - O OpenClaw não sincroniza alterações remotas de volta para o workspace local automaticamente.

  </Accordion>
  <Accordion title="Material de autenticação">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usam arquivos locais existentes e os passam pela configuração do OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usam strings inline ou SecretRefs. O OpenClaw os resolve pelo snapshot normal do runtime de segredos, grava-os em arquivos temporários com `0600` e os exclui quando a sessão SSH termina.
    - Se `*File` e `*Data` estiverem definidos para o mesmo item, `*Data` prevalece nessa sessão SSH.

  </Accordion>
  <Accordion title="Consequências do modelo canônico remoto">
    Este é um modelo **canônico remoto**. O workspace SSH remoto se torna o estado real do sandbox após a semente inicial.

    - Edições locais do host feitas fora do OpenClaw depois da etapa de semente não ficam visíveis remotamente até você recriar o sandbox.
    - `openclaw sandbox recreate` exclui a raiz remota por escopo e semeia novamente a partir do local no próximo uso.
    - Sandboxing de navegador não é compatível com o backend SSH.
    - As configurações `sandbox.docker.*` não se aplicam ao backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Use `backend: "openshell"` quando quiser que o OpenClaw coloque ferramentas em sandbox em um ambiente remoto gerenciado pelo OpenShell. Para o guia completo de configuração, referência de configuração e comparação de modos de workspace, veja a [página do OpenShell](/pt-BR/gateway/openshell).

O OpenShell reutiliza o mesmo transporte SSH principal e a mesma ponte de sistema de arquivos remoto do backend SSH genérico, e adiciona ciclo de vida específico do OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) mais o modo de workspace `mirror` opcional.

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

Modos OpenShell:

- `mirror` (padrão): o workspace local permanece canônico. O OpenClaw sincroniza arquivos locais para o OpenShell antes de exec e sincroniza o workspace remoto de volta depois de exec.
- `remote`: o workspace OpenShell é canônico depois que o sandbox é criado. O OpenClaw semeia o workspace remoto uma vez a partir do workspace local; depois, ferramentas de arquivo e exec rodam diretamente no sandbox remoto sem sincronizar alterações de volta.

<AccordionGroup>
  <Accordion title="Detalhes do transporte remoto">
    - O OpenClaw pede ao OpenShell a configuração SSH específica do sandbox por meio de `openshell sandbox ssh-config <name>`.
    - O núcleo grava essa configuração SSH em um arquivo temporário, abre a sessão SSH e reutiliza a mesma ponte de sistema de arquivos remoto usada por `backend: "ssh"`.
    - No modo `mirror`, apenas o ciclo de vida difere: sincroniza o local para o remoto antes de exec e depois sincroniza de volta após exec.

  </Accordion>
  <Accordion title="Limitações atuais do OpenShell">
    - sandbox de navegador ainda não é compatível
    - `sandbox.docker.binds` não é compatível com o backend OpenShell
    - ajustes de runtime específicos do Docker em `sandbox.docker.*` continuam se aplicando apenas ao backend Docker

  </Accordion>
</AccordionGroup>

#### Modos de workspace

O OpenShell tem dois modelos de workspace. Esta é a parte que mais importa na prática.

<Tabs>
  <Tab title="mirror (local canonical)">
    Use `plugins.entries.openshell.config.mode: "mirror"` quando quiser que o **workspace local permaneça canônico**.

    Comportamento:

    - Antes de `exec`, o OpenClaw sincroniza o workspace local para o sandbox OpenShell.
    - Depois de `exec`, o OpenClaw sincroniza o workspace remoto de volta para o workspace local.
    - As ferramentas de arquivo ainda operam pela ponte de sandbox, mas o workspace local permanece a fonte da verdade entre turnos.

    Use isto quando:

    - você edita arquivos localmente fora do OpenClaw e quer que essas alterações apareçam automaticamente na sandbox
    - você quer que a sandbox OpenShell se comporte o máximo possível como o backend Docker
    - você quer que o workspace do host reflita as gravações da sandbox depois de cada turno de exec

    Tradeoff: custo extra de sincronização antes e depois de exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    Use `plugins.entries.openshell.config.mode: "remote"` quando quiser que o **workspace OpenShell se torne canônico**.

    Comportamento:

    - Quando a sandbox é criada pela primeira vez, o OpenClaw inicializa o workspace remoto uma vez a partir do workspace local.
    - Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam diretamente no workspace remoto OpenShell.
    - O OpenClaw **não** sincroniza alterações remotas de volta para o workspace local após exec.
    - Leituras de mídia no momento do prompt ainda funcionam porque as ferramentas de arquivo e mídia leem pela ponte da sandbox, em vez de presumir um caminho local do host.
    - O transporte é SSH para a sandbox OpenShell retornada por `openshell sandbox ssh-config`.

    Consequências importantes:

    - Se você editar arquivos no host fora do OpenClaw após a etapa de inicialização, a sandbox remota **não** verá essas alterações automaticamente.
    - Se a sandbox for recriada, o workspace remoto será inicializado novamente a partir do workspace local.
    - Com `scope: "agent"` ou `scope: "shared"`, esse workspace remoto é compartilhado nesse mesmo escopo.

    Use isto quando:

    - a sandbox deve viver principalmente no lado remoto do OpenShell
    - você quer menos sobrecarga de sincronização por turno
    - você não quer que edições locais do host sobrescrevam silenciosamente o estado da sandbox remota

  </Tab>
</Tabs>

Escolha `mirror` se você pensa na sandbox como um ambiente temporário de execução. Escolha `remote` se você pensa na sandbox como o workspace real.

#### Ciclo de vida do OpenShell

As sandboxes OpenShell ainda são gerenciadas pelo ciclo de vida normal da sandbox:

- `openclaw sandbox list` mostra runtimes OpenShell e runtimes Docker
- `openclaw sandbox recreate` exclui o runtime atual e permite que o OpenClaw o recrie no próximo uso
- a lógica de limpeza também é consciente do backend

Para o modo `remote`, recriar é especialmente importante:

- recriar exclui o workspace remoto canônico desse escopo
- o próximo uso inicializa um novo workspace remoto a partir do workspace local

Para o modo `mirror`, recriar principalmente redefine o ambiente remoto de execução, porque o workspace local continua sendo canônico de qualquer forma.

## Acesso ao workspace

`agents.defaults.sandbox.workspaceAccess` controla **o que a sandbox pode ver**:

<Tabs>
  <Tab title="none (default)">
    As ferramentas veem um workspace de sandbox em `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta o workspace do agente como somente leitura em `/agent` (desativa `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta o workspace do agente com leitura/gravação em `/workspace`.
  </Tab>
</Tabs>

Com o backend OpenShell:

- o modo `mirror` ainda usa o workspace local como a fonte canônica entre turnos de exec
- o modo `remote` usa o workspace remoto OpenShell como a fonte canônica após a inicialização inicial
- `workspaceAccess: "ro"` e `"none"` ainda restringem o comportamento de gravação da mesma forma

Mídia recebida é copiada para o workspace da sandbox ativa (`media/inbound/*`).

<Note>
**Observação sobre Skills:** a ferramenta `read` é enraizada na sandbox. Com `workspaceAccess: "none"`, o OpenClaw espelha Skills elegíveis no workspace da sandbox (`.../skills`) para que possam ser lidos. Com `"rw"`, Skills do workspace podem ser lidos em `/workspace/skills`.
</Note>

## Montagens bind personalizadas

`agents.defaults.sandbox.docker.binds` monta diretórios adicionais do host no contêiner. Formato: `host:container:mode` (por exemplo, `"/home/user/source:/source:rw"`).

Binds globais e por agente são **mesclados** (não substituídos). Em `scope: "shared"`, binds por agente são ignorados.

`agents.defaults.sandbox.browser.binds` monta diretórios adicionais do host somente no contêiner do **navegador da sandbox**.

- Quando definido (incluindo `[]`), substitui `agents.defaults.sandbox.docker.binds` para o contêiner do navegador.
- Quando omitido, o contêiner do navegador usa `agents.defaults.sandbox.docker.binds` como fallback (compatível com versões anteriores).

Exemplo (código-fonte somente leitura + um diretório extra de dados):

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

- Binds ignoram o sistema de arquivos da sandbox: eles expõem caminhos do host com qualquer modo que você definir (`:ro` ou `:rw`).
- O OpenClaw bloqueia origens de bind perigosas (por exemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e montagens pai que as exporiam).
- O OpenClaw também bloqueia raízes comuns de credenciais em diretórios home, como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- A validação de bind não é apenas correspondência de strings. O OpenClaw normaliza o caminho de origem e então o resolve novamente pelo ancestral existente mais profundo antes de verificar de novo caminhos bloqueados e raízes permitidas.
- Isso significa que escapes por pai com symlink ainda falham fechados mesmo quando a folha final ainda não existe. Exemplo: `/workspace/run-link/new-file` ainda é resolvido como `/var/run/...` se `run-link` apontar para lá.
- Raízes de origem permitidas são canonicalizadas da mesma forma, então um caminho que só parece estar dentro da lista de permissões antes da resolução de symlink ainda é rejeitado como `outside allowed roots`.
- Montagens sensíveis (segredos, chaves SSH, credenciais de serviço) devem ser `:ro`, a menos que sejam absolutamente necessárias.
- Combine com `workspaceAccess: "ro"` se você só precisa de acesso de leitura ao workspace; os modos de bind permanecem independentes.
- Consulte [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para saber como binds interagem com a política de ferramentas e exec elevado.

</Warning>

## Imagens e configuração

Imagem Docker padrão: `openclaw-sandbox:bookworm-slim`

<Note>
**Checkout do código-fonte vs instalação via npm**

Os scripts auxiliares `scripts/sandbox-setup.sh`, `scripts/sandbox-common-setup.sh` e `scripts/sandbox-browser-setup.sh` só estão disponíveis ao executar a partir de um [checkout do código-fonte](https://github.com/openclaw/openclaw). Eles não estão incluídos no pacote npm.

Se você instalou o OpenClaw via `npm install -g openclaw`, use os comandos inline de `docker build` mostrados abaixo.
</Note>

<Steps>
  <Step title="Build the default image">
    A partir de um checkout do código-fonte:

    ```bash
    scripts/sandbox-setup.sh
    ```

    A partir de uma instalação npm (sem necessidade de checkout do código-fonte):

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

    A imagem padrão **não** inclui Node. Se uma skill precisar de Node (ou outros runtimes), crie uma imagem personalizada ou instale via `sandbox.docker.setupCommand` (requer saída de rede + root gravável + usuário root).

    O OpenClaw não substitui silenciosamente por `debian:bookworm-slim` simples quando `openclaw-sandbox:bookworm-slim` está ausente. Execuções de sandbox que têm como alvo a imagem padrão falham rapidamente com uma instrução de build até que você a crie, porque a imagem incluída traz `python3` para auxiliares de gravação/edição da sandbox.

  </Step>
  <Step title="Optional: build the common image">
    Para uma imagem de sandbox mais funcional com ferramentas comuns (por exemplo, `curl`, `jq`, `nodejs`, `python3`, `git`):

    A partir de um checkout do código-fonte:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    A partir de uma instalação npm, crie primeiro a imagem padrão (veja acima) e depois crie a imagem comum por cima usando o [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) do repositório.

    Então defina `agents.defaults.sandbox.docker.image` como `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    A partir de um checkout do código-fonte:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    A partir de uma instalação npm, crie usando o [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) do repositório.

  </Step>
</Steps>

Por padrão, contêineres de sandbox Docker são executados **sem rede**. Substitua com `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    A imagem incluída do navegador da sandbox também aplica padrões conservadores de inicialização do Chromium para cargas de trabalho em contêiner. Os padrões atuais do contêiner incluem:

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
    - `--disable-extensions` fica habilitado por padrão e pode ser desabilitado com `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para fluxos que dependem de extensões.
    - `--renderer-process-limit=2` é controlado por `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, em que `0` mantém o padrão do Chromium.

    Se você precisar de um perfil de runtime diferente, use uma imagem de navegador personalizada e forneça seu próprio entrypoint. Para perfis locais (sem contêiner) do Chromium, use `browser.extraArgs` para acrescentar flags adicionais de inicialização.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` é bloqueado.
    - `network: "container:<id>"` é bloqueado por padrão (risco de bypass por junção de namespace).
    - Substituição de emergência: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalações Docker e o Gateway em contêiner ficam aqui: [Docker](/pt-BR/install/docker)

Para implantações de Gateway Docker, `scripts/docker/setup.sh` pode inicializar a configuração de sandbox. Defina `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) para habilitar esse caminho. Você pode substituir o local do socket com `OPENCLAW_DOCKER_SOCKET`. Configuração completa e referência de env: [Docker](/pt-BR/install/docker#agent-sandbox).

## setupCommand (configuração única do contêiner)

`setupCommand` é executado **uma vez** depois que o contêiner da sandbox é criado (não em toda execução). Ele executa dentro do contêiner via `sh -lc`.

Caminhos:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Armadilhas comuns">
    - O padrão de `docker.network` é `"none"` (sem saída), então instalações de pacotes falharão.
    - `docker.network: "container:<id>"` exige `dangerouslyAllowContainerNamespaceJoin: true` e deve ser usado apenas em emergência.
    - `readOnlyRoot: true` impede gravações; defina `readOnlyRoot: false` ou incorpore uma imagem personalizada.
    - `user` deve ser root para instalações de pacotes (omita `user` ou defina `user: "0:0"`).
    - A execução no sandbox **não** herda o `process.env` do host. Use `agents.defaults.sandbox.docker.env` (ou uma imagem personalizada) para chaves de API de Skills.

  </Accordion>
</AccordionGroup>

## Política de ferramentas e rotas de escape

Políticas de permissão/negação de ferramentas ainda se aplicam antes das regras do sandbox. Se uma ferramenta for negada globalmente ou por agente, o sandbox não a reativa.

`tools.elevated` é uma rota de escape explícita que executa `exec` fora do sandbox (`gateway` por padrão, ou `node` quando o destino de execução é `node`). Diretivas `/exec` só se aplicam a remetentes autorizados e persistem por sessão; para desativar `exec` rigidamente, use a negação na política de ferramentas (consulte [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuração:

- Use `openclaw sandbox explain` para inspecionar o modo efetivo do sandbox, a política de ferramentas e as chaves de configuração de correção.
- Consulte [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para o modelo mental de "por que isso está bloqueado?".

Mantenha tudo bloqueado.

## Sobrescritas multiagente

Cada agente pode sobrescrever sandbox + ferramentas: `agents.list[].sandbox` e `agents.list[].tools` (mais `agents.list[].tools.sandbox.tools` para a política de ferramentas do sandbox). Consulte [Multi-Agent Sandbox & Tools](/pt-BR/tools/multi-agent-sandbox-tools) para precedência.

## Exemplo mínimo de ativação

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

## Relacionados

- [Multi-Agent Sandbox & Tools](/pt-BR/tools/multi-agent-sandbox-tools) — sobrescritas por agente e precedência
- [OpenShell](/pt-BR/gateway/openshell) — configuração do backend gerenciado de sandbox, modos de workspace e referência de configuração
- [Configuração do sandbox](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — depuração de "por que isso está bloqueado?"
- [Segurança](/pt-BR/gateway/security)
