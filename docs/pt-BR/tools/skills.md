---
read_when:
    - Adicionando ou modificando Skills
    - Alterar o controle de Skills, listas de permissões ou regras de carregamento
    - Entendendo a precedência de Skills e o comportamento de instantâneo
sidebarTitle: Skills
summary: 'Skills: gerenciadas vs. do espaço de trabalho, regras de controle, listas de permissão de agentes e integração da configuração'
title: Skills
x-i18n:
    generated_at: "2026-04-30T10:13:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa pastas de skill **compatíveis com [AgentSkills](https://agentskills.io)** para ensinar ao agente como usar ferramentas. Cada skill é um diretório contendo um `SKILL.md` com frontmatter YAML e instruções. O OpenClaw carrega skills agrupadas mais substituições locais opcionais, e as filtra no momento do carregamento com base no ambiente, na configuração e na presença de binários.

## Locais e precedência

O OpenClaw carrega skills destas fontes, **maior precedência primeiro**:

| #   | Fonte                 | Caminho                          |
| --- | --------------------- | -------------------------------- |
| 1   | Skills do workspace   | `<workspace>/skills`             |
| 2   | Skills do agente do projeto | `<workspace>/.agents/skills`     |
| 3   | Skills pessoais do agente | `~/.agents/skills`               |
| 4   | Skills gerenciadas/locais | `~/.openclaw/skills`             |
| 5   | Skills agrupadas      | enviadas com a instalação        |
| 6   | Pastas extras de skills | `skills.load.extraDirs` (config) |

Se um nome de skill entrar em conflito, a fonte de maior precedência vence.

## Skills por agente vs compartilhadas

Em configurações **multiagente**, cada agente tem seu próprio workspace:

| Escopo                | Caminho                                     | Visível para                |
| -------------------- | ------------------------------------------- | --------------------------- |
| Por agente           | `<workspace>/skills`                        | Somente esse agente         |
| Agente do projeto    | `<workspace>/.agents/skills`                | Somente o agente desse workspace |
| Agente pessoal       | `~/.agents/skills`                          | Todos os agentes nessa máquina |
| Gerenciada/local compartilhada | `~/.openclaw/skills`                        | Todos os agentes nessa máquina |
| Diretórios extras compartilhados | `skills.load.extraDirs` (menor precedência) | Todos os agentes nessa máquina |

Mesmo nome em vários lugares → a fonte de maior precedência vence. Workspace supera agente do projeto, que supera agente pessoal, que supera gerenciada/local, que supera agrupada, que supera diretórios extras.

## Listas de permissão de skills por agente

A **localização** da skill e a **visibilidade** da skill são controles separados. Localização/precedência decide qual cópia de uma skill com o mesmo nome vence; listas de permissão de agentes decidem quais skills um agente pode realmente usar.

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
  <Accordion title="Regras da lista de permissão">
    - Omita `agents.defaults.skills` para skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
    - Defina `agents.list[].skills: []` para nenhuma skill.
    - Uma lista `agents.list[].skills` não vazia é o conjunto **final** para esse
      agente — ela não é mesclada com os padrões.
    - A lista de permissão efetiva se aplica à construção de prompts, à descoberta
      de comandos de barra de skills, à sincronização da sandbox e aos snapshots de skills.
  </Accordion>
</AccordionGroup>

## Plugins e skills

Plugins podem enviar suas próprias skills listando diretórios `skills` em `openclaw.plugin.json` (caminhos relativos à raiz do Plugin). As skills do Plugin são carregadas quando o Plugin está habilitado. Este é o lugar certo para guias operacionais específicos de ferramentas que são longos demais para a descrição da ferramenta, mas devem estar disponíveis sempre que o Plugin estiver instalado — por exemplo, o Plugin de navegador envia uma skill `browser-automation` para controle de navegador em várias etapas.

Diretórios de skills de Plugins são mesclados no mesmo caminho de baixa precedência de `skills.load.extraDirs`, então uma skill agrupada, gerenciada, de agente ou de workspace com o mesmo nome os substitui. Você pode restringi-los via `metadata.openclaw.requires.config` na entrada de configuração do Plugin.

Consulte [Plugins](/pt-BR/tools/plugin) para descoberta/configuração e [Ferramentas](/pt-BR/tools) para a superfície de ferramentas que essas skills ensinam.

## Skill Workshop

O Plugin opcional e experimental **Skill Workshop** pode criar ou atualizar skills de workspace a partir de procedimentos reutilizáveis observados durante o trabalho do agente. Ele é desabilitado por padrão e deve ser habilitado explicitamente via `plugins.entries.skill-workshop`.

O Skill Workshop escreve somente em `<workspace>/skills`, verifica o conteúdo gerado, oferece suporte a aprovação pendente ou escritas seguras automáticas, coloca propostas inseguras em quarentena e atualiza o snapshot de skills após escritas bem-sucedidas para que novas skills fiquem disponíveis sem reiniciar o Gateway.

Use-o para correções como _"da próxima vez, verifique a atribuição de GIF"_ ou fluxos de trabalho conquistados com esforço, como checklists de QA de mídia. Comece com aprovação pendente; use escritas automáticas somente em workspaces confiáveis após revisar suas propostas. Guia completo: [Plugin Skill Workshop](/pt-BR/plugins/skill-workshop).

## ClawHub (instalação e sincronização)

[ClawHub](https://clawhub.ai) é o registro público de skills para OpenClaw. Use comandos nativos `openclaw skills` para descobrir/instalar/atualizar, ou a CLI `clawhub` separada para fluxos de publicação/sincronização. Guia completo: [ClawHub](/pt-BR/tools/clawhub).

| Ação                              | Comando                                |
| ---------------------------------- | -------------------------------------- |
| Instalar uma skill no workspace    | `openclaw skills install <skill-slug>` |
| Atualizar todas as skills instaladas | `openclaw skills update --all`         |
| Sincronizar (verificar + publicar atualizações) | `clawhub sync --all`                   |

O `openclaw skills install` nativo instala no diretório `skills/` do workspace ativo. A CLI `clawhub` separada também instala em `./skills` no diretório de trabalho atual (ou recorre ao workspace OpenClaw configurado). O OpenClaw detecta isso como `<workspace>/skills` na próxima sessão.
Raízes de skills configuradas também aceitam um nível de agrupamento, como `skills/<group>/<skill>/SKILL.md`, para que skills de terceiros relacionadas possam ser mantidas em uma pasta compartilhada sem varredura recursiva ampla.

As páginas de skills do ClawHub expõem o estado mais recente da verificação de segurança antes da instalação, com páginas de detalhes dos verificadores para VirusTotal, ClawScan e análise estática. `openclaw skills install <slug>` continua sendo apenas o caminho de instalação; publicadores recuperam falsos positivos pelo painel do ClawHub ou por `clawhub skill rescan <slug>`.

## Segurança

<Warning>
Trate skills de terceiros como **código não confiável**. Leia-as antes de habilitar.
Prefira execuções em sandbox para entradas não confiáveis e ferramentas arriscadas. Consulte
[Sandboxing](/pt-BR/gateway/sandboxing) para os controles do lado do agente.
</Warning>

- A descoberta de skills de workspace e de diretórios extras só aceita raízes de skills e arquivos `SKILL.md` cujo realpath resolvido permaneça dentro da raiz configurada.
- Instalações de dependências de skills respaldadas pelo Gateway (`skills.install`, onboarding e a UI de configurações de Skills) executam o verificador integrado de código perigoso antes de executar metadados do instalador. Achados `critical` bloqueiam por padrão, a menos que o chamador defina explicitamente a substituição perigosa; achados suspeitos ainda apenas avisam.
- `openclaw skills install <slug>` é diferente — ele baixa uma pasta de skill do ClawHub para o workspace e não usa o caminho de metadados do instalador acima.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no processo do **host** para aquela rodada do agente (não na sandbox). Mantenha segredos fora de prompts e logs.

Para um modelo de ameaças e checklists mais amplos, consulte [Segurança](/pt-BR/gateway/security).

## Formato SKILL.md

`SKILL.md` deve incluir pelo menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

O OpenClaw segue a especificação AgentSkills para layout/intenção. O parser usado pelo agente incorporado oferece suporte somente a chaves de frontmatter de **linha única**; `metadata` deve ser um **objeto JSON de linha única**. Use `{baseDir}` nas instruções para referenciar o caminho da pasta da skill.

### Chaves opcionais de frontmatter

<ParamField path="homepage" type="string">
  URL exibida como "Site" na UI de Skills do macOS. Também compatível via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, a skill é exposta como comando de barra do usuário.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, a skill é excluída do prompt do modelo (ainda disponível por invocação do usuário).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Quando definido como `tool`, o comando de barra ignora o modelo e despacha diretamente para uma ferramenta.
</ParamField>
<ParamField path="command-tool" type="string">
  Nome da ferramenta a invocar quando `command-dispatch: tool` estiver definido.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para despacho de ferramenta, encaminha a string de argumentos brutos para a ferramenta (sem parsing pelo core). A ferramenta é invocada com `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (filtros no momento do carregamento)

O OpenClaw filtra skills no momento do carregamento usando `metadata` (JSON de linha única):

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
  Quando `true`, sempre inclui a skill (ignora outros gates).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opcional usado pela UI de Skills do macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opcional exibida como "Site" na UI de Skills do macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Lista opcional de plataformas. Se definida, a skill só é elegível nesses SOs.
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
  Lista de caminhos `openclaw.json` que devem ser truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nome da variável de ambiente associada a `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Especificações opcionais de instalador usadas pela UI de Skills do macOS (brew/node/go/uv/download).
</ParamField>

Se nenhum `metadata.openclaw` estiver presente, a skill é sempre elegível (a menos que seja desabilitada na configuração ou bloqueada por `skills.allowBundled` para skills agrupadas).

<Note>
Blocos legados `metadata.clawdbot` ainda são aceitos quando `metadata.openclaw` está ausente, então skills instaladas mais antigas mantêm seus gates de dependência e dicas de instalador. Skills novas e atualizadas devem usar `metadata.openclaw`.
</Note>

### Observações sobre sandbox

- `requires.bins` é verificado no **host** no momento do carregamento da skill.
- Se um agente estiver em sandbox, o binário também deve existir **dentro do contêiner**. Instale-o via `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem personalizada). `setupCommand` é executado uma vez depois que o contêiner é criado. Instalações de pacotes também exigem saída de rede, um FS raiz gravável e um usuário root na sandbox.
- Exemplo: a skill `summarize` (`skills/summarize/SKILL.md`) precisa da CLI `summarize` no contêiner da sandbox para ser executada lá.

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
    - Se vários instaladores forem listados, o Gateway escolhe uma única opção preferida (brew quando disponível, caso contrário node).
    - Se todos os instaladores forem `download`, o OpenClaw lista cada entrada para que você possa ver os artefatos disponíveis.
    - As especificações do instalador podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por plataforma.
    - Instalações com Node respeitam `skills.install.nodeManager` em `openclaw.json` (padrão: npm; opções: npm/pnpm/yarn/bun). Isso afeta apenas instalações de Skills; o runtime do Gateway ainda deve ser Node — Bun não é recomendado para WhatsApp/Telegram.
    - A seleção de instalador apoiada pelo Gateway é orientada por preferência: quando as especificações de instalação misturam tipos, o OpenClaw prefere Homebrew quando `skills.install.preferBrew` está habilitado e `brew` existe, depois `uv`, depois o gerenciador de node configurado, e então outros fallbacks como `go` ou `download`.
    - Se toda especificação de instalação for `download`, o OpenClaw expõe todas as opções de download em vez de reduzi-las a um instalador preferido.

  </Accordion>
  <Accordion title="Detalhes por instalador">
    - **Instalações com Go:** se `go` estiver ausente e `brew` estiver disponível, o Gateway instala Go via Homebrew primeiro e define `GOBIN` para o `bin` do Homebrew quando possível.
    - **Instalações por download:** `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: automático quando um arquivo compactado é detectado), `stripComponents`, `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Substituições de configuração

Skills incluídas no pacote e gerenciadas podem ser ativadas/desativadas e receber valores de env
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
  `false` desabilita a skill mesmo que ela esteja incluída no pacote ou instalada.
  A skill `coding-agent` incluída no pacote é opcional: defina
  `skills.entries.coding-agent.enabled: true` antes de expô-la a agentes,
  depois garanta que um de `claude`, `codex`, `opencode` ou `pi` esteja instalado e
  autenticado para sua própria CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Conveniência para skills que declaram `metadata.openclaw.primaryEnv`. Oferece suporte a texto simples ou SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Injetado apenas se a variável ainda não estiver definida no processo.
</ParamField>
<ParamField path="config" type="object">
  Contêiner opcional para campos personalizados por skill. Chaves personalizadas devem ficar aqui.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Lista de permissões opcional apenas para skills **incluídas no pacote**. Se definida, apenas skills incluídas no pacote que estiverem na lista serão elegíveis (skills gerenciadas/de workspace não são afetadas).
</ParamField>

Se o nome da skill contiver hifens, coloque a chave entre aspas (JSON5 permite
chaves entre aspas). Por padrão, as chaves de configuração correspondem ao **nome da skill** — se uma skill
definir `metadata.openclaw.skillKey`, use essa chave em `skills.entries`.

<Note>
Para geração/edição de imagens padrão dentro do OpenClaw, use a ferramenta principal
`image_generate` com `agents.defaults.imageGenerationModel` em vez
de uma skill incluída no pacote. Os exemplos de skill aqui são para fluxos de trabalho
personalizados ou de terceiros. Para análise nativa de imagens, use a ferramenta `image` com
`agents.defaults.imageModel`. Se você escolher `openai/*`, `google/*`,
`fal/*` ou outro modelo de imagem específico de provedor, adicione também a chave de
autenticação/API desse provedor.
</Note>

## Injeção de ambiente

Quando a execução de um agente começa, o OpenClaw:

1. Lê os metadados da skill.
2. Aplica `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` a `process.env`.
3. Monta o prompt do sistema com skills **elegíveis**.
4. Restaura o ambiente original depois que a execução termina.

A injeção de ambiente é **escopada à execução do agente**, não a um ambiente
global de shell.

Para o backend `claude-cli` incluído no pacote, o OpenClaw também materializa o mesmo
snapshot elegível como um Plugin temporário do Claude Code e o passa com
`--plugin-dir`. O Claude Code pode então usar seu resolvedor nativo de skill enquanto
o OpenClaw ainda controla precedência, listas de permissões por agente, gating e
injeção de chave env/API de `skills.entries.*`. Outros backends de CLI usam apenas o
catálogo de prompts.

## Snapshots e atualização

O OpenClaw cria snapshots das Skills elegíveis **quando uma sessão começa** e
reutiliza essa lista para turnos subsequentes na mesma sessão. Alterações em
skills ou configuração entram em vigor na próxima nova sessão.

Skills podem ser atualizadas no meio da sessão em dois casos:

- O observador de skills está habilitado.
- Um novo nó remoto elegível aparece.

Pense nisso como um **hot reload**: a lista atualizada é usada no
próximo turno do agente. Se a lista de permissões efetiva de skills do agente mudar para essa
sessão, o OpenClaw atualiza o snapshot para que as skills visíveis continuem alinhadas
com o agente atual.

### Observador de Skills

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

### Nós macOS remotos (Gateway Linux)

Se o Gateway roda no Linux, mas um **nó macOS** está conectado com
`system.run` permitido (segurança de aprovações Exec não definida como `deny`),
o OpenClaw pode tratar skills exclusivas de macOS como elegíveis quando os binários
necessários estão presentes nesse nó. O agente deve executar essas skills
por meio da ferramenta `exec` com `host=node`.

Isso depende de o nó relatar seu suporte a comandos e de uma sondagem de binário
via `system.which` ou `system.run`. Nós offline **não** tornam
skills apenas remotas visíveis. Se um nó conectado parar de responder a sondagens de
binários, o OpenClaw limpa suas correspondências de binários em cache para que agentes não vejam mais
skills que não podem ser executadas ali no momento.

## Impacto em tokens

Quando skills são elegíveis, o OpenClaw injeta uma lista XML compacta de skills
disponíveis no prompt do sistema (via `formatSkillsForPrompt` em
`pi-coding-agent`). O custo é determinístico:

- **Sobrecarga base** (apenas quando há ≥1 skill): 195 caracteres.
- **Por skill:** 97 caracteres + o comprimento dos valores `<name>`, `<description>` e `<location>` com escape XML.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

O escape XML expande `& < > " '` para entidades (`&amp;`, `&lt;`, etc.),
aumentando o comprimento. A contagem de tokens varia conforme o tokenizer do modelo. Uma estimativa
aproximada no estilo OpenAI é ~4 caracteres/token, então **97 caracteres ≈ 24 tokens** por
skill, além dos comprimentos reais dos seus campos.

## Ciclo de vida de Skills gerenciadas

O OpenClaw distribui um conjunto base de skills como **skills incluídas no pacote** com a
instalação (pacote npm ou OpenClaw.app). `~/.openclaw/skills` existe para
substituições locais — por exemplo, fixar ou corrigir uma skill sem
alterar a cópia incluída no pacote. Skills de workspace pertencem ao usuário e sobrescrevem
ambas em conflitos de nome.

## Procurando mais Skills?

Navegue em [https://clawhub.ai](https://clawhub.ai). Esquema completo de configuração:
[Configuração de Skills](/pt-BR/tools/skills-config).

## Relacionados

- [ClawHub](/pt-BR/tools/clawhub) — registro público de skills
- [Criando skills](/pt-BR/tools/creating-skills) — criação de skills personalizadas
- [Plugins](/pt-BR/tools/plugin) — visão geral do sistema de plugins
- [Plugin Skill Workshop](/pt-BR/plugins/skill-workshop) — gere skills a partir do trabalho do agente
- [Configuração de Skills](/pt-BR/tools/skills-config) — referência de configuração de skills
- [Comandos de barra](/pt-BR/tools/slash-commands) — todos os comandos de barra disponíveis
