---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'Como funciona o isolamento do OpenClaw: modos, escopos, acesso ao espaço de trabalho e imagens'
title: Isolamento em ambiente restrito
x-i18n:
    generated_at: "2026-04-30T09:51:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw pode executar **ferramentas dentro de backends de ambiente isolado** para reduzir o raio de impacto. Isso é **opcional** e controlado por configuração (`agents.defaults.sandbox` ou `agents.list[].sandbox`). Se o isolamento estiver desativado, as ferramentas serão executadas no host. O Gateway permanece no host; a execução de ferramentas ocorre em um ambiente isolado quando habilitada.

<Note>
Este não é um limite de segurança perfeito, mas limita materialmente o acesso ao sistema de arquivos e a processos quando o modelo faz algo inadequado.
</Note>

## O que é isolado

- Execução de ferramentas (`exec`, `read`, `write`, `edit`, `apply_patch`, `process`, etc.).
- Navegador isolado opcional (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Detalhes do navegador isolado">
    - Por padrão, o navegador isolado inicia automaticamente (garante que o CDP esteja acessível) quando a ferramenta de navegador precisa dele. Configure via `agents.defaults.sandbox.browser.autoStart` e `agents.defaults.sandbox.browser.autoStartTimeoutMs`.
    - Por padrão, contêineres do navegador isolado usam uma rede Docker dedicada (`openclaw-sandbox-browser`) em vez da rede global `bridge`. Configure com `agents.defaults.sandbox.browser.network`.
    - O `agents.defaults.sandbox.browser.cdpSourceRange` opcional restringe a entrada CDP na borda do contêiner com uma lista de permissões CIDR (por exemplo, `172.21.0.1/32`).
    - O acesso de observador noVNC é protegido por senha por padrão; o OpenClaw emite uma URL com token de curta duração que serve uma página local de inicialização e abre o noVNC com a senha no fragmento da URL (não em logs de consulta/cabeçalho).
    - `agents.defaults.sandbox.browser.allowHostControl` permite que sessões isoladas apontem explicitamente para o navegador do host.
    - Listas de permissões opcionais controlam `target: "custom"`: `allowedControlUrls`, `allowedControlHosts`, `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

Não isolado:

- O próprio processo do Gateway.
- Qualquer ferramenta explicitamente autorizada a ser executada fora do ambiente isolado (por exemplo, `tools.elevated`).
  - **Exec elevado ignora o isolamento e usa o caminho de escape configurado (`gateway` por padrão, ou `node` quando o alvo de exec é `node`).**
  - Se o isolamento estiver desativado, `tools.elevated` não altera a execução (já ocorre no host). Consulte [Modo Elevado](/pt-BR/tools/elevated).

## Modos

`agents.defaults.sandbox.mode` controla **quando** o isolamento é usado:

<Tabs>
  <Tab title="off">
    Sem isolamento.
  </Tab>
  <Tab title="non-main">
    Isola apenas sessões **não principais** (padrão se você quiser conversas normais no host).

    `"non-main"` se baseia em `session.mainKey` (padrão `"main"`), não no id do agente. Sessões de grupo/canal usam suas próprias chaves, então contam como não principais e serão isoladas.

  </Tab>
  <Tab title="all">
    Toda sessão é executada em um ambiente isolado.
  </Tab>
</Tabs>

## Escopo

`agents.defaults.sandbox.scope` controla **quantos contêineres** são criados:

- `"agent"` (padrão): um contêiner por agente.
- `"session"`: um contêiner por sessão.
- `"shared"`: um contêiner compartilhado por todas as sessões isoladas.

## Backend

`agents.defaults.sandbox.backend` controla **qual runtime** fornece o ambiente isolado:

- `"docker"` (padrão quando o isolamento está habilitado): runtime de ambiente isolado local com backend Docker.
- `"ssh"`: runtime genérico de ambiente isolado remoto com backend SSH.
- `"openshell"`: runtime de ambiente isolado com backend OpenShell.

A configuração específica de SSH fica em `agents.defaults.sandbox.ssh`. A configuração específica do OpenShell fica em `plugins.entries.openshell.config`.

### Escolhendo um backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Onde executa**    | Contêiner local                  | Qualquer host acessível por SSH | Ambiente isolado gerenciado pelo OpenShell          |
| **Configuração**    | `scripts/sandbox-setup.sh`       | Chave SSH + host de destino    | Plugin OpenShell habilitado                         |
| **Modelo de workspace** | Montagem bind ou cópia       | Remoto canônico (semeia uma vez) | `mirror` ou `remote`                              |
| **Controle de rede** | `docker.network` (padrão: nenhum) | Depende do host remoto       | Depende do OpenShell                                |
| **Navegador isolado** | Compatível                    | Não compatível                 | Ainda não compatível                                |
| **Montagens bind**  | `docker.binds`                   | N/A                            | N/A                                                 |
| **Melhor para**     | Desenvolvimento local, isolamento completo | Descarregar para uma máquina remota | Ambientes isolados remotos gerenciados com sincronização bidirecional opcional |

### Backend Docker

O isolamento fica desativado por padrão. Se você habilitar o isolamento e não escolher um backend, o OpenClaw usará o backend Docker. Ele executa ferramentas e navegadores isolados localmente via socket do daemon Docker (`/var/run/docker.sock`). O isolamento do contêiner de ambiente isolado é determinado pelos namespaces do Docker.

Para expor GPUs do host aos ambientes isolados Docker, defina `agents.defaults.sandbox.docker.gpus` ou a substituição por agente `agents.list[].sandbox.docker.gpus`. O valor é passado para a flag `--gpus` do Docker como um argumento separado, por exemplo `"all"` ou `"device=GPU-uuid"`, e exige um runtime de host compatível, como NVIDIA Container Toolkit.

<Warning>
**Restrições de Docker-out-of-Docker (DooD)**

Se você implantar o próprio OpenClaw Gateway como um contêiner Docker, ele orquestrará contêineres de ambiente isolado irmãos usando o socket Docker do host (DooD). Isso introduz uma restrição específica de mapeamento de caminhos:

- **A configuração exige caminhos do host**: a configuração `workspace` de `openclaw.json` DEVE conter o **caminho absoluto do host** (por exemplo, `/home/user/.openclaw/workspaces`), não o caminho interno do contêiner do Gateway. Quando o OpenClaw pede ao daemon Docker para gerar um ambiente isolado, o daemon avalia caminhos em relação ao namespace do SO host, não ao namespace do Gateway.
- **Paridade da ponte FS (mapa de volume idêntico)**: o processo nativo do OpenClaw Gateway também grava arquivos de Heartbeat e ponte no diretório `workspace`. Como o Gateway avalia exatamente a mesma string (o caminho do host) de dentro de seu próprio ambiente em contêiner, a implantação do Gateway DEVE incluir um mapa de volume idêntico vinculando o namespace do host nativamente (`-v /home/user/.openclaw:/home/user/.openclaw`).

Se você mapear caminhos internamente sem paridade absoluta com o host, o OpenClaw lança nativamente um erro de permissão `EACCES` ao tentar gravar seu Heartbeat dentro do ambiente do contêiner porque a string de caminho totalmente qualificada não existe nativamente.
</Warning>

### Backend SSH

Use `backend: "ssh"` quando quiser que o OpenClaw isole `exec`, ferramentas de arquivo e leituras de mídia em uma máquina arbitrária acessível por SSH.

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
    - Depois disso, `exec`, `read`, `write`, `edit`, `apply_patch`, leituras de mídia de prompt e preparação de mídia de entrada executam diretamente contra o workspace remoto por SSH.
    - O OpenClaw não sincroniza automaticamente alterações remotas de volta para o workspace local.

  </Accordion>
  <Accordion title="Material de autenticação">
    - `identityFile`, `certificateFile`, `knownHostsFile`: usam arquivos locais existentes e os passam pela configuração do OpenSSH.
    - `identityData`, `certificateData`, `knownHostsData`: usam strings inline ou SecretRefs. O OpenClaw as resolve pelo snapshot normal do runtime de segredos, grava em arquivos temporários com `0600` e as exclui quando a sessão SSH termina.
    - Se `*File` e `*Data` estiverem definidos para o mesmo item, `*Data` vence nessa sessão SSH.

  </Accordion>
  <Accordion title="Consequências do remoto canônico">
    Este é um modelo **remoto canônico**. O workspace SSH remoto se torna o estado real do ambiente isolado após a semeadura inicial.

    - Edições locais no host feitas fora do OpenClaw após a etapa de semeadura não ficam visíveis remotamente até você recriar o ambiente isolado.
    - `openclaw sandbox recreate` exclui a raiz remota por escopo e semeia novamente a partir do local no próximo uso.
    - Isolamento de navegador não é compatível com o backend SSH.
    - Configurações `sandbox.docker.*` não se aplicam ao backend SSH.

  </Accordion>
</AccordionGroup>

### Backend OpenShell

Use `backend: "openshell"` quando quiser que o OpenClaw isole ferramentas em um ambiente remoto gerenciado pelo OpenShell. Para o guia completo de configuração, referência de configuração e comparação de modos de workspace, consulte a [página do OpenShell](/pt-BR/gateway/openshell) dedicada.

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
- `remote`: o workspace do OpenShell é canônico depois que o ambiente isolado é criado. O OpenClaw semeia o workspace remoto uma vez a partir do workspace local, então ferramentas de arquivo e exec executam diretamente contra o ambiente isolado remoto sem sincronizar alterações de volta.

<AccordionGroup>
  <Accordion title="Detalhes do transporte remoto">
    - O OpenClaw pede ao OpenShell a configuração SSH específica do ambiente isolado via `openshell sandbox ssh-config <name>`.
    - O core grava essa configuração SSH em um arquivo temporário, abre a sessão SSH e reutiliza a mesma ponte de sistema de arquivos remoto usada por `backend: "ssh"`.
    - No modo `mirror`, somente o ciclo de vida difere: sincroniza do local para o remoto antes do exec e depois sincroniza de volta após o exec.

  </Accordion>
  <Accordion title="Limitações atuais do OpenShell">
    - navegador isolado ainda não é compatível
    - `sandbox.docker.binds` não é compatível com o backend OpenShell
    - ajustes de runtime específicos do Docker em `sandbox.docker.*` ainda se aplicam apenas ao backend Docker

  </Accordion>
</AccordionGroup>

#### Modos de workspace

O OpenShell tem dois modelos de workspace. Esta é a parte que mais importa na prática.

<Tabs>
  <Tab title="mirror (local canonical)">
    Use `plugins.entries.openshell.config.mode: "mirror"` quando quiser que o **workspace local permaneça canônico**.

    Comportamento:

    - Antes de `exec`, o OpenClaw sincroniza o workspace local para o ambiente isolado OpenShell.
    - Depois de `exec`, o OpenClaw sincroniza o workspace remoto de volta para o workspace local.
    - Ferramentas de arquivo ainda operam pela ponte do ambiente isolado, mas o workspace local permanece a fonte da verdade entre turnos.

    Use isto quando:

    - você edita arquivos localmente fora do OpenClaw e quer que essas alterações apareçam no ambiente isolado automaticamente
    - você quer que o ambiente isolado OpenShell se comporte da forma mais parecida possível com o backend Docker
    - você quer que o workspace do host reflita as escritas do ambiente isolado após cada turno de exec

    Compensação: custo extra de sincronização antes e depois do exec.

  </Tab>
  <Tab title="remoto (OpenShell canônico)">
    Use `plugins.entries.openshell.config.mode: "remote"` quando você quiser que o **workspace OpenShell se torne canônico**.

    Comportamento:

    - Quando o ambiente isolado é criado pela primeira vez, o OpenClaw inicializa o workspace remoto a partir do workspace local uma vez.
    - Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam diretamente no workspace OpenShell remoto.
    - O OpenClaw **não** sincroniza alterações remotas de volta para o workspace local após o exec.
    - Leituras de mídia no momento do prompt ainda funcionam porque as ferramentas de arquivo e mídia leem pela ponte do ambiente isolado em vez de presumir um caminho local do host.
    - O transporte é SSH para o ambiente isolado OpenShell retornado por `openshell sandbox ssh-config`.

    Consequências importantes:

    - Se você editar arquivos no host fora do OpenClaw após a etapa de inicialização, o ambiente isolado remoto **não** verá essas alterações automaticamente.
    - Se o ambiente isolado for recriado, o workspace remoto será inicializado novamente a partir do workspace local.
    - Com `scope: "agent"` ou `scope: "shared"`, esse workspace remoto é compartilhado nesse mesmo escopo.

    Use isto quando:

    - o ambiente isolado deve existir principalmente no lado remoto do OpenShell
    - você quer menor sobrecarga de sincronização por turno
    - você não quer que edições locais do host sobrescrevam silenciosamente o estado do ambiente isolado remoto

  </Tab>
</Tabs>

Escolha `mirror` se você pensa no ambiente isolado como um ambiente temporário de execução. Escolha `remote` se você pensa no ambiente isolado como o workspace real.

#### Ciclo de vida do OpenShell

Ambientes isolados OpenShell ainda são gerenciados pelo ciclo de vida normal de ambientes isolados:

- `openclaw sandbox list` mostra runtimes OpenShell e runtimes Docker
- `openclaw sandbox recreate` exclui o runtime atual e permite que o OpenClaw o recrie no próximo uso
- a lógica de limpeza também é ciente do backend

Para o modo `remote`, recriar é especialmente importante:

- recriar exclui o workspace remoto canônico para esse escopo
- o próximo uso inicializa um workspace remoto novo a partir do workspace local

Para o modo `mirror`, recriar principalmente redefine o ambiente remoto de execução, porque o workspace local continua sendo canônico de qualquer forma.

## Acesso ao workspace

`agents.defaults.sandbox.workspaceAccess` controla **o que o ambiente isolado pode ver**:

<Tabs>
  <Tab title="nenhum (padrão)">
    As ferramentas veem um workspace de ambiente isolado em `~/.openclaw/sandboxes`.
  </Tab>
  <Tab title="ro">
    Monta o workspace do agente como somente leitura em `/agent` (desativa `write`/`edit`/`apply_patch`).
  </Tab>
  <Tab title="rw">
    Monta o workspace do agente com leitura/escrita em `/workspace`.
  </Tab>
</Tabs>

Com o backend OpenShell:

- o modo `mirror` ainda usa o workspace local como fonte canônica entre turnos de exec
- o modo `remote` usa o workspace OpenShell remoto como fonte canônica após a inicialização inicial
- `workspaceAccess: "ro"` e `"none"` ainda restringem o comportamento de escrita da mesma forma

Mídia recebida é copiada para o workspace ativo do ambiente isolado (`media/inbound/*`).

<Note>
**Observação sobre Skills:** a ferramenta `read` tem raiz no ambiente isolado. Com `workspaceAccess: "none"`, o OpenClaw espelha skills elegíveis no workspace do ambiente isolado (`.../skills`) para que possam ser lidas. Com `"rw"`, skills do workspace podem ser lidas em `/workspace/skills`.
</Note>

## Montagens bind personalizadas

`agents.defaults.sandbox.docker.binds` monta diretórios adicionais do host no contêiner. Formato: `host:container:mode` (por exemplo, `"/home/user/source:/source:rw"`).

Binds globais e por agente são **mesclados** (não substituídos). Sob `scope: "shared"`, binds por agente são ignorados.

`agents.defaults.sandbox.browser.binds` monta diretórios adicionais do host somente no contêiner do **navegador do ambiente isolado**.

- Quando definido (incluindo `[]`), ele substitui `agents.defaults.sandbox.docker.binds` para o contêiner do navegador.
- Quando omitido, o contêiner do navegador usa `agents.defaults.sandbox.docker.binds` como fallback (compatível com versões anteriores).

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

- Binds contornam o sistema de arquivos do ambiente isolado: eles expõem caminhos do host com qualquer modo que você definir (`:ro` ou `:rw`).
- O OpenClaw bloqueia origens de bind perigosas (por exemplo: `docker.sock`, `/etc`, `/proc`, `/sys`, `/dev` e montagens pai que as exporiam).
- O OpenClaw também bloqueia raízes comuns de credenciais em diretórios home, como `~/.aws`, `~/.cargo`, `~/.config`, `~/.docker`, `~/.gnupg`, `~/.netrc`, `~/.npm` e `~/.ssh`.
- A validação de bind não é apenas correspondência de strings. O OpenClaw normaliza o caminho de origem e então o resolve novamente pelo ancestral existente mais profundo antes de verificar de novo caminhos bloqueados e raízes permitidas.
- Isso significa que escapes por pais de symlink ainda falham de forma fechada mesmo quando a folha final ainda não existe. Exemplo: `/workspace/run-link/new-file` ainda resolve como `/var/run/...` se `run-link` apontar para lá.
- Raízes de origem permitidas são canonicalizadas da mesma forma, então um caminho que só parece estar dentro da lista de permissões antes da resolução de symlink ainda é rejeitado como `outside allowed roots`.
- Montagens sensíveis (segredos, chaves SSH, credenciais de serviço) devem ser `:ro`, a menos que sejam absolutamente necessárias.
- Combine com `workspaceAccess: "ro"` se você só precisa de acesso de leitura ao workspace; modos de bind permanecem independentes.
- Consulte [Ambiente isolado vs. política de ferramentas vs. elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para ver como binds interagem com política de ferramentas e exec elevado.

</Warning>

## Imagens e configuração

Imagem Docker padrão: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="Compile a imagem padrão">
    ```bash
    scripts/sandbox-setup.sh
    ```

    A imagem padrão **não** inclui Node. Se uma skill precisa de Node (ou outros runtimes), inclua-os em uma imagem personalizada ou instale via `sandbox.docker.setupCommand` (requer saída de rede + raiz gravável + usuário root).

    O OpenClaw não substitui silenciosamente por `debian:bookworm-slim` simples quando `openclaw-sandbox:bookworm-slim` está ausente. Execuções de ambiente isolado que miram a imagem padrão falham rapidamente com uma instrução de build até você executar `scripts/sandbox-setup.sh`, porque a imagem incluída traz `python3` para auxiliares de escrita/edição do ambiente isolado.

  </Step>
  <Step title="Opcional: compile a imagem comum">
    Para uma imagem de ambiente isolado mais funcional com ferramentas comuns (por exemplo, `curl`, `jq`, `nodejs`, `python3`, `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    Então defina `agents.defaults.sandbox.docker.image` como `openclaw-sandbox-common:bookworm-slim`.

  </Step>
  <Step title="Opcional: compile a imagem do navegador do ambiente isolado">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

Por padrão, contêineres de ambiente isolado Docker executam **sem rede**. Sobrescreva com `agents.defaults.sandbox.docker.network`.

<AccordionGroup>
  <Accordion title="Padrões do Chromium no navegador do ambiente isolado">
    A imagem incluída do navegador do ambiente isolado também aplica padrões conservadores de inicialização do Chromium para cargas de trabalho em contêiner. Os padrões atuais do contêiner incluem:

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
    - As três flags de reforço gráfico (`--disable-3d-apis`, `--disable-software-rasterizer`, `--disable-gpu`) são opcionais e úteis quando contêineres não têm suporte a GPU. Defina `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se sua carga de trabalho exigir WebGL ou outros recursos 3D/do navegador.
    - `--disable-extensions` é habilitado por padrão e pode ser desabilitado com `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` para fluxos que dependem de extensões.
    - `--renderer-process-limit=2` é controlado por `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`, em que `0` mantém o padrão do Chromium.

    Se você precisar de um perfil de runtime diferente, use uma imagem de navegador personalizada e forneça seu próprio entrypoint. Para perfis Chromium locais (não em contêiner), use `browser.extraArgs` para acrescentar flags adicionais de inicialização.

  </Accordion>
  <Accordion title="Padrões de segurança de rede">
    - `network: "host"` é bloqueado.
    - `network: "container:<id>"` é bloqueado por padrão (risco de contornar via ingresso em namespace).
    - Sobrescrita de emergência: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

Instalações Docker e o Gateway conteinerizado ficam aqui: [Docker](/pt-BR/install/docker)

Para implantações do Gateway Docker, `scripts/docker/setup.sh` pode inicializar a configuração do ambiente isolado. Defina `OPENCLAW_SANDBOX=1` (ou `true`/`yes`/`on`) para habilitar esse caminho. Você pode sobrescrever a localização do socket com `OPENCLAW_DOCKER_SOCKET`. Configuração completa e referência de env: [Docker](/pt-BR/install/docker#agent-sandbox).

## setupCommand (configuração única do contêiner)

`setupCommand` executa **uma vez** depois que o contêiner do ambiente isolado é criado (não em toda execução). Ele executa dentro do contêiner via `sh -lc`.

Caminhos:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- Por agente: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="Armadilhas comuns">
    - O `docker.network` padrão é `"none"` (sem saída), então instalações de pacotes falharão.
    - `docker.network: "container:<id>"` exige `dangerouslyAllowContainerNamespaceJoin: true` e é apenas para emergência.
    - `readOnlyRoot: true` impede escritas; defina `readOnlyRoot: false` ou inclua isso em uma imagem personalizada.
    - `user` deve ser root para instalações de pacotes (omita `user` ou defina `user: "0:0"`).
    - Exec do ambiente isolado **não** herda `process.env` do host. Use `agents.defaults.sandbox.docker.env` (ou uma imagem personalizada) para chaves de API de skills.

  </Accordion>
</AccordionGroup>

## Política de ferramentas e escapes

Políticas de permissão/negação de ferramentas ainda se aplicam antes das regras do ambiente isolado. Se uma ferramenta for negada globalmente ou por agente, o ambiente isolado não a traz de volta.

`tools.elevated` é um escape explícito que executa `exec` fora do ambiente isolado (`gateway` por padrão, ou `node` quando o destino do exec é `node`). Diretivas `/exec` só se aplicam a remetentes autorizados e persistem por sessão; para desabilitar `exec` rigidamente, use negação na política de ferramentas (consulte [Ambiente isolado vs. política de ferramentas vs. elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated)).

Depuração:

- Use `openclaw sandbox explain` para inspecionar o modo efetivo do ambiente isolado, a política de ferramentas e as chaves de configuração de correção.
- Consulte [Ambiente isolado vs. política de ferramentas vs. elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para o modelo mental de "por que isto está bloqueado?".

Mantenha bloqueado.

## Sobrescritas multiagente

Cada agente pode sobrescrever ambiente isolado + ferramentas: `agents.list[].sandbox` e `agents.list[].tools` (além de `agents.list[].tools.sandbox.tools` para política de ferramentas do ambiente isolado). Consulte [Ambiente isolado e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) para precedência.

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

- [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) — substituições e precedência por agente
- [OpenShell](/pt-BR/gateway/openshell) — configuração do backend de sandbox gerenciado, modos de espaço de trabalho e referência de configuração
- [Configuração do sandbox](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs. política de ferramentas vs. elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — depuração de "por que isso está bloqueado?"
- [Segurança](/pt-BR/gateway/security)
