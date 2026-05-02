---
read_when:
    - Adicionar ou modificar Skills
    - Alteração do controle de acesso de Skills, das listas de permissão ou das regras de carregamento
    - Entendendo a precedência de Skills e o comportamento de snapshots
sidebarTitle: Skills
summary: 'Skills: gerenciadas vs. de espaço de trabalho, regras de gate, listas de permissões de agentes e integração de configuração'
title: Skills
x-i18n:
    generated_at: "2026-05-02T21:06:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa pastas de Skills **compatíveis com [AgentSkills](https://agentskills.io)** para ensinar o agente a usar ferramentas. Cada Skill é um diretório que contém um `SKILL.md` com frontmatter YAML e instruções. OpenClaw carrega Skills incluídas mais substituições locais opcionais, e as filtra no momento do carregamento com base no ambiente, na configuração e na presença de binários.

## Locais e precedência

OpenClaw carrega Skills destas fontes, **maior precedência primeiro**:

| #   | Fonte                 | Caminho                          |
| --- | --------------------- | -------------------------------- |
| 1   | Skills do workspace   | `<workspace>/skills`             |
| 2   | Skills de agente do projeto | `<workspace>/.agents/skills`     |
| 3   | Skills de agente pessoais | `~/.agents/skills`               |
| 4   | Skills gerenciadas/locais | `~/.openclaw/skills`             |
| 5   | Skills incluídas      | enviadas com a instalação        |
| 6   | Pastas extras de Skills | `skills.load.extraDirs` (configuração) |

Se um nome de Skill entrar em conflito, a fonte mais alta vence.

O diretório nativo `$CODEX_HOME/skills` do Codex CLI não é uma dessas raízes de Skills do OpenClaw. No modo de harness do Codex, os lançamentos locais do servidor de app usam homes do Codex isolados por agente, portanto as Skills pessoais do Codex CLI não são carregadas implicitamente. Use `openclaw migrate codex --dry-run` para inventariá-las e `openclaw migrate codex` para escolher diretórios de Skills com um prompt interativo de caixas de seleção antes de copiá-las para o workspace atual do agente OpenClaw. Para execuções não interativas, repita `--skill <name>` para as Skills exatas a copiar.

## Skills por agente vs compartilhadas

Em configurações **multiagente**, cada agente tem seu próprio workspace:

| Escopo               | Caminho                                     | Visível para                |
| -------------------- | ------------------------------------------- | --------------------------- |
| Por agente           | `<workspace>/skills`                        | Somente esse agente         |
| Agente do projeto    | `<workspace>/.agents/skills`                | Somente o agente desse workspace |
| Agente pessoal       | `~/.agents/skills`                          | Todos os agentes nessa máquina |
| Gerenciada/local compartilhada | `~/.openclaw/skills`                        | Todos os agentes nessa máquina |
| Diretórios extras compartilhados | `skills.load.extraDirs` (menor precedência) | Todos os agentes nessa máquina |

Mesmo nome em vários lugares → a fonte mais alta vence. Workspace vence agente do projeto, vence agente pessoal, vence gerenciada/local, vence incluída, vence diretórios extras.

## Listas de permissões de Skills do agente

A **localização** da Skill e a **visibilidade** da Skill são controles separados. Localização/precedência decide qual cópia de uma Skill com o mesmo nome vence; listas de permissões de agentes decidem quais Skills um agente pode realmente usar.

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
  <Accordion title="Regras de lista de permissões">
    - Omita `agents.defaults.skills` para Skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
    - Defina `agents.list[].skills: []` para nenhuma Skill.
    - Uma lista `agents.list[].skills` não vazia é o conjunto **final** para esse agente — ela não é mesclada com os padrões.
    - A lista de permissões efetiva se aplica à construção de prompts, descoberta de comandos slash de Skills, sincronização de sandbox e snapshots de Skills.

  </Accordion>
</AccordionGroup>

## Plugins e Skills

Plugins podem enviar suas próprias Skills listando diretórios `skills` em `openclaw.plugin.json` (caminhos relativos à raiz do Plugin). As Skills do Plugin carregam quando o Plugin está habilitado. Este é o lugar certo para guias operacionais específicos de ferramenta que são longos demais para a descrição da ferramenta, mas devem estar disponíveis sempre que o Plugin estiver instalado — por exemplo, o Plugin de navegador envia uma Skill `browser-automation` para controle de navegador em várias etapas.

Diretórios de Skills de Plugins são mesclados no mesmo caminho de baixa precedência que `skills.load.extraDirs`, portanto uma Skill incluída, gerenciada, de agente ou de workspace com o mesmo nome os substitui. Você pode restringi-los via `metadata.openclaw.requires.config` na entrada de configuração do Plugin.

Veja [Plugins](/pt-BR/tools/plugin) para descoberta/configuração e [Ferramentas](/pt-BR/tools) para a superfície de ferramentas que essas Skills ensinam.

## Skill Workshop

O Plugin opcional e experimental **Skill Workshop** pode criar ou atualizar Skills de workspace a partir de procedimentos reutilizáveis observados durante o trabalho do agente. Ele é desabilitado por padrão e deve ser habilitado explicitamente via `plugins.entries.skill-workshop`.

Skill Workshop grava somente em `<workspace>/skills`, verifica conteúdo gerado, dá suporte a aprovação pendente ou gravações seguras automáticas, coloca propostas inseguras em quarentena e atualiza o snapshot de Skills após gravações bem-sucedidas para que novas Skills fiquem disponíveis sem reiniciar o Gateway.

Use-o para correções como _"da próxima vez, verifique a atribuição do GIF"_ ou fluxos de trabalho difíceis de aprender, como listas de verificação de QA de mídia. Comece com aprovação pendente; use gravações automáticas somente em workspaces confiáveis após revisar suas propostas. Guia completo: [Plugin Skill Workshop](/pt-BR/plugins/skill-workshop).

## ClawHub (instalar e sincronizar)

[ClawHub](https://clawhub.ai) é o registro público de Skills para OpenClaw. Use os comandos nativos `openclaw skills` para descobrir/instalar/atualizar, ou o CLI separado `clawhub` para fluxos de trabalho de publicação/sincronização. Guia completo: [ClawHub](/pt-BR/tools/clawhub).

| Ação                              | Comando                                |
| --------------------------------- | -------------------------------------- |
| Instalar uma Skill no workspace   | `openclaw skills install <skill-slug>` |
| Atualizar todas as Skills instaladas | `openclaw skills update --all`         |
| Sincronizar (varrer + publicar atualizações) | `clawhub sync --all`                   |

O `openclaw skills install` nativo instala no diretório `skills/` do workspace ativo. O CLI separado `clawhub` também instala em `./skills` no seu diretório de trabalho atual (ou recorre ao workspace OpenClaw configurado). OpenClaw o detecta como `<workspace>/skills` na próxima sessão.
Raízes de Skills configuradas também dão suporte a um nível de agrupamento, como `skills/<group>/<skill>/SKILL.md`, para que Skills de terceiros relacionadas possam ser mantidas em uma pasta compartilhada sem varredura recursiva ampla.

As páginas de Skills do ClawHub exibem o estado mais recente da varredura de segurança antes da instalação, com páginas de detalhes dos scanners para VirusTotal, ClawScan e análise estática. `openclaw skills install <slug>` continua sendo apenas o caminho de instalação; publicadores recuperam falsos positivos pelo painel do ClawHub ou por `clawhub skill rescan <slug>`.

## Segurança

<Warning>
Trate Skills de terceiros como **código não confiável**. Leia-as antes de habilitar. Prefira execuções em sandbox para entradas não confiáveis e ferramentas arriscadas. Veja [Sandboxing](/pt-BR/gateway/sandboxing) para os controles do lado do agente.
</Warning>

- A descoberta de Skills de workspace e de diretórios extras só aceita raízes de Skills e arquivos `SKILL.md` cujo realpath resolvido permaneça dentro da raiz configurada.
- Instalações de dependências de Skills apoiadas pelo Gateway (`skills.install`, onboarding e a UI de configurações de Skills) executam o scanner integrado de código perigoso antes de executar metadados do instalador. Achados `critical` bloqueiam por padrão, a menos que o chamador defina explicitamente a substituição perigosa; achados suspeitos ainda apenas avisam.
- `openclaw skills install <slug>` é diferente — ele baixa uma pasta de Skill do ClawHub para o workspace e não usa o caminho de metadados do instalador acima.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no processo **host** para essa rodada do agente (não no sandbox). Mantenha segredos fora de prompts e logs.

Para um modelo de ameaças mais amplo e listas de verificação, veja [Segurança](/pt-BR/gateway/security).

## Formato de SKILL.md

`SKILL.md` deve incluir pelo menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw segue a especificação AgentSkills para layout/intenção. O parser usado pelo agente embutido aceita somente chaves de frontmatter de **linha única**; `metadata` deve ser um **objeto JSON de linha única**. Use `{baseDir}` nas instruções para referenciar o caminho da pasta da Skill.

### Chaves opcionais de frontmatter

<ParamField path="homepage" type="string">
  URL exibida como "Site" na UI de Skills do macOS. Também há suporte via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, a Skill é exposta como um comando slash de usuário.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, OpenClaw mantém as instruções da Skill fora do prompt normal do agente. A Skill ainda fica instalada e ainda pode ser executada explicitamente como um comando slash quando `user-invocable` também é `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Quando definido como `tool`, o comando slash contorna o modelo e despacha diretamente para uma ferramenta.
</ParamField>
<ParamField path="command-tool" type="string">
  Nome da ferramenta a invocar quando `command-dispatch: tool` está definido.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para despacho de ferramenta, encaminha a string bruta de argumentos para a ferramenta (sem análise do núcleo). A ferramenta é invocada com `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Restrição (filtros no carregamento)

OpenClaw filtra Skills no momento do carregamento usando `metadata` (JSON de linha única):

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
  Quando `true`, sempre inclui a Skill (ignora outros gates).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opcional usado pela UI de Skills do macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opcional mostrada como "Site" na UI de Skills do macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Lista opcional de plataformas. Se definida, a Skill só é elegível nesses SOs.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Cada um deve existir em `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Pelo menos um deve existir em `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  A variável de ambiente deve existir ou ser fornecida na configuração.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Lista de caminhos de `openclaw.json` que devem ser verdadeiros.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nome da variável de ambiente associada a `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Especificações opcionais de instalador usadas pela UI de Skills do macOS (brew/node/go/uv/download).
</ParamField>

Se nenhum `metadata.openclaw` estiver presente, a Skill é sempre elegível (a menos que esteja desabilitada na configuração ou bloqueada por `skills.allowBundled` para Skills incluídas).

<Note>
Blocos legados `metadata.clawdbot` ainda são aceitos quando `metadata.openclaw` está ausente, então Skills instaladas mais antigas mantêm seus gates de dependência e dicas de instalador. Skills novas e atualizadas devem usar `metadata.openclaw`.
</Note>

### Observações de sandboxing

- `requires.bins` é verificado no **host** no momento do carregamento da Skill.
- Se um agente estiver em sandbox, o binário também deve existir **dentro do contêiner**. Instale-o via `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem personalizada). `setupCommand` é executado uma vez após o contêiner ser criado. Instalações de pacotes também exigem saída de rede, um FS raiz gravável e um usuário root no sandbox.
- Exemplo: a Skill `summarize` (`skills/summarize/SKILL.md`) precisa do CLI `summarize` no contêiner de sandbox para ser executada lá.

### Especificações do instalador

```markdown
---
name: gemini
description: Use a Gemini CLI para assistência de programação e consultas de pesquisa do Google.
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
    - Se vários instaladores estiverem listados, o Gateway escolhe uma única opção preferida (brew quando disponível, caso contrário node).
    - Se todos os instaladores forem `download`, o OpenClaw lista cada entrada para que você possa ver os artefatos disponíveis.
    - As especificações do instalador podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por plataforma.
    - Instalações de Node respeitam `skills.install.nodeManager` em `openclaw.json` (padrão: npm; opções: npm/pnpm/yarn/bun). Isso afeta apenas instalações de Skills; o runtime do Gateway ainda deve ser Node — Bun não é recomendado para WhatsApp/Telegram.
    - A seleção de instalador com suporte do Gateway é orientada por preferência: quando as especificações de instalação misturam tipos, o OpenClaw prefere Homebrew quando `skills.install.preferBrew` está habilitado e `brew` existe, depois `uv`, depois o gerenciador de node configurado e, em seguida, outros fallbacks como `go` ou `download`.
    - Se toda especificação de instalação for `download`, o OpenClaw expõe todas as opções de download em vez de reduzir para um instalador preferido.

  </Accordion>
  <Accordion title="Detalhes por instalador">
    - **Instalações Go:** se `go` estiver ausente e `brew` estiver disponível, o Gateway instala Go via Homebrew primeiro e define `GOBIN` para o `bin` do Homebrew quando possível.
    - **Instalações por download:** `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: automático quando um arquivo compactado é detectado), `stripComponents`, `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Substituições de configuração

Skills empacotadas e gerenciadas podem ser ativadas/desativadas e receber valores de env
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
  `false` desabilita a skill mesmo que ela esteja empacotada ou instalada.
  A skill empacotada `coding-agent` é opcional: defina
  `skills.entries.coding-agent.enabled: true` antes de expô-la a agentes,
  depois garanta que um de `claude`, `codex`, `opencode` ou `pi` esteja instalado e
  autenticado para sua própria CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Conveniência para Skills que declaram `metadata.openclaw.primaryEnv`. Aceita texto simples ou SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Injetado apenas se a variável ainda não estiver definida no processo.
</ParamField>
<ParamField path="config" type="object">
  Conjunto opcional para campos personalizados por skill. Chaves personalizadas devem ficar aqui.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Lista de permissões opcional apenas para Skills **empacotadas**. Se definida, apenas Skills empacotadas na lista são elegíveis (Skills gerenciadas/de workspace não são afetadas).
</ParamField>

Se o nome da skill contiver hifens, coloque a chave entre aspas (JSON5 permite chaves
entre aspas). As chaves de configuração correspondem ao **nome da skill** por padrão — se uma skill
definir `metadata.openclaw.skillKey`, use essa chave em `skills.entries`.

<Note>
Para geração/edição de imagens padrão dentro do OpenClaw, use a ferramenta central
`image_generate` com `agents.defaults.imageGenerationModel` em vez
de uma skill empacotada. Os exemplos de Skills aqui são para fluxos de trabalho
personalizados ou de terceiros. Para análise de imagem nativa, use a ferramenta `image` com
`agents.defaults.imageModel`. Se você escolher `openai/*`, `google/*`,
`fal/*` ou outro modelo de imagem específico de provedor, adicione também a chave
de autenticação/API desse provedor.
</Note>

## Injeção de ambiente

Quando uma execução de agente começa, o OpenClaw:

1. Lê os metadados da skill.
2. Aplica `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` a `process.env`.
3. Cria o prompt de sistema com Skills **elegíveis**.
4. Restaura o ambiente original depois que a execução termina.

A injeção de ambiente é **limitada à execução do agente**, não a um ambiente
global de shell.

Para o backend empacotado `claude-cli`, o OpenClaw também materializa o mesmo
snapshot elegível como um Plugin temporário do Claude Code e o passa com
`--plugin-dir`. O Claude Code pode então usar seu resolvedor de skill nativo enquanto
o OpenClaw ainda controla precedência, listas de permissões por agente, gating e
injeção de env/chave de API de `skills.entries.*`. Outros backends de CLI usam apenas o
catálogo de prompts.

## Snapshots e atualização

O OpenClaw tira snapshots das Skills elegíveis **quando uma sessão começa** e
reutiliza essa lista para turnos subsequentes na mesma sessão. Alterações em
Skills ou configuração entram em vigor na próxima nova sessão.

Skills podem ser atualizadas no meio da sessão em dois casos:

- O observador de Skills está habilitado.
- Um novo nó remoto elegível aparece.

Pense nisso como um **hot reload**: a lista atualizada é usada no
próximo turno do agente. Se a lista de permissões efetiva de Skills do agente mudar para essa
sessão, o OpenClaw atualiza o snapshot para que as Skills visíveis permaneçam alinhadas
com o agente atual.

### Observador de Skills

Por padrão, o OpenClaw observa pastas de Skills e incrementa o snapshot de Skills
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

### Nós macOS remotos (Gateway Linux)

Se o Gateway roda no Linux, mas um **nó macOS** está conectado com
`system.run` permitido (segurança de aprovações Exec não definida como `deny`),
o OpenClaw pode tratar Skills exclusivas de macOS como elegíveis quando os binários
necessários estiverem presentes nesse nó. O agente deve executar essas Skills
via ferramenta `exec` com `host=node`.

Isso depende de o nó relatar seu suporte a comandos e de uma sondagem de binário
via `system.which` ou `system.run`. Nós offline **não** tornam
Skills somente remotas visíveis. Se um nó conectado parar de responder a sondagens
de binário, o OpenClaw limpa suas correspondências de binário em cache para que agentes não vejam mais
Skills que não podem ser executadas lá no momento.

## Impacto em tokens

Quando Skills são elegíveis, o OpenClaw injeta uma lista XML compacta de Skills
disponíveis no prompt de sistema (via `formatSkillsForPrompt` em
`pi-coding-agent`). O custo é determinístico:

- **Sobrecarga base** (somente quando ≥1 skill): 195 caracteres.
- **Por skill:** 97 caracteres + o comprimento dos valores `<name>`, `<description>` e `<location>` com escape XML.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

O escape XML expande `& < > " '` em entidades (`&amp;`, `&lt;`, etc.),
aumentando o comprimento. As contagens de tokens variam conforme o tokenizer do modelo. Uma estimativa aproximada
no estilo OpenAI é ~4 caracteres/token, então **97 caracteres ≈ 24 tokens** por
skill mais os comprimentos reais dos seus campos.

## Ciclo de vida de Skills gerenciadas

O OpenClaw fornece um conjunto básico de Skills como **Skills empacotadas** com a
instalação (pacote npm ou OpenClaw.app). `~/.openclaw/skills` existe para
substituições locais — por exemplo, fixar ou corrigir uma skill sem
alterar a cópia empacotada. Skills de workspace pertencem ao usuário e substituem
ambas em conflitos de nome.

## Procurando mais Skills?

Navegue em [https://clawhub.ai](https://clawhub.ai). Esquema completo de configuração:
[Configuração de Skills](/pt-BR/tools/skills-config).

## Relacionados

- [ClawHub](/pt-BR/tools/clawhub) — registro público de Skills
- [Criando Skills](/pt-BR/tools/creating-skills) — criação de Skills personalizadas
- [Plugins](/pt-BR/tools/plugin) — visão geral do sistema de plugins
- [Plugin Skill Workshop](/pt-BR/plugins/skill-workshop) — gere Skills a partir do trabalho do agente
- [Configuração de Skills](/pt-BR/tools/skills-config) — referência de configuração de Skills
- [Comandos de barra](/pt-BR/tools/slash-commands) — todos os comandos de barra disponíveis
