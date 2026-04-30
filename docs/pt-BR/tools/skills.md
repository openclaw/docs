---
read_when:
    - Adicionando ou modificando Skills
    - Alterando controles de habilitação de Skills, listas de permissão ou regras de carregamento
    - Entendendo a precedência das Skills e o comportamento de snapshot
sidebarTitle: Skills
summary: 'Skills: gerenciadas vs. de espaço de trabalho, regras de gating, listas de permissões de agentes e integração de configuração'
title: Skills
x-i18n:
    generated_at: "2026-04-30T20:05:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58d690786756bd3539940aae9f2abcb8a497798ed7b6afeb5e6d6e255fcf257
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa pastas de habilidades **compatíveis com [AgentSkills](https://agentskills.io)** para ensinar o agente a usar ferramentas. Cada habilidade é um diretório contendo um `SKILL.md` com frontmatter YAML e instruções. OpenClaw carrega habilidades incluídas junto com substituições locais opcionais e as filtra no momento do carregamento com base no ambiente, na configuração e na presença de binários.

## Locais e precedência

OpenClaw carrega habilidades destas fontes, **da maior precedência para a menor**:

| #   | Fonte                 | Caminho                          |
| --- | --------------------- | -------------------------------- |
| 1   | Habilidades do workspace | `<workspace>/skills`          |
| 2   | Habilidades do agente do projeto | `<workspace>/.agents/skills` |
| 3   | Habilidades pessoais do agente | `~/.agents/skills`       |
| 4   | Habilidades gerenciadas/locais | `~/.openclaw/skills`    |
| 5   | Habilidades incluídas | enviadas com a instalação        |
| 6   | Pastas extras de habilidades | `skills.load.extraDirs` (configuração) |

Se houver conflito no nome de uma habilidade, a fonte mais alta vence.

O diretório nativo `$CODEX_HOME/skills` da CLI do Codex não é uma dessas raízes de habilidades do OpenClaw. No modo de harness do Codex, inicializações locais do app-server usam homes do Codex isoladas por agente, portanto habilidades pessoais da CLI do Codex não são carregadas implicitamente. Use `openclaw migrate codex --dry-run` para inventariá-las e `openclaw migrate codex` para escolher diretórios de habilidades com um prompt interativo de caixas de seleção antes de copiá-las para o workspace atual do agente OpenClaw. Para execuções não interativas, repita `--skill <name>` para as habilidades exatas a copiar.

## Habilidades por agente vs. compartilhadas

Em configurações **multiagente**, cada agente tem seu próprio workspace:

| Escopo               | Caminho                                     | Visível para                |
| -------------------- | ------------------------------------------- | --------------------------- |
| Por agente           | `<workspace>/skills`                        | Somente esse agente         |
| Agente do projeto    | `<workspace>/.agents/skills`                | Somente o agente desse workspace |
| Agente pessoal       | `~/.agents/skills`                          | Todos os agentes nessa máquina |
| Gerenciadas/locais compartilhadas | `~/.openclaw/skills`            | Todos os agentes nessa máquina |
| Diretórios extras compartilhados | `skills.load.extraDirs` (menor precedência) | Todos os agentes nessa máquina |

Mesmo nome em vários lugares → a fonte mais alta vence. Workspace vence agente do projeto, que vence agente pessoal, que vence gerenciadas/locais, que vence incluídas, que vence diretórios extras.

## Listas de permissões de habilidades por agente

A **localização** da habilidade e a **visibilidade** da habilidade são controles separados. Localização/precedência decide qual cópia de uma habilidade com o mesmo nome vence; listas de permissões por agente decidem quais habilidades um agente pode realmente usar.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Regras da lista de permissões">
    - Omita `agents.defaults.skills` para habilidades irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
    - Defina `agents.list[].skills: []` para nenhuma habilidade.
    - Uma lista `agents.list[].skills` não vazia é o conjunto **final** para esse agente — ela não é mesclada com os padrões.
    - A lista de permissões efetiva se aplica à construção de prompts, descoberta de comandos slash de habilidades, sincronização de sandbox e snapshots de habilidades.
  </Accordion>
</AccordionGroup>

## Plugins e habilidades

Plugins podem enviar suas próprias habilidades listando diretórios `skills` em `openclaw.plugin.json` (caminhos relativos à raiz do plugin). Habilidades de plugin carregam quando o plugin está habilitado. Este é o lugar certo para guias operacionais específicos de ferramenta que são longos demais para a descrição da ferramenta, mas devem estar disponíveis sempre que o plugin estiver instalado — por exemplo, o plugin de navegador envia uma habilidade `browser-automation` para controle de navegador em várias etapas.

Diretórios de habilidades de plugin são mesclados no mesmo caminho de baixa precedência que `skills.load.extraDirs`, portanto uma habilidade incluída, gerenciada, de agente ou de workspace com o mesmo nome os substitui. Você pode restringi-los via `metadata.openclaw.requires.config` na entrada de configuração do plugin.

Veja [Plugins](/pt-BR/tools/plugin) para descoberta/configuração e [Ferramentas](/pt-BR/tools) para a superfície de ferramentas que essas habilidades ensinam.

## Skill Workshop

O plugin opcional e experimental **Skill Workshop** pode criar ou atualizar habilidades de workspace a partir de procedimentos reutilizáveis observados durante o trabalho do agente. Ele é desabilitado por padrão e deve ser habilitado explicitamente via `plugins.entries.skill-workshop`.

Skill Workshop grava somente em `<workspace>/skills`, verifica conteúdo gerado, oferece suporte a aprovação pendente ou gravações seguras automáticas, coloca propostas inseguras em quarentena e atualiza o snapshot de habilidades após gravações bem-sucedidas para que novas habilidades fiquem disponíveis sem reiniciar o Gateway.

Use-o para correções como _"da próxima vez, verifique a atribuição do GIF"_ ou workflows difíceis de consolidar, como checklists de QA de mídia. Comece com aprovação pendente; use gravações automáticas somente em workspaces confiáveis após revisar suas propostas. Guia completo: [plugin Skill Workshop](/pt-BR/plugins/skill-workshop).

## ClawHub (instalação e sincronização)

[ClawHub](https://clawhub.ai) é o registro público de habilidades do OpenClaw. Use comandos nativos `openclaw skills` para descobrir/instalar/atualizar, ou a CLI separada `clawhub` para workflows de publicação/sincronização. Guia completo: [ClawHub](/pt-BR/tools/clawhub).

| Ação                              | Comando                                |
| --------------------------------- | -------------------------------------- |
| Instalar uma habilidade no workspace | `openclaw skills install <skill-slug>` |
| Atualizar todas as habilidades instaladas | `openclaw skills update --all`   |
| Sincronizar (verificar + publicar atualizações) | `clawhub sync --all`        |

O `openclaw skills install` nativo instala no diretório `skills/` do workspace ativo. A CLI separada `clawhub` também instala em `./skills` no seu diretório de trabalho atual (ou recorre ao workspace OpenClaw configurado). OpenClaw detecta isso como `<workspace>/skills` na próxima sessão.
Raízes de habilidades configuradas também aceitam um nível de agrupamento, como `skills/<group>/<skill>/SKILL.md`, para que habilidades de terceiros relacionadas possam ser mantidas em uma pasta compartilhada sem varredura recursiva ampla.

Páginas de habilidades do ClawHub exibem o estado mais recente da varredura de segurança antes da instalação, com páginas de detalhes do scanner para VirusTotal, ClawScan e análise estática. `openclaw skills install <slug>` continua sendo apenas o caminho de instalação; publicadores corrigem falsos positivos pelo painel do ClawHub ou por `clawhub skill rescan <slug>`.

## Segurança

<Warning>
Trate habilidades de terceiros como **código não confiável**. Leia-as antes de habilitar. Prefira execuções em sandbox para entradas não confiáveis e ferramentas arriscadas. Veja [Sandboxing](/pt-BR/gateway/sandboxing) para os controles do lado do agente.
</Warning>

- A descoberta de habilidades de workspace e diretório extra aceita apenas raízes de habilidades e arquivos `SKILL.md` cujo realpath resolvido permaneça dentro da raiz configurada.
- Instalações de dependências de habilidades apoiadas pelo Gateway (`skills.install`, onboarding e a UI de configurações de Skills) executam o scanner interno de código perigoso antes de executar metadados de instalador. Descobertas `critical` bloqueiam por padrão, a menos que o chamador defina explicitamente a substituição perigosa; descobertas suspeitas ainda apenas alertam.
- `openclaw skills install <slug>` é diferente — ele baixa uma pasta de habilidade do ClawHub para o workspace e não usa o caminho de metadados de instalador acima.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no processo **host** para aquele turno do agente (não no sandbox). Mantenha segredos fora de prompts e logs.

Para um modelo de ameaças e checklists mais amplos, veja [Segurança](/pt-BR/gateway/security).

## Formato do SKILL.md

`SKILL.md` deve incluir pelo menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw segue a especificação AgentSkills para layout/intenção. O parser usado pelo agente incorporado aceita apenas chaves de frontmatter de **linha única**; `metadata` deve ser um **objeto JSON de linha única**. Use `{baseDir}` nas instruções para referenciar o caminho da pasta da habilidade.

### Chaves opcionais de frontmatter

<ParamField path="homepage" type="string">
  URL exibida como "Site" na UI de Skills do macOS. Também aceito via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, a habilidade é exposta como um comando slash do usuário.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, a habilidade é excluída do prompt do modelo (ainda disponível via invocação pelo usuário).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Quando definido como `tool`, o comando slash ignora o modelo e despacha diretamente para uma ferramenta.
</ParamField>
<ParamField path="command-tool" type="string">
  Nome da ferramenta a invocar quando `command-dispatch: tool` estiver definido.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para despacho de ferramenta, encaminha a string bruta de argumentos para a ferramenta (sem análise pelo core). A ferramenta é invocada com `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (filtros no momento do carregamento)

OpenClaw filtra habilidades no momento do carregamento usando `metadata` (JSON de linha única):

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

Campos em `metadata.openclaw`:

<ParamField path="always" type="boolean">
  Quando `true`, sempre inclui a habilidade (ignora outros gates).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opcional usado pela UI de Skills do macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opcional mostrada como "Site" na UI de Skills do macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Lista opcional de plataformas. Se definida, a habilidade só é elegível nesses sistemas operacionais.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Cada um deve existir no `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Pelo menos um deve existir no `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  A variável de ambiente deve existir ou ser fornecida na configuração.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lista de caminhos de `openclaw.json` que devem ser truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nome da variável de ambiente associada a `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Especificações opcionais de instalador usadas pela UI de Skills do macOS (brew/node/go/uv/download).
</ParamField>

Se nenhum `metadata.openclaw` estiver presente, a habilidade será sempre elegível (a menos que esteja desabilitada na configuração ou bloqueada por `skills.allowBundled` para habilidades incluídas).

<Note>
Blocos legados `metadata.clawdbot` ainda são aceitos quando `metadata.openclaw` está ausente, para que habilidades instaladas antigas mantenham seus gates de dependência e dicas de instalador. Habilidades novas e atualizadas devem usar `metadata.openclaw`.
</Note>

### Observações de sandboxing

- `requires.bins` é verificado no **host** no momento do carregamento da habilidade.
- Se um agente estiver em sandbox, o binário também deve existir **dentro do contêiner**. Instale-o via `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem personalizada). `setupCommand` é executado uma vez após a criação do contêiner. Instalações de pacotes também exigem saída de rede, um sistema de arquivos raiz gravável e um usuário root no sandbox.
- Exemplo: a habilidade `summarize` (`skills/summarize/SKILL.md`) precisa da CLI `summarize` no contêiner de sandbox para ser executada lá.

### Especificações de instalador

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
  <Accordion title="Regras de seleção do instalador">
    - Se vários instaladores estiverem listados, o Gateway escolhe uma única opção preferida (brew quando disponível; caso contrário, node).
    - Se todos os instaladores forem `download`, o OpenClaw lista cada entrada para que você possa ver os artefatos disponíveis.
    - As especificações de instalador podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por plataforma.
    - Instalações via Node respeitam `skills.install.nodeManager` em `openclaw.json` (padrão: npm; opções: npm/pnpm/yarn/bun). Isso afeta apenas instalações de skill; o runtime do Gateway ainda deve ser Node — Bun não é recomendado para WhatsApp/Telegram.
    - A seleção de instalador apoiada pelo Gateway é guiada por preferência: quando as especificações de instalação misturam tipos, o OpenClaw prefere Homebrew quando `skills.install.preferBrew` está habilitado e `brew` existe, depois `uv`, depois o gerenciador de node configurado e, então, outros fallbacks como `go` ou `download`.
    - Se todas as especificações de instalação forem `download`, o OpenClaw exibe todas as opções de download em vez de reduzi-las a um instalador preferido.

  </Accordion>
  <Accordion title="Detalhes por instalador">
    - **Instalações via Go:** se `go` estiver ausente e `brew` estiver disponível, o gateway instala Go via Homebrew primeiro e define `GOBIN` como o `bin` do Homebrew quando possível.
    - **Instalações por download:** `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: automático quando um arquivo compactado é detectado), `stripComponents`, `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Substituições de configuração

Skills incluídas e gerenciadas podem ser ativadas/desativadas e receber valores de env
em `skills.entries` em `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
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
  `false` desabilita a skill mesmo que ela esteja incluída ou instalada.
  A skill incluída `coding-agent` é opt-in: defina
  `skills.entries.coding-agent.enabled: true` antes de expô-la a agentes,
  depois garanta que um de `claude`, `codex`, `opencode` ou `pi` esteja instalado e
  autenticado para sua própria CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Conveniência para skills que declaram `metadata.openclaw.primaryEnv`. Aceita texto simples ou SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Injetado apenas se a variável ainda não estiver definida no processo.
</ParamField>
<ParamField path="config" type="object">
  Contêiner opcional para campos personalizados por skill. Chaves personalizadas devem ficar aqui.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Allowlist opcional apenas para skills **incluídas**. Se definida, apenas as skills incluídas na lista são elegíveis (skills gerenciadas/de workspace não são afetadas).
</ParamField>

Se o nome da skill contiver hífens, coloque a chave entre aspas (JSON5 permite
chaves entre aspas). As chaves de configuração correspondem ao **nome da skill** por padrão — se uma skill
definir `metadata.openclaw.skillKey`, use essa chave em `skills.entries`.

<Note>
Para geração/edição de imagens padrão dentro do OpenClaw, use a ferramenta central
`image_generate` com `agents.defaults.imageGenerationModel` em vez de
uma skill incluída. Os exemplos de skill aqui são para fluxos de trabalho personalizados ou de terceiros.
Para análise de imagem nativa, use a ferramenta `image` com
`agents.defaults.imageModel`. Se você escolher `openai/*`, `google/*`,
`fal/*` ou outro modelo de imagem específico de provedor, adicione também a
chave de auth/API desse provedor.
</Note>

## Injeção de ambiente

Quando uma execução de agente começa, o OpenClaw:

1. Lê os metadados da skill.
2. Aplica `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` a `process.env`.
3. Constrói o prompt do sistema com skills **elegíveis**.
4. Restaura o ambiente original depois que a execução termina.

A injeção de ambiente é **escopada à execução do agente**, não a um ambiente
global de shell.

Para o backend `claude-cli` incluído, o OpenClaw também materializa o mesmo
snapshot elegível como um Plugin temporário do Claude Code e o passa com
`--plugin-dir`. O Claude Code pode então usar seu resolvedor nativo de skill enquanto
o OpenClaw ainda controla precedência, allowlists por agente, gating e
injeção de env/chave de API de `skills.entries.*`. Outros backends de CLI usam apenas o
catálogo de prompts.

## Snapshots e atualização

O OpenClaw cria snapshots das skills elegíveis **quando uma sessão começa** e
reutiliza essa lista para turnos subsequentes na mesma sessão. Alterações em
skills ou na configuração entram em vigor na próxima nova sessão.

Skills podem ser atualizadas no meio da sessão em dois casos:

- O watcher de skills está habilitado.
- Um novo node remoto elegível aparece.

Pense nisso como um **hot reload**: a lista atualizada é usada no
próximo turno do agente. Se a allowlist efetiva de skills do agente mudar para essa
sessão, o OpenClaw atualiza o snapshot para que as skills visíveis permaneçam alinhadas
com o agente atual.

### Watcher de Skills

Por padrão, o OpenClaw observa pastas de skills e incrementa o snapshot de skills
quando arquivos `SKILL.md` mudam. Configure em `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### Nodes macOS remotos (gateway Linux)

Se o Gateway estiver rodando no Linux, mas um **node macOS** estiver conectado com
`system.run` permitido (segurança de aprovações Exec não definida como `deny`),
o OpenClaw poderá tratar skills exclusivas do macOS como elegíveis quando os binários
necessários estiverem presentes nesse node. O agente deve executar essas skills
pela ferramenta `exec` com `host=node`.

Isso depende de o node relatar seu suporte a comandos e de uma sondagem de binário
via `system.which` ou `system.run`. Nodes offline **não** tornam
skills somente remotas visíveis. Se um node conectado parar de responder a sondagens
de binários, o OpenClaw limpa suas correspondências de binários em cache para que agentes não vejam mais
skills que não podem rodar lá no momento.

## Impacto em tokens

Quando skills são elegíveis, o OpenClaw injeta uma lista XML compacta de skills
disponíveis no prompt do sistema (via `formatSkillsForPrompt` em
`pi-coding-agent`). O custo é determinístico:

- **Sobrecarga base** (somente quando ≥1 skill): 195 caracteres.
- **Por skill:** 97 caracteres + o comprimento dos valores escapados para XML de `<name>`, `<description>` e `<location>`.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

O escape de XML expande `& < > " '` em entidades (`&amp;`, `&lt;`, etc.),
aumentando o comprimento. As contagens de tokens variam conforme o tokenizador do modelo. Uma estimativa
aproximada no estilo OpenAI é ~4 caracteres/token, então **97 caracteres ≈ 24 tokens** por
skill, além dos comprimentos reais dos seus campos.

## Ciclo de vida de skills gerenciadas

O OpenClaw distribui um conjunto de base de skills como **skills incluídas** com a
instalação (pacote npm ou OpenClaw.app). `~/.openclaw/skills` existe para
substituições locais — por exemplo, fixar ou corrigir uma skill sem
alterar a cópia incluída. Skills de workspace pertencem ao usuário e substituem
ambas em conflitos de nome.

## Procurando mais skills?

Navegue por [https://clawhub.ai](https://clawhub.ai). Esquema completo de configuração:
[Configuração de Skills](/pt-BR/tools/skills-config).

## Relacionado

- [ClawHub](/pt-BR/tools/clawhub) — registro público de skills
- [Criação de skills](/pt-BR/tools/creating-skills) — criando skills personalizadas
- [Plugins](/pt-BR/tools/plugin) — visão geral do sistema de Plugin
- [Plugin Skill Workshop](/pt-BR/plugins/skill-workshop) — gerar skills a partir do trabalho de agentes
- [Configuração de Skills](/pt-BR/tools/skills-config) — referência de configuração de skill
- [Comandos de barra](/pt-BR/tools/slash-commands) — todos os comandos de barra disponíveis
