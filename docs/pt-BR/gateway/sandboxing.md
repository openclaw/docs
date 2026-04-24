---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: 'Como o sandboxing do OpenClaw funciona: modos, escopos, acesso ao workspace e imagens'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-24T05:53:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07be63b71a458a17020f33a24d60e6d8d7007d4eaea686a21acabf4815c3f653
    source_path: gateway/sandboxing.md
    workflow: 15
---

O OpenClaw pode executar **ferramentas dentro de backends de sandbox** para reduzir o raio de impacto.
Isso é **opcional** e controlado por configuração (`agents.defaults.sandbox` ou
`agents.list[].sandbox`). Se o sandboxing estiver desativado, as ferramentas serão executadas no host.
O Gateway permanece no host; a execução de ferramentas ocorre em uma sandbox isolada
quando ativada.

Isso não é um limite de segurança perfeito, mas limita materialmente o acesso
a sistema de arquivos e processos quando o modelo faz algo imprudente.

## O que entra em sandbox

- Execução de ferramentas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` etc.).
- Navegador em sandbox opcional (`agents.defaults.sandbox.browser`).
  - Por padrão, o navegador em sandbox inicia automaticamente (garante que o CDP esteja acessível) quando a ferramenta de navegador precisa dele.
    Configure via `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
  - Por padrão, containers de navegador em sandbox usam uma rede Docker dedicada (`openclaw-sandbox-browser`) em vez da rede global `bridge`.
    Configure com `agents.defaults.sandbox.browser.network`.
  - `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe a entrada de CDP na borda do container com uma allowlist CIDR (por exemplo `172.21.0.1/32`).
  - O acesso de observador noVNC é protegido por senha por padrão; o OpenClaw emite uma URL de token de curta duração que serve uma página local de bootstrap e abre o noVNC com a senha no fragmento da URL (não em logs de query/header).
  - `agents.defaults.sandbox.browser.allowHostControl` permite que sessões em sandbox direcionem explicitamente o navegador do host.
  - Allowlists opcionais controlam `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

Não entra em sandbox:

- O próprio processo do Gateway.
- Qualquer ferramenta explicitamente permitida para ser executada fora da sandbox (por exemplo `tools.elevated`).
  - **Execução elevada ignora o sandboxing e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o destino de execução é `node`).**
  - Se o sandboxing estiver desativado, `tools.elevated` não altera a execução (já ocorre no host). Consulte [Elevated Mode](/pt-BR/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **quando** o sandboxing é usado:

- `"off"`: sem sandboxing.
- `"non-main"`: sandbox apenas para sessões **não principais** (padrão se você quiser chats normais no host).
- `"all"`: toda sessão é executada em uma sandbox.
  Observação: `"non-main"` se baseia em `session.mainKey` (padrão `"main"`), não no ID do agente.
  Sessões de grupo/canal usam suas próprias chaves, então contam como não principais e entrarão em sandbox.

## Escopo

`agents.defaults.sandbox.scope` controla **quantos containers** são criados:

- `"agent"` (padrão): um container por agente.
- `"session"`: um container por sessão.
- `"shared"`: um container compartilhado por todas as sessões em sandbox.

## Backend

`agents.defaults.sandbox.backend` controla **qual runtime** fornece a sandbox:

- `"docker"` (padrão quando o sandboxing está ativado): runtime de sandbox local baseado em Docker.
- `"ssh"`: runtime de sandbox remoto genérico baseado em SSH.
- `"openshell"`: runtime de sandbox baseado em OpenShell.

A configuração específica de SSH fica em `agents.defaults.sandbox.ssh`.
A configuração específica de OpenShell fica em `plugins.entries.openshell.config`.

### Escolhendo um backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Onde executa**    | Container local                  | Qualquer host acessível por SSH | Sandbox gerenciada do OpenShell                     |
| **Configuração**    | `scripts/sandbox-setup.sh`       | Chave SSH + host de destino    | Plugin OpenShell ativado                            |
| **Modelo de workspace** | Bind-mount ou cópia          | Remoto-canônico (inicializa uma vez) | `mirror` ou `remote`                           |
| **Controle de rede**| `docker.network` (padrão: none)  | Depende do host remoto         | Depende do OpenShell                                |
| **Navegador em sandbox** | Compatível                  | Não compatível                 | Ainda não compatível                                |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Melhor para**     | Dev local, isolamento total      | Descarregar para uma máquina remota | Sandboxes remotas gerenciadas com sincronização bidirecional opcional |

### Backend Docker

O sandboxing vem desativado por padrão. Se você ativar o sandboxing e não escolher um
backend, o OpenClaw usará o backend Docker. Ele executa ferramentas e navegadores em sandbox
localmente por meio do socket do daemon Docker (`/var/run/docker.sock`). O isolamento do container
de sandbox é determinado pelos namespaces do Docker.

**Restrições de Docker-out-of-Docker (DooD)**:
Se você implantar o próprio Gateway OpenClaw como um container Docker, ele orquestra containers de sandbox irmãos usando o socket Docker do host (DooD). Isso introduz uma restrição específica de mapeamento de caminhos:

- **A configuração exige caminhos do host**: a configuração `workspace` em `openclaw.json` DEVE conter o **caminho absoluto do Host** (por exemplo `/home/user/.openclaw/workspaces`), não o caminho interno do container do Gateway. Quando o OpenClaw pede ao daemon Docker para iniciar uma sandbox, o daemon avalia os caminhos em relação ao namespace do SO do Host, não ao namespace do Gateway.
- **Paridade da ponte de FS (mapa de volume idêntico)**: o processo nativo do Gateway OpenClaw também grava arquivos de Heartbeat e bridge no diretório `workspace`. Como o Gateway avalia a mesma string exata (o caminho do host) de dentro do seu próprio ambiente em container, a implantação do Gateway DEVE incluir um mapa de volume idêntico vinculando nativamente o namespace do host (`-v /home/user/.openclaw:/home/user/.openclaw`).

Se você mapear caminhos internamente sem paridade absoluta com o host, o OpenClaw lançará nativamente um erro de permissão `EACCES` ao tentar gravar seu Heartbeat dentro do ambiente do container porque a string de caminho totalmente qualificada não existe nativamente.

### Backend SSH

Use `backend: "ssh"` quando quiser que o OpenClaw execute `exec`, ferramentas de arquivo e leituras de mídia em sandbox em
uma máquina arbitrária acessível por SSH.

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

Como funciona:

- O OpenClaw cria uma raiz remota por escopo em `sandbox.ssh.workspaceRoot`.
- No primeiro uso após criar ou recriar, o OpenClaw inicializa esse workspace remoto a partir do workspace local uma vez.
- Depois disso, `exec`, `read`, `write`, `edit`, `apply_patch`, leituras de mídia no prompt e preparação de mídia de entrada são executados diretamente no workspace remoto por SSH.
- O OpenClaw não sincroniza automaticamente alterações remotas de volta para o workspace local.

Material de autenticação:

- `identityFile`, `certificateFile`, `knownHostsFile`: usam arquivos locais existentes e os passam pela configuração do OpenSSH.
- `identityData`, `certificateData`, `knownHostsData`: usam strings inline ou SecretRefs. O OpenClaw os resolve pelo snapshot normal de runtime de segredos, grava em arquivos temporários com `0600` e os exclui quando a sessão SSH termina.
- Se `*File` e `*Data` estiverem definidos para o mesmo item, `*Data` prevalece nessa sessão SSH.

Este é um modelo **remoto-canônico**. O workspace SSH remoto se torna o estado real da sandbox após a inicialização inicial.

Consequências importantes:

- Edições locais no host feitas fora do OpenClaw após a etapa de inicialização não ficam visíveis remotamente até que você recrie a sandbox.
- `openclaw sandbox recreate` exclui a raiz remota por escopo e inicializa novamente a partir do local no próximo uso.
- Navegador em sandbox não é compatível com o backend SSH.
- Configurações `sandbox.docker.*` não se aplicam ao backend SSH.

### Backend OpenShell

Use `backend: "openshell"` quando quiser que o OpenClaw execute ferramentas em sandbox em um
ambiente remoto gerenciado pelo OpenShell. Para o guia completo de configuração, referência
de configuração e comparação de modos de workspace, consulte a página dedicada do
[OpenShell](/pt-BR/gateway/openshell).

O OpenShell reutiliza o mesmo transporte SSH central e a mesma ponte de sistema de arquivos remoto do
backend SSH genérico e adiciona ciclo de vida específico do OpenShell
(`sandbox create/get/delete`, `sandbox ssh-config`) mais o modo opcional de workspace
`mirror`.

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

- `mirror` (padrão): o workspace local permanece canônico. O OpenClaw sincroniza arquivos locais com o OpenShell antes de `exec` e sincroniza o workspace remoto de volta depois de `exec`.
- `remote`: o workspace do OpenShell se torna canônico depois que a sandbox é criada. O OpenClaw inicializa o workspace remoto uma vez a partir do workspace local, então ferramentas de arquivo e `exec` são executados diretamente na sandbox remota sem sincronizar as alterações de volta.

Detalhes do transporte remoto:

- O OpenClaw pede ao OpenShell a configuração SSH específica da sandbox via `openshell sandbox ssh-config <name>`.
- O núcleo grava essa configuração SSH em um arquivo temporário, abre a sessão SSH e reutiliza a mesma ponte de sistema de arquivos remoto usada por `backend: "ssh"`.
- No modo `mirror`, apenas o ciclo de vida é diferente: sincroniza local para remoto antes de `exec`, depois sincroniza de volta.

Limitações atuais do OpenShell:

- navegador em sandbox ainda não é compatível
- `sandbox.docker.binds` não é compatível com o backend OpenShell
- ajustes específicos de runtime do Docker em `sandbox.docker.*` continuam se aplicando apenas ao backend Docker

#### Modos de workspace

O OpenShell tem dois modelos de workspace. Esta é a parte que mais importa na prática.

##### `mirror`

Use `plugins.entries.openshell.config.mode: "mirror"` quando quiser que o **workspace local permaneça canônico**.

Comportamento:

- Antes de `exec`, o OpenClaw sincroniza o workspace local com a sandbox OpenShell.
- Depois de `exec`, o OpenClaw sincroniza o workspace remoto de volta para o workspace local.
- As ferramentas de arquivo continuam operando pela ponte da sandbox, mas o workspace local continua sendo a fonte da verdade entre turnos.

Use isso quando:

- você edita arquivos localmente fora do OpenClaw e quer que essas alterações apareçam automaticamente na sandbox
- você quer que a sandbox OpenShell se comporte o mais próximo possível do backend Docker
- você quer que o workspace do host reflita as gravações da sandbox após cada turno de `exec`

Tradeoff:

- custo extra de sincronização antes e depois de `exec`

##### `remote`

Use `plugins.entries.openshell.config.mode: "remote"` quando quiser que o **workspace OpenShell se torne canônico**.

Comportamento:

- Quando a sandbox é criada pela primeira vez, o OpenClaw inicializa o workspace remoto a partir do workspace local uma vez.
- Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam diretamente no workspace remoto do OpenShell.
- O OpenClaw **não** sincroniza alterações remotas de volta para o workspace local após `exec`.
- Leituras de mídia no momento do prompt continuam funcionando porque ferramentas de arquivo e mídia leem pela ponte da sandbox em vez de presumir um caminho local do host.
- O transporte é via SSH para a sandbox OpenShell retornada por `openshell sandbox ssh-config`.

Consequências importantes:

- Se você editar arquivos no host fora do OpenClaw após a etapa de inicialização, a sandbox remota **não** verá essas alterações automaticamente.
- Se a sandbox for recriada, o workspace remoto será inicializado novamente a partir do workspace local.
- Com `scope: "agent"` ou `scope: "shared"`, esse workspace remoto é compartilhado nesse mesmo escopo.

Use isso quando:

- a sandbox deve viver principalmente no lado remoto do OpenShell
- você quer menor overhead de sincronização por turno
- você não quer que edições locais no host sobrescrevam silenciosamente o estado remoto da sandbox

Escolha `mirror` se você pensa na sandbox como um ambiente temporário de execução.
Escolha `remote` se você pensa na sandbox como o workspace real.

#### Ciclo de vida do OpenShell

Sandboxes OpenShell ainda são gerenciadas pelo ciclo de vida normal da sandbox:

- `openclaw sandbox list` mostra runtimes OpenShell assim como runtimes Docker
- `openclaw sandbox recreate` exclui o runtime atual e permite que o OpenClaw o recrie no próximo uso
- a lógica de prune também conhece o backend

Para o modo `remote`, recreate é especialmente importante:

- recreate exclui o workspace remoto canônico para esse escopo
- o próximo uso inicializa um novo workspace remoto a partir do workspace local

Para o modo `mirror`, recreate principalmente redefine o ambiente remoto de execução
porque o workspace local permanece canônico de qualquer forma.

## Acesso ao workspace

`agents.defaults.sandbox.workspaceAccess` controla **o que a sandbox pode ver**:

- `"none"` (padrão): as ferramentas veem um workspace de sandbox em `~/.openclaw/sandboxes`.
- `"ro"`: monta o workspace do agente como somente leitura em `/agent` (desativa `write`/`edit`/`apply_patch`).
- `"rw"`: monta o workspace do agente como leitura/gravação em `/workspace`.

Com o backend OpenShell:

- o modo `mirror` ainda usa o workspace local como fonte canônica entre turnos de exec
- o modo `remote` usa o workspace remoto do OpenShell como fonte canônica após a inicialização inicial
- `workspaceAccess: "ro"` e `"none"` ainda restringem o comportamento de gravação da mesma forma

A mídia de entrada é copiada para o workspace ativo da sandbox (`media/inbound/*`).
Observação sobre Skills: a ferramenta `read` é enraizada na sandbox. Com `workspaceAccess: "none"`,
o OpenClaw espelha Skills elegíveis no workspace da sandbox (`.../skills`) para que
possam ser lidas. Com `"rw"`, Skills do workspace podem ser lidas em
`/workspace/skills`.

## Bind mounts personalizados

`agents.defaults.sandbox.docker.binds` monta diretórios adicionais do host no container.
Formato: `host:container:mode` (por exemplo `"/home/user/source:/source:rw"`).

Binds globais e por agente são **mesclados** (não substituídos). Em `scope: "shared"`, binds por agente são ignorados.

`agents.defaults.sandbox.browser.binds` monta diretórios adicionais do host apenas no container do **navegador em sandbox**.

- Quando definido (incluindo `[]`), ele substitui `agents.defaults.sandbox.docker.binds` no container do navegador.
- Quando omitido, o container do navegador recorre a `agents.defaults.sandbox.docker.binds` (compatibilidade retroativa).

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

Observações de segurança:

- Binds ignoram o sistema de arquivos da sandbox: eles expõem caminhos do host com o modo que você definir (`:ro` ou `:rw`).
- O OpenClaw bloqueia origens perigosas de bind (por exemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e montagens pai que as exporiam).
- O OpenClaw também bloqueia raízes comuns de credenciais no diretório home, como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- A validação de bind não é apenas correspondência de string. O OpenClaw normaliza o caminho de origem e depois o resolve novamente pelo ancestral existente mais profundo antes de verificar outra vez caminhos bloqueados e raízes permitidas.
- Isso significa que escapes por symlink pai continuam falhando de forma fechada mesmo quando a folha final ainda não existe. Exemplo: `/workspace/run-link/new-file` ainda é resolvido como `/var/run/...` se `run-link` apontar para lá.
- As raízes de origem permitidas são canonizadas da mesma forma, então um caminho que apenas parece estar dentro da allowlist antes da resolução de symlink ainda é rejeitado como `outside allowed roots`.
- Montagens sensíveis (segredos, chaves SSH, credenciais de serviço) devem usar `:ro`, a menos que seja absolutamente necessário.
- Combine com `workspaceAccess: "ro"` se você precisar apenas de acesso de leitura ao workspace; os modos de bind permanecem independentes.
- Consulte [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para entender como binds interagem com política de ferramenta e execução elevada.

## Imagens + configuração

Imagem Docker padrão: `openclaw-sandbox:bookworm-slim`

Construa uma vez:

```bash
scripts/sandbox-setup.sh
```

Observação: a imagem padrão **não** inclui Node. Se uma skill precisar de Node (ou
outros runtimes), crie uma imagem personalizada ou instale via
`sandbox.docker.setupCommand` (requer saída de rede + raiz gravável +
usuário root).

Se você quiser uma imagem de sandbox mais funcional com ferramentas comuns (por exemplo
`curl`, `jq`, `nodejs`, `python3`, `git`), construa:

```bash
scripts/sandbox-common-setup.sh
```

Em seguida, defina `agents.defaults.sandbox.docker.image` como
`openclaw-sandbox-common:bookworm-slim`.

Imagem do navegador em sandbox:

```bash
scripts/sandbox-browser-setup.sh
```

Por padrão, containers Docker de sandbox são executados **sem rede**.
Substitua isso com `agents.defaults.sandbox.docker.network`.

A imagem integrada do navegador em sandbox também aplica padrões conservadores de inicialização do Chromium
para cargas containerizadas. Os padrões atuais do container incluem:

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
- `--no-sandbox` e `--disable-setuid-sandbox` quando `noSandbox` está ativado.
- As três flags de endurecimento gráfico (`--disable-3d-apis`,
  `--disable-software-rasterizer`, `--disable-gpu`) são opcionais e úteis
  quando os containers não têm suporte a GPU. Defina `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`
  se sua carga precisar de WebGL ou outros recursos 3D/do navegador.
- `--disable-extensions` vem ativado por padrão e pode ser desativado com
  `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para fluxos que dependem de extensões.
- `--renderer-process-limit=2` é controlado por
  `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, em que `0` mantém o padrão do Chromium.

Se você precisar de um perfil de runtime diferente, use uma imagem personalizada de navegador e forneça
seu próprio entrypoint. Para perfis locais de Chromium (sem container), use
`browser.extraArgs` para acrescentar flags adicionais de inicialização.

Padrões de segurança:

- `network: "host"` é bloqueado.
- `network: "container:<id>"` é bloqueado por padrão (risco de bypass por junção de namespace).
- Substituição break-glass: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

Instalações Docker e o gateway em container ficam aqui:
[Docker](/pt-BR/install/docker)

Para implantações do gateway Docker, `scripts/docker/setup.sh` pode inicializar a configuração de sandbox.
Defina `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) para ativar esse caminho. Você pode
substituir o local do socket com `OPENCLAW_DOCKER_SOCKET`. Configuração completa e referência
de env: [Docker](/pt-BR/install/docker#agent-sandbox).

## setupCommand (configuração única do container)

`setupCommand` é executado **uma vez** após a criação do container de sandbox (não em cada execução).
Ele é executado dentro do container via `sh -lc`.

Caminhos:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

Armadilhas comuns:

- O padrão de `docker.network` é `"none"` (sem saída), então instalações de pacote falharão.
- `docker.network: "container:<id>"` requer `dangerouslyAllowContainerNamespaceJoin: true` e é apenas break-glass.
- `readOnlyRoot: true` impede gravações; defina `readOnlyRoot: false` ou crie uma imagem personalizada.
- `user` precisa ser root para instalações de pacote (omita `user` ou defina `user: "0:0"`).
- A execução em sandbox **não** herda `process.env` do host. Use
  `agents.defaults.sandbox.docker.env` (ou uma imagem personalizada) para chaves de API de Skills.

## Política de ferramentas + rotas de escape

Políticas de permitir/negar ferramentas ainda se aplicam antes das regras de sandbox. Se uma ferramenta for negada
globalmente ou por agente, o sandboxing não a traz de volta.

`tools.elevated` é uma rota de escape explícita que executa `exec` fora da sandbox (`gateway` por padrão, ou `node` quando o destino de execução é `node`).
Diretivas `/exec` só se aplicam a remetentes autorizados e persistem por sessão; para desativar rigidamente
`exec`, use negação na política de ferramentas (consulte [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuração:

- Use `openclaw sandbox explain` para inspecionar o modo efetivo de sandbox, a política de ferramentas e chaves de configuração de correção.
- Consulte [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para o modelo mental de “por que isso está bloqueado?”.
  Mantenha tudo bem restrito.

## Substituições para vários agentes

Cada agente pode substituir sandbox + ferramentas:
`agents.list[].sandbox` e `agents.list[].tools` (mais `agents.list[].tools.sandbox.tools` para política de ferramentas da sandbox).
Consulte [Multi-Agent Sandbox & Tools](/pt-BR/tools/multi-agent-sandbox-tools) para ver a precedência.

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

## Documentação relacionada

- [OpenShell](/pt-BR/gateway/openshell) -- configuração do backend de sandbox gerenciado, modos de workspace e referência de configuração
- [Sandbox Configuration](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuração de "por que isso está bloqueado?"
- [Multi-Agent Sandbox & Tools](/pt-BR/tools/multi-agent-sandbox-tools) -- substituições por agente e precedência
- [Security](/pt-BR/gateway/security)
