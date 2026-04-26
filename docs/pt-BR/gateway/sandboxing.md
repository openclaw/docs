---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Como o sandboxing do OpenClaw funciona: modos, escopos, acesso ao workspace e imagens'
title: Sandboxing
x-i18n:
    generated_at: "2026-04-26T11:29:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83930d5533832f2ece5fd069c15670f8a73c5801c829ca85c249a4582d36ff29
    source_path: gateway/sandboxing.md
    workflow: 15
---

O OpenClaw pode executar **ferramentas dentro de backends de sandbox** para reduzir o raio de impacto. Isso é **opcional** e controlado por configuração (`agents.defaults.sandbox` ou `agents.list[].sandbox`). Se o sandboxing estiver desativado, as ferramentas serão executadas no host. O Gateway permanece no host; a execução de ferramentas roda em um sandbox isolado quando habilitada.

<Note>
Isso não é um limite de segurança perfeito, mas limita de forma material o acesso ao sistema de arquivos e aos processos quando o modelo faz algo imprudente.
</Note>

## O que entra no sandbox

- Execução de ferramentas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process` etc.).
- Navegador em sandbox opcional (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Detalhes do navegador em sandbox">
    - Por padrão, o navegador em sandbox inicia automaticamente (garante que o CDP esteja acessível) quando a ferramenta de navegador precisa dele. Configure com `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Por padrão, containers do navegador em sandbox usam uma rede Docker dedicada (`openclaw-sandbox-browser`) em vez da rede global `bridge`. Configure com `agents.defaults.sandbox.browser.network`.
    - `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe a entrada de CDP na borda do container com uma allowlist CIDR (por exemplo `172.21.0.1/32`).
    - O acesso de observador via noVNC é protegido por senha por padrão; o OpenClaw emite uma URL de token de curta duração que serve uma página local de bootstrap e abre o noVNC com a senha no fragmento da URL (não em logs de query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` permite que sessões em sandbox tenham como alvo explicitamente o navegador do host.
    - Allowlists opcionais controlam `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.
  </Accordion>
</AccordionGroup>

Não entram no sandbox:

- O próprio processo do Gateway.
- Qualquer ferramenta explicitamente permitida para rodar fora do sandbox (por exemplo `tools.elevated`).
  - **`exec` elevado ignora o sandbox e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o destino de exec é `node`).**
  - Se o sandboxing estiver desativado, `tools.elevated` não altera a execução (já está no host). Consulte [Modo elevado](/pt-BR/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **quando** o sandboxing é usado:

<Tabs>
  <Tab title="off">
    Sem sandboxing.
  </Tab>
  <Tab title="non-main">
    Aplica sandbox apenas a sessões **non-main** (padrão se você quiser chats normais no host).

    `"non-main"` é baseado em `session.mainKey` (padrão `"main"`), não no id do agente. Sessões de grupo/canal usam suas próprias chaves, então contam como non-main e entrarão em sandbox.

  </Tab>
  <Tab title="all">
    Toda sessão é executada em um sandbox.
  </Tab>
</Tabs>

## Escopo

`agents.defaults.sandbox.scope` controla **quantos containers** são criados:

- `"agent"` (padrão): um container por agente.
- `"session"`: um container por sessão.
- `"shared"`: um container compartilhado por todas as sessões em sandbox.

## Backend

`agents.defaults.sandbox.backend` controla **qual runtime** fornece o sandbox:

- `"docker"` (padrão quando o sandboxing está habilitado): runtime de sandbox local com suporte do Docker.
- `"ssh"`: runtime de sandbox remoto genérico com suporte de SSH.
- `"openshell"`: runtime de sandbox com suporte de OpenShell.

A configuração específica de SSH fica em `agents.defaults.sandbox.ssh`. A configuração específica de OpenShell fica em `plugins.entries.openshell.config`.

### Escolhendo um backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Onde executa**    | Container local                  | Qualquer host acessível por SSH | Sandbox gerenciado por OpenShell                    |
| **Configuração**    | `scripts/sandbox-setup.sh`       | Chave SSH + host de destino    | Plugin OpenShell habilitado                         |
| **Modelo de workspace** | Bind-mount ou cópia          | Remoto canônico (semeia uma vez) | `mirror` ou `remote`                              |
| **Controle de rede** | `docker.network` (padrão: none) | Depende do host remoto         | Depende do OpenShell                                |
| **Navegador em sandbox** | Suportado                  | Não suportado                  | Ainda não suportado                                 |
| **Bind mounts**     | `docker.binds`                   | N/A                            | N/A                                                 |
| **Melhor para**     | Dev local, isolamento completo   | Descarregar para uma máquina remota | Sandboxes remotos gerenciados com sincronização bidirecional opcional |

### Backend Docker

O sandboxing fica desativado por padrão. Se você habilitar o sandboxing e não escolher um backend, o OpenClaw usará o backend Docker. Ele executa ferramentas e navegadores em sandbox localmente via o socket do daemon Docker (`/var/run/docker.sock`). O isolamento do container de sandbox é determinado pelos namespaces do Docker.

<Warning>
**Restrições de Docker-out-of-Docker (DooD)**

Se você implantar o próprio Gateway OpenClaw como um container Docker, ele orquestra containers irmãos de sandbox usando o socket Docker do host (DooD). Isso introduz uma restrição específica de mapeamento de caminho:

- **A configuração exige caminhos do host**: a configuração `workspace` em `openclaw.json` DEVE conter o **caminho absoluto do host** (por exemplo `/home/user/.openclaw/workspaces`), e não o caminho interno do container do Gateway. Quando o OpenClaw pede ao daemon Docker para iniciar um sandbox, o daemon avalia caminhos em relação ao namespace do SO do host, não ao namespace do Gateway.
- **Paridade da ponte de FS (mapeamento de volume idêntico)**: o processo nativo do Gateway OpenClaw também grava arquivos de Heartbeat e bridge no diretório `workspace`. Como o Gateway avalia a mesma string exata (o caminho do host) a partir do seu próprio ambiente em container, a implantação do Gateway DEVE incluir um mapeamento de volume idêntico vinculando o namespace do host nativamente (`-v /home/user/.openclaw:/home/user/.openclaw`).

Se você mapear caminhos internamente sem paridade absoluta com o host, o OpenClaw lançará nativamente um erro de permissão `EACCES` ao tentar gravar seu Heartbeat dentro do ambiente do container, porque a string de caminho totalmente qualificada não existe nativamente.
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
          // Ou use SecretRefs / conteúdos inline em vez de arquivos locais:
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
    - Depois disso, `exec`, `read`, `write`, `edit`, `apply_patch`, leituras de mídia de prompt e preparação de mídia recebida executam diretamente no workspace remoto por SSH.
    - O OpenClaw não sincroniza automaticamente alterações remotas de volta para o workspace local.
  </Accordion>
  <Accordion title="Material de autenticação">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usam arquivos locais existentes e os passam pela configuração do OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usam strings inline ou SecretRefs. O OpenClaw os resolve pelo snapshot normal de runtime de segredos, grava em arquivos temporários com `0600` e os exclui quando a sessão SSH termina.
    - Se `*File` e `*Data` estiverem definidos para o mesmo item, `*Data` tem precedência para essa sessão SSH.
  </Accordion>
  <Accordion title="Consequências do modelo remoto canônico">
    Este é um modelo **remoto canônico**. O workspace remoto SSH se torna o estado real do sandbox após a semeadura inicial.

    - Edições locais no host feitas fora do OpenClaw após a etapa de semeadura não ficam visíveis remotamente até que você recrie o sandbox.
    - `openclaw sandbox recreate` exclui a raiz remota por escopo e semeia novamente a partir do local no próximo uso.
    - Navegador em sandbox não é suportado no backend SSH.
    - Configurações `sandbox.docker.*` não se aplicam ao backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Use `backend: "openshell"` quando quiser que o OpenClaw coloque ferramentas em sandbox em um ambiente remoto gerenciado por OpenShell. Para o guia completo de configuração, referência de configuração e comparação de modos de workspace, consulte a página dedicada [OpenShell](/pt-BR/gateway/openshell).

O OpenShell reutiliza o mesmo transporte SSH principal e a mesma ponte de sistema de arquivos remoto do backend SSH genérico, e adiciona ciclo de vida específico do OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`) além do modo opcional de workspace `mirror`.

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

- `mirror` (padrão): o workspace local continua sendo canônico. O OpenClaw sincroniza arquivos locais com o OpenShell antes de `exec` e sincroniza o workspace remoto de volta após `exec`.
- `remote`: o workspace do OpenShell é canônico depois que o sandbox é criado. O OpenClaw semeia o workspace remoto uma vez a partir do workspace local, então ferramentas de arquivo e `exec` executam diretamente no sandbox remoto sem sincronizar alterações de volta.

<AccordionGroup>
  <Accordion title="Detalhes do transporte remoto">
    - O OpenClaw pede ao OpenShell a configuração SSH específica do sandbox via `openshell sandbox ssh-config <name>`.
    - O núcleo grava essa configuração SSH em um arquivo temporário, abre a sessão SSH e reutiliza a mesma ponte de sistema de arquivos remoto usada por `backend: "ssh"`.
    - No modo `mirror`, apenas o ciclo de vida difere: sincroniza local para remoto antes de `exec` e depois sincroniza de volta.
  </Accordion>
  <Accordion title="Limitações atuais do OpenShell">
    - navegador em sandbox ainda não é suportado
    - `sandbox.docker.binds` não é suportado no backend OpenShell
    - ajustes de runtime específicos do Docker em `sandbox.docker.*` ainda se aplicam apenas ao backend Docker
  </Accordion>
</AccordionGroup>

#### Modos de workspace

O OpenShell tem dois modelos de workspace. Esta é a parte que mais importa na prática.

<Tabs>
  <Tab title="mirror (local canônico)">
    Use `plugins.entries.openshell.config.mode: "mirror"` quando quiser que o **workspace local continue sendo canônico**.

    Comportamento:

    - Antes de `exec`, o OpenClaw sincroniza o workspace local com o sandbox OpenShell.
    - Depois de `exec`, o OpenClaw sincroniza o workspace remoto de volta para o workspace local.
    - Ferramentas de arquivo continuam operando por meio da ponte do sandbox, mas o workspace local continua sendo a fonte de verdade entre os turnos.

    Use isso quando:

    - você edita arquivos localmente fora do OpenClaw e quer que essas alterações apareçam automaticamente no sandbox
    - você quer que o sandbox OpenShell se comporte o mais próximo possível do backend Docker
    - você quer que o workspace do host reflita gravações do sandbox após cada turno de exec

    Tradeoff: custo extra de sincronização antes e depois de exec.

  </Tab>
  <Tab title="remote (OpenShell canônico)">
    Use `plugins.entries.openshell.config.mode: "remote"` quando quiser que o **workspace do OpenShell se torne canônico**.

    Comportamento:

    - Quando o sandbox é criado pela primeira vez, o OpenClaw semeia o workspace remoto a partir do workspace local uma vez.
    - Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam diretamente no workspace remoto do OpenShell.
    - O OpenClaw **não** sincroniza alterações remotas de volta para o workspace local após `exec`.
    - Leituras de mídia no momento do prompt continuam funcionando porque ferramentas de arquivo e mídia leem pela ponte do sandbox em vez de assumir um caminho local no host.
    - O transporte é SSH para o sandbox OpenShell retornado por `openshell sandbox ssh-config`.

    Consequências importantes:

    - Se você editar arquivos no host fora do OpenClaw após a etapa de semeadura, o sandbox remoto **não** verá essas alterações automaticamente.
    - Se o sandbox for recriado, o workspace remoto será semeado novamente a partir do workspace local.
    - Com `scope: "agent"` ou `scope: "shared"`, esse workspace remoto é compartilhado nesse mesmo escopo.

    Use isso quando:

    - o sandbox deve viver principalmente no lado remoto do OpenShell
    - você quer menor overhead de sincronização por turno
    - você não quer que edições locais no host sobrescrevam silenciosamente o estado remoto do sandbox

  </Tab>
</Tabs>

Escolha `mirror` se você pensa no sandbox como um ambiente temporário de execução. Escolha `remote` se você pensa no sandbox como o workspace real.

#### Ciclo de vida do OpenShell

Sandboxes OpenShell ainda são gerenciados pelo ciclo de vida normal de sandbox:

- `openclaw sandbox list` mostra runtimes OpenShell, além de runtimes Docker
- `openclaw sandbox recreate` exclui o runtime atual e permite que o OpenClaw o recrie no próximo uso
- a lógica de limpeza também reconhece o backend

Para o modo `remote`, recriar é especialmente importante:

- recriar exclui o workspace remoto canônico para aquele escopo
- o próximo uso semeia um workspace remoto novo a partir do workspace local

Para o modo `mirror`, recriar serve principalmente para redefinir o ambiente remoto de execução, porque o workspace local continua canônico de qualquer forma.

## Acesso ao workspace

`agents.defaults.sandbox.workspaceAccess` controla **o que o sandbox pode ver**:

<Tabs>
  <Tab title="none (padrão)">
    Ferramentas veem um workspace de sandbox em `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta o workspace do agente como somente leitura em `/agent` (desabilita `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta o workspace do agente como leitura/gravação em `/workspace`.
  </Tab>
</Tabs>

Com o backend OpenShell:

- o modo `mirror` ainda usa o workspace local como origem canônica entre turnos de exec
- o modo `remote` usa o workspace remoto do OpenShell como origem canônica após a semeadura inicial
- `workspaceAccess: "ro"` e `"none"` ainda restringem o comportamento de gravação da mesma forma

A mídia recebida é copiada para o workspace ativo do sandbox (`media/inbound/*`).

<Note>
**Observação sobre Skills:** a ferramenta `read` é enraizada no sandbox. Com `workspaceAccess: "none"`, o OpenClaw espelha Skills elegíveis para o workspace do sandbox (`.../skills`) para que possam ser lidas. Com `"rw"`, Skills do workspace podem ser lidas em `/workspace/skills`.
</Note>

## Bind mounts personalizados

`agents.defaults.sandbox.docker.binds` monta diretórios adicionais do host no container. Formato: `host:container:mode` (por exemplo `"/home/user/source:/source:rw"`).

Binds globais e por agente são **mesclados** (não substituídos). Em `scope: "shared"`, binds por agente são ignorados.

`agents.defaults.sandbox.browser.binds` monta diretórios adicionais do host somente no container do **navegador em sandbox**.

- Quando definido (incluindo `[]`), ele substitui `agents.defaults.sandbox.docker.binds` para o container do navegador.
- Quando omitido, o container do navegador usa `agents.defaults.sandbox.docker.binds` como fallback (compatível com versões anteriores).

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

- Binds contornam o sistema de arquivos do sandbox: eles expõem caminhos do host com o modo que você definir (`:ro` ou `:rw`).
- O OpenClaw bloqueia origens de bind perigosas (por exemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e mounts pais que os exponham).
- O OpenClaw também bloqueia raízes comuns de credenciais no diretório home como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- A validação de bind não é apenas correspondência de string. O OpenClaw normaliza o caminho de origem e depois o resolve novamente pelo ancestral existente mais profundo antes de verificar novamente caminhos bloqueados e raízes permitidas.
- Isso significa que escapes por pai com symlink continuam falhando de forma segura mesmo quando a folha final ainda não existe. Exemplo: `/workspace/run-link/new-file` ainda é resolvido como `/var/run/...` se `run-link` apontar para lá.
- Raízes de origem permitidas são canonicalizadas da mesma forma, então um caminho que apenas parece estar dentro da allowlist antes da resolução de symlink ainda é rejeitado como `outside allowed roots`.
- Mounts sensíveis (segredos, chaves SSH, credenciais de serviço) devem ser `:ro`, a menos que seja absolutamente necessário.
- Combine com `workspaceAccess: "ro"` se você precisar apenas de acesso de leitura ao workspace; os modos de bind continuam independentes.
- Consulte [Sandbox vs política de ferramenta vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para entender como binds interagem com política de ferramenta e exec elevado.
  </Warning>

## Imagens e configuração inicial

Imagem Docker padrão: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Construir a imagem padrão">
    ```bash
    scripts/sandbox-setup.sh
    ```

    A imagem padrão **não** inclui Node. Se uma skill precisar de Node (ou outros runtimes), você pode criar uma imagem personalizada ou instalar via `sandbox.docker.setupCommand` (requer saída de rede + raiz gravável + usuário root).

  </Step>
  <Step title="Opcional: construir a imagem comum">
    Para uma imagem de sandbox mais funcional com ferramentas comuns (por exemplo `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Depois defina `agents.defaults.sandbox.docker.image` como `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: construir a imagem do navegador em sandbox">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Por padrão, containers Docker de sandbox são executados **sem rede**. Substitua isso com `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Padrões do Chromium no navegador em sandbox">
    A imagem integrada do navegador em sandbox também aplica padrões conservadores de inicialização do Chromium para cargas de trabalho em container. Os padrões atuais do container incluem:

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
    - As três flags de hardening gráfico (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) são opcionais e úteis quando containers não têm suporte a GPU. Defina `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se sua carga de trabalho precisar de WebGL ou outros recursos 3D/do navegador.
    - `--disable-extensions` está habilitado por padrão e pode ser desabilitado com `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para fluxos que dependem de extensões.
    - `--renderer-process-limit=2` é controlado por `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, em que `0` mantém o padrão do Chromium.

    Se você precisar de um perfil de runtime diferente, use uma imagem de navegador personalizada e forneça seu próprio entrypoint. Para perfis locais (sem container) do Chromium, use `browser.extraArgs` para acrescentar flags extras de inicialização.

  </Accordion>
  <Accordion title="Padrões de segurança de rede">
    - `network: "host"` é bloqueado.
    - `network: "container:<id>"` é bloqueado por padrão (risco de contorno por ingresso em namespace).
    - Substituição de último recurso: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.
  </Accordion>
</AccordionGroup>

Instalações Docker e o gateway em container ficam aqui: [Docker](/pt-BR/install/docker)

Para implantações Docker do gateway, `scripts/docker/setup.sh` pode inicializar a configuração de sandbox. Defina `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) para habilitar esse caminho. Você pode substituir a localização do socket com `OPENCLAW_DOCKER_SOCKET`. Configuração completa e referência de env: [Docker](/pt-BR/install/docker#agent-sandbox).

## setupCommand (configuração única do container)

`setupCommand` é executado **uma vez** após a criação do container de sandbox (não a cada execução). Ele roda dentro do container via `sh -lc`.

Caminhos:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Armadilhas comuns">
    - O padrão de `docker.network` é `"none"` (sem saída), então instalações de pacote falharão.
    - `docker.network: "container:<id>"` requer `dangerouslyAllowContainerNamespaceJoin: true` e é apenas uma opção de último recurso.
    - `readOnlyRoot: true` impede gravações; defina `readOnlyRoot: false` ou crie uma imagem personalizada.
    - `user` deve ser root para instalações de pacote (omita `user` ou defina `user: "0:0"`).
    - O exec em sandbox **não** herda `process.env` do host. Use `agents.defaults.sandbox.docker.env` (ou uma imagem personalizada) para chaves de API de Skills.
  </Accordion>
</AccordionGroup>

## Política de ferramenta e rotas de escape

Políticas de permitir/negar ferramentas ainda se aplicam antes das regras de sandbox. Se uma ferramenta for negada globalmente ou por agente, o sandboxing não a traz de volta.

`tools.elevated` é uma rota de escape explícita que executa `exec` fora do sandbox (`gateway` por padrão, ou `node` quando o destino de exec é `node`). Diretivas `/exec` só se aplicam a remetentes autorizados e persistem por sessão; para desabilitar `exec` definitivamente, use uma política de negação de ferramenta (consulte [Sandbox vs política de ferramenta vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuração:

- Use `openclaw sandbox explain` para inspecionar o modo efetivo de sandbox, a política de ferramenta e as chaves de configuração de correção.
- Consulte [Sandbox vs política de ferramenta vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para o modelo mental de "por que isso está bloqueado?".

Mantenha tudo restrito.

## Substituições para vários agentes

Cada agente pode substituir sandbox + ferramentas: `agents.list[].sandbox` e `agents.list[].tools` (além de `agents.list[].tools.sandbox.tools` para política de ferramenta no sandbox). Consulte [Sandbox e ferramentas para vários agentes](/pt-BR/tools/multi-agent-sandbox-tools) para a precedência.

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

- [Sandbox e ferramentas para vários agentes](/pt-BR/tools/multi-agent-sandbox-tools) — substituições por agente e precedência
- [OpenShell](/pt-BR/gateway/openshell) — configuração do backend de sandbox gerenciado, modos de workspace e referência de configuração
- [Configuração de sandbox](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs política de ferramenta vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — depuração de "por que isso está bloqueado?"
- [Segurança](/pt-BR/gateway/security)
