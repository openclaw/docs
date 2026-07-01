---
read_when:
    - Adição ou modificação de Skills
    - Alteração de bloqueio, listas de permissão ou regras de carregamento de Skills
    - Entendendo a precedência de Skills e o comportamento de instantâneos
sidebarTitle: Skills
summary: Skills ensinam ao seu agente como usar ferramentas. Saiba como elas são carregadas, como a precedência funciona e como configurar gating, allowlists e injeção de ambiente.
title: Skills
x-i18n:
    generated_at: "2026-07-01T05:34:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills são arquivos de instruções em markdown que ensinam ao agente como e quando usar
ferramentas. Cada skill vive em um diretório contendo um arquivo `SKILL.md` com
frontmatter YAML e um corpo em markdown. O OpenClaw carrega Skills incluídas mais quaisquer
substituições locais, e as filtra no momento do carregamento com base no ambiente, na configuração e na
presença de binários.

<CardGroup cols={2}>
  <Card title="Criando Skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Crie e teste uma skill personalizada do zero.
  </Card>
  <Card title="Workshop de Skills" href="/pt-BR/tools/skill-workshop" icon="flask">
    Revise e aprove propostas de Skills elaboradas pelo agente.
  </Card>
  <Card title="Configuração de Skills" href="/pt-BR/tools/skills-config" icon="gear">
    Esquema de configuração `skills.*` completo e allowlists de agentes.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Navegue e instale Skills da comunidade.
  </Card>
</CardGroup>

## Ordem de carregamento

O OpenClaw carrega a partir destas fontes, **maior precedência primeiro**. Quando o mesmo
nome de skill aparece em vários lugares, a fonte de maior prioridade vence.

| Prioridade   | Fonte                         | Caminho                                 |
| ------------ | ----------------------------- | --------------------------------------- |
| 1 — maior    | Skills do workspace           | `<workspace>/skills`                    |
| 2            | Skills de agente do projeto   | `<workspace>/.agents/skills`            |
| 3            | Skills pessoais de agente     | `~/.agents/skills`                      |
| 4            | Skills gerenciadas / locais   | `~/.openclaw/skills`                    |
| 5            | Skills incluídas              | enviadas com a instalação               |
| 6 — menor    | Diretórios extras             | `skills.load.extraDirs` + Skills de Plugin |

Raízes de Skills aceitam layouts agrupados. O OpenClaw descobre uma skill sempre que
`SKILL.md` aparece em qualquer lugar sob uma raiz configurada:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

O caminho da pasta serve apenas para organização. O nome da skill, o comando de barra e
a chave de allowlist vêm todos do campo de frontmatter `name` (ou do nome do diretório
quando `name` está ausente).

<Note>
  O diretório nativo `$CODEX_HOME/skills` da Codex CLI **não** é uma raiz de
  Skills do OpenClaw. Use `openclaw migrate plan codex` para inventariar essas Skills e depois
  `openclaw migrate codex` para copiá-las para o seu workspace OpenClaw.
</Note>

## Skills por agente vs compartilhadas

Em configurações multiagente, cada agente tem seu próprio workspace. Use o caminho que
corresponde à visibilidade desejada:

| Escopo               | Caminho                      | Visível para                    |
| -------------------- | ---------------------------- | ------------------------------- |
| Por agente           | `<workspace>/skills`         | Somente esse agente             |
| Agente do projeto    | `<workspace>/.agents/skills` | Somente o agente desse workspace |
| Agente pessoal       | `~/.agents/skills`           | Todos os agentes nesta máquina  |
| Gerenciadas compartilhadas | `~/.openclaw/skills`         | Todos os agentes nesta máquina  |
| Diretórios extras    | `skills.load.extraDirs`      | Todos os agentes nesta máquina  |

## Allowlists de agentes

A **localização** da skill (precedência) e a **visibilidade** da skill (qual agente pode usá-la)
são controles separados. Use allowlists para restringir quais Skills um agente vê,
independentemente de onde elas são carregadas.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Regras de allowlist">
    - Omita `agents.defaults.skills` para deixar todas as Skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
    - Defina `agents.list[].skills: []` para não expor Skills para esse agente.
    - Uma lista não vazia de `agents.list[].skills` é o conjunto **final** — ela não
      é mesclada com os padrões.
    - A allowlist efetiva se aplica à construção de prompts, à descoberta de comandos de barra,
      à sincronização de sandbox e aos snapshots de Skills.
    - Isso não é um limite de autorização do shell do host. Se o mesmo agente puder
      usar `exec`, restrinja esse shell separadamente com sandboxing, isolamento de usuário do SO,
      deny/allowlists de exec e credenciais por recurso.
  </Accordion>
</AccordionGroup>

## Plugins e Skills

Plugins podem enviar suas próprias Skills listando diretórios `skills` em
`openclaw.plugin.json` (caminhos relativos à raiz do Plugin). Skills de Plugin são carregadas
quando o Plugin está habilitado — por exemplo, o Plugin de navegador envia uma skill
`browser-automation` para controle de navegador em várias etapas.

Diretórios de Skills de Plugin são mesclados no mesmo nível de baixa precedência que
`skills.load.extraDirs`, portanto uma skill de mesmo nome incluída, gerenciada, de agente ou de workspace
as substitui. Controle-as via `metadata.openclaw.requires.config` na
entrada de configuração do Plugin.

Veja [Plugins](/pt-BR/tools/plugin) e [Ferramentas](/pt-BR/tools) para o sistema completo de Plugins.

## Workshop de Skills

[Workshop de Skills](/pt-BR/tools/skill-workshop) é uma fila de propostas entre o agente
e seus arquivos de Skills ativos. Quando o agente identifica trabalho reutilizável, ele elabora uma
proposta em vez de escrever diretamente em `SKILL.md`. Você revisa e aprova
antes que qualquer coisa mude.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Veja [Workshop de Skills](/pt-BR/tools/skill-workshop) para o ciclo de vida completo, a referência de CLI
e a configuração.

## Instalando pelo ClawHub

[ClawHub](https://clawhub.ai) é o registro público de Skills. Use comandos
`openclaw skills` para instalar e atualizar, ou a CLI `clawhub` para
publicar e sincronizar.

| Ação                                  | Comando                                                |
| ------------------------------------- | ------------------------------------------------------ |
| Instalar uma skill no workspace       | `openclaw skills install @owner/<slug>`                |
| Instalar de um repositório Git        | `openclaw skills install git:owner/repo@ref`           |
| Instalar um diretório local de skill  | `openclaw skills install ./path/to/skill --as my-tool` |
| Instalar para todos os agentes locais | `openclaw skills install @owner/<slug> --global`       |
| Atualizar todas as Skills do workspace | `openclaw skills update --all`                         |
| Atualizar uma skill gerenciada compartilhada | `openclaw skills update @owner/<slug> --global`        |
| Atualizar todas as Skills gerenciadas compartilhadas | `openclaw skills update --all --global`                |
| Verificar o envelope de confiança de uma skill | `openclaw skills verify @owner/<slug>`                 |
| Imprimir o Skill Card gerado          | `openclaw skills verify @owner/<slug> --card`          |
| Publicar / sincronizar via CLI do ClawHub | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Detalhes da instalação">
    `openclaw skills install` instala no diretório `skills/` do workspace ativo
    por padrão. Adicione `--global` para instalar no diretório compartilhado
    `~/.openclaw/skills`, visível a todos os agentes locais, a menos que allowlists
    de agentes o restrinjam.

    Instalações por Git e locais esperam `SKILL.md` na raiz de origem. O slug vem
    do frontmatter `name` de `SKILL.md` quando válido, depois recorre ao
    nome do diretório ou repositório. Use `--as <slug>` para substituir.
    `openclaw skills update` rastreia apenas instalações do ClawHub — reinstale fontes Git ou
    locais para atualizá-las.

  </Accordion>
  <Accordion title="Verificação e varredura de segurança">
    `openclaw skills verify @owner/<slug>` pede ao ClawHub o envelope de confiança
    `clawhub.skill.verify.v1` da skill. Skills do ClawHub instaladas são verificadas
    contra a versão e o registro registrados em `.clawhub/origin.json`.
    Slugs simples continuam aceitos para Skills existentes instaladas ou inequívocas, mas
    referências qualificadas por proprietário evitam ambiguidade de publicador.

    Páginas de Skills do ClawHub expõem o estado mais recente da varredura de segurança antes da instalação,
    com páginas de detalhes para VirusTotal, ClawScan e análise estática. O
    comando sai com código diferente de zero quando o ClawHub marca a verificação como falha. Publicadores
    recuperam falsos positivos pelo painel do ClawHub ou por
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Instalações por arquivo privado">
    Clientes Gateway que precisam de entrega fora do ClawHub podem preparar um arquivo zip de skill
    com `skills.upload.begin`, `skills.upload.chunk` e `skills.upload.commit`,
    e então instalar com `skills.install({ source: "upload", ... })`. Esse caminho fica
    desativado por padrão e exige `skills.install.allowUploadedArchives: true` em
    `openclaw.json`. Instalações normais pelo ClawHub nunca precisam dessa configuração.
  </Accordion>
</AccordionGroup>

## Segurança

<Warning>
  Trate Skills de terceiros como **código não confiável**. Leia-as antes de habilitar.
  Prefira execuções em sandbox para entradas não confiáveis e ferramentas arriscadas. Veja
  [Sandboxing](/pt-BR/gateway/sandboxing) para controles do lado do agente.
</Warning>

<AccordionGroup>
  <Accordion title="Contenção de caminho">
    A descoberta de Skills em workspace, agente do projeto e diretórios extras aceita apenas raízes de Skills
    cujo realpath resolvido permaneça dentro da raiz configurada, a menos que
    `skills.load.allowSymlinkTargets` confie explicitamente em uma raiz de destino.
    O Workshop de Skills escreve por esses destinos confiáveis apenas quando
    `skills.workshop.allowSymlinkTargetWrites` está habilitado.
    Skills gerenciadas em `~/.openclaw/skills` e pessoais em `~/.agents/skills` podem conter
    pastas de Skills por symlink, mas todo realpath de `SKILL.md` ainda deve permanecer
    dentro de seu diretório de skill resolvido.
  </Accordion>
  <Accordion title="Política de instalação do operador">
    Configure `security.installPolicy` para executar um comando de política local confiável
    antes que instalações de Skills continuem. A política recebe metadados e o caminho de origem
    preparado, aplica-se a caminhos do ClawHub, enviados, Git, locais, de atualização e
    instalador de dependências, e falha fechada quando o comando não consegue retornar
    uma decisão válida.
  </Accordion>
  <Accordion title="Escopo de injeção de segredos">
    `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no processo
    **host** somente para aquela rodada do agente — não no sandbox. Mantenha
    segredos fora de prompts e logs.
  </Accordion>
</AccordionGroup>

Para o modelo de ameaças mais amplo e checklists de segurança, veja
[Segurança](/pt-BR/gateway/security).

## Formato de SKILL.md

Toda skill precisa de, no mínimo, um `name` e uma `description` no frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  O OpenClaw segue a especificação [AgentSkills](https://agentskills.io). O
  analisador de frontmatter aceita **somente chaves de linha única** — `metadata` deve ser um
  objeto JSON de linha única. Use `{baseDir}` no corpo para referenciar o caminho da pasta
  da skill.
</Note>

### Chaves opcionais de frontmatter

<ParamField path="homepage" type="string">
  URL exibido como "Site" na interface de Skills do macOS. Também aceito via
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, a skill é exposta como um comando de barra invocável pelo usuário.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, o OpenClaw mantém as instruções da skill fora do prompt normal
  do agente. A skill ainda fica disponível como comando de barra quando `user-invocable`
  também é `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Quando definido como `tool`, o comando de barra ignora o modelo e despacha
  diretamente para uma ferramenta registrada.
</ParamField>

<ParamField path="command-tool" type="string">
  Nome da ferramenta a invocar quando `command-dispatch: tool` está definido.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para despacho de ferramentas, encaminha a string bruta de argumentos para a ferramenta sem
  análise pelo núcleo. A ferramenta recebe
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Controle de elegibilidade

O OpenClaw filtra skills no momento do carregamento usando `metadata.openclaw` (JSON
de linha única no frontmatter). Uma skill sem bloco `metadata.openclaw` é sempre
elegível, a menos que seja explicitamente desativada.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  Quando `true`, sempre inclui a skill e ignora todos os outros controles de elegibilidade.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji opcional mostrado na UI de Skills do macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL opcional mostrada como "Site" na UI de Skills do macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Filtro de plataforma. Quando definido, a skill só é elegível nos sistemas operacionais listados.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Cada binário deve existir no `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Pelo menos um binário deve existir no `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Cada variável de ambiente deve existir no processo ou ser fornecida via configuração.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Cada caminho de `openclaw.json` deve ser verdadeiro.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Nome da variável de ambiente associada a `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Especificações opcionais de instalador usadas pela UI de Skills do macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  Blocos legados `metadata.clawdbot` ainda são aceitos quando
  `metadata.openclaw` está ausente, para que skills instaladas mais antigas mantenham seus
  controles de dependência e dicas de instalador. Novas skills devem usar
  `metadata.openclaw`.
</Note>

### Especificações do instalador

As especificações do instalador informam à UI de Skills do macOS como instalar uma dependência:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Installer selection rules">
    - Quando vários instaladores são listados, o Gateway escolhe uma opção
      preferida (brew quando disponível, caso contrário node).
    - Se todos os instaladores forem `download`, o OpenClaw lista cada entrada para que você possa
      ver todos os artefatos disponíveis.
    - As especificações podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar por plataforma.
    - Instalações de Node respeitam `skills.install.nodeManager` em `openclaw.json`
      (padrão: npm; opções: npm / pnpm / yarn / bun). Isso afeta apenas instalações de
      skills; o runtime do Gateway ainda deve ser Node.
    - Preferência de instalador do Gateway: Homebrew → uv → gerenciador de node configurado →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** o OpenClaw não instala o Homebrew automaticamente nem traduz fórmulas brew
      para comandos de pacote do sistema. Em contêineres Linux sem
      `brew`, instaladores somente brew ficam ocultos; use uma imagem personalizada ou instale
      a dependência manualmente.
    - **Go:** se `go` estiver ausente e `brew` estiver disponível, o Gateway instala
      Go via Homebrew primeiro e define `GOBIN` como o `bin` do Homebrew.
    - **Download:** `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (padrão: automático quando um arquivo compactado é detectado), `stripComponents`,
      `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` é verificado no **host** no momento do carregamento da skill. Se um agente
    roda em uma sandbox, o binário também deve existir **dentro do contêiner**.
    Instale-o via `agents.defaults.sandbox.docker.setupCommand` ou uma imagem personalizada.
    `setupCommand` roda uma vez após a criação do contêiner e requer
    saída de rede, um sistema de arquivos raiz gravável e um usuário root na sandbox.
  </Accordion>
</AccordionGroup>

## Substituições de configuração

Ative/desative e configure skills empacotadas ou gerenciadas em `skills.entries` em
`~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` desativa a skill mesmo quando empacotada ou instalada. A skill empacotada `coding-agent`
  é opt-in — defina `skills.entries.coding-agent.enabled: true`
  e garanta que `claude`, `codex`, `opencode` ou outra CLI compatível
  esteja instalada e autenticada.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Campo de conveniência para skills que declaram `metadata.openclaw.primaryEnv`.
  Compatível com uma string em texto simples ou um objeto SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Variáveis de ambiente injetadas para a execução do agente. Só são injetadas quando a
  variável ainda não está definida no processo.
</ParamField>

<ParamField path="config" type="object">
  Contêiner opcional para campos personalizados de configuração por skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Lista de permissão opcional apenas para skills **empacotadas**. Quando definida, somente skills empacotadas
  na lista são elegíveis. Skills gerenciadas e de workspace não são afetadas.
</ParamField>

<Note>
  Chaves de configuração correspondem ao **nome da skill** por padrão. Se uma skill define
  `metadata.openclaw.skillKey`, use essa chave em `skills.entries`. Coloque nomes
  com hífen entre aspas: JSON5 permite chaves entre aspas.
</Note>

## Injeção de ambiente

Quando uma execução de agente começa, o OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    Resolve a lista efetiva de skills para o agente, aplicando regras de elegibilidade,
    listas de permissão e substituições de configuração.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` são aplicados a
    `process.env` durante a execução.
  </Step>
  <Step title="Builds the system prompt">
    Skills elegíveis são compiladas em um bloco XML compacto e injetadas no
    prompt do sistema.
  </Step>
  <Step title="Restores the environment">
    Depois que a execução termina, o ambiente original é restaurado.
  </Step>
</Steps>

<Warning>
  A injeção de ambiente é limitada à execução do agente no **host**, não à sandbox. Dentro de uma
  sandbox, `env` e `apiKey` não têm efeito. Consulte
  [Configuração de Skills](/pt-BR/tools/skills-config#sandboxed-skills-and-env-vars) para saber como
  passar segredos para execuções em sandbox.
</Warning>

Para o backend empacotado `claude-cli`, o OpenClaw também materializa o mesmo
snapshot de skills elegíveis como um plugin temporário do Claude Code e o passa via
`--plugin-dir`. Outros backends de CLI usam apenas o catálogo de prompt.

## Snapshots e atualização

O OpenClaw captura snapshots de skills elegíveis **quando uma sessão começa** e reutiliza essa
lista para todos os turnos subsequentes na sessão. Alterações em skills ou na configuração entram
em vigor na próxima nova sessão.

Skills são atualizadas no meio da sessão em dois casos:

- O observador de skills detecta uma alteração em `SKILL.md`.
- Um novo nó remoto elegível se conecta.

A lista atualizada é adotada no próximo turno do agente. Se a lista de permissão efetiva
do agente mudar, o OpenClaw atualiza o snapshot para manter as skills visíveis
alinhadas.

<AccordionGroup>
  <Accordion title="Skills watcher">
    Por padrão, o OpenClaw observa pastas de skills e incrementa o snapshot quando
    arquivos `SKILL.md` mudam. Configure em `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    Use `allowSymlinkTargets` para layouts com links simbólicos intencionais em que um link simbólico
    raiz de skill aponta para fora da raiz configurada, por exemplo
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Ative `skills.workshop.allowSymlinkTargetWrites` apenas quando o Skill Workshop
    também deve aplicar propostas por esses caminhos confiáveis com links simbólicos.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Se o Gateway roda no Linux, mas um **nó macOS** está conectado com
    `system.run` permitido, o OpenClaw pode tratar skills exclusivas de macOS como elegíveis quando
    os binários necessários estão presentes nesse nó. O agente deve executar essas
    skills pela ferramenta `exec` com `host=node`.

    Nós offline **não** tornam skills somente remotas visíveis. Se um nó para
    de responder a sondagens de binários, o OpenClaw limpa suas correspondências de binários em cache.

  </Accordion>
</AccordionGroup>

## Impacto em tokens

Quando skills são elegíveis, o OpenClaw injeta um bloco XML compacto no prompt
do sistema. O custo é determinístico:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Sobrecarga base** (somente quando ≥ 1 skill): ~195 caracteres
- **Por skill:** ~97 caracteres + os comprimentos dos campos `name`, `description` e `location`
- O escape de XML expande `& < > " '` em entidades, adicionando alguns caracteres por ocorrência
- Com ~4 caracteres/token, 97 caracteres ≈ 24 tokens por skill antes dos comprimentos dos campos

Mantenha descrições curtas e descritivas para minimizar a sobrecarga no prompt.

## Relacionado

<CardGroup cols={2}>
  <Card title="Creating skills" href="/pt-BR/tools/creating-skills" icon="hammer">
    Guia passo a passo para criar uma skill personalizada.
  </Card>
  <Card title="Skill Workshop" href="/pt-BR/tools/skill-workshop" icon="flask">
    Fila de propostas para skills rascunhadas por agentes.
  </Card>
  <Card title="Skills config" href="/pt-BR/tools/skills-config" icon="gear">
    Esquema completo de configuração `skills.*` e listas de permissão de agentes.
  </Card>
  <Card title="Slash commands" href="/pt-BR/tools/slash-commands" icon="terminal">
    Como comandos slash de skills são registrados e roteados.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Navegue e publique skills no registro público.
  </Card>
  <Card title="Plugins" href="/pt-BR/tools/plugin" icon="plug">
    Plugins podem enviar skills junto com as ferramentas que documentam.
  </Card>
</CardGroup>
