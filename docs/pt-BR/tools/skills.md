---
read_when:
    - Adicionando ou modificando Skills
    - Alterando regras de bloqueio ou carregamento de Skills
summary: 'Skills: gerenciadas vs workspace, regras de bloqueio e wiring de config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-22T04:27:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2ff6a3a92bc3c1c3892620a00e2eb01c73364bc6388a3513943defa46e49749
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

O OpenClaw usa pastas de skill compatíveis com **[AgentSkills](https://agentskills.io)** para ensinar o agente a usar ferramentas. Cada skill é um diretório contendo um `SKILL.md` com frontmatter YAML e instruções. O OpenClaw carrega **Skills empacotadas** mais sobrescritas locais opcionais, e as filtra no momento do carregamento com base em ambiente, configuração e presença de binários.

## Localizações e precedência

O OpenClaw carrega Skills destas fontes:

1. **Pastas extras de skill**: configuradas com `skills.load.extraDirs`
2. **Skills empacotadas**: enviadas com a instalação (pacote npm ou OpenClaw.app)
3. **Skills gerenciadas/locais**: `~/.openclaw/skills`
4. **Skills pessoais do agente**: `~/.agents/skills`
5. **Skills de agente do projeto**: `<workspace>/.agents/skills`
6. **Skills do workspace**: `<workspace>/skills`

Se houver conflito de nome de skill, a precedência é:

`<workspace>/skills` (mais alta) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills empacotadas → `skills.load.extraDirs` (mais baixa)

## Skills por agente vs compartilhadas

Em configurações **multiagente**, cada agente tem seu próprio workspace. Isso significa:

- **Skills por agente** ficam em `<workspace>/skills` apenas para aquele agente.
- **Skills de agente do projeto** ficam em `<workspace>/.agents/skills` e se aplicam a
  esse workspace antes da pasta normal `skills/` do workspace.
- **Skills pessoais do agente** ficam em `~/.agents/skills` e se aplicam entre
  workspaces nessa máquina.
- **Skills compartilhadas** ficam em `~/.openclaw/skills` (gerenciadas/locais) e são visíveis
  para **todos os agentes** na mesma máquina.
- **Pastas compartilhadas** também podem ser adicionadas via `skills.load.extraDirs` (precedência mais baixa) se você quiser um pacote comum de Skills usado por múltiplos agentes.

Se o mesmo nome de skill existir em mais de um lugar, a precedência usual
se aplica: workspace vence, depois Skills de agente do projeto, depois Skills pessoais do agente,
depois gerenciadas/locais, depois empacotadas, depois diretórios extras.

## Allowlists de Skill por agente

**Localização** de skill e **visibilidade** de skill são controles separados.

- Localização/precedência decide qual cópia de uma skill com o mesmo nome vence.
- Allowlists de agente decidem quais Skills visíveis um agente pode realmente usar.

Use `agents.defaults.skills` para uma baseline compartilhada e sobrescreva por agente com
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // herda github, weather
      { id: "docs", skills: ["docs-search"] }, // substitui os padrões
      { id: "locked-down", skills: [] }, // nenhuma skill
    ],
  },
}
```

Regras:

- Omita `agents.defaults.skills` para Skills irrestritas por padrão.
- Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
- Defina `agents.list[].skills: []` para nenhuma Skill.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final para aquele agente; ela
  não é mesclada com os padrões.

O OpenClaw aplica o conjunto efetivo de Skills do agente na construção do prompt,
na descoberta de comandos slash de Skill, na sincronização do sandbox e nos snapshots de Skill.

## Plugins + Skills

Plugins podem enviar suas próprias Skills listando diretórios `skills` em
`openclaw.plugin.json` (caminhos relativos à raiz do Plugin). Skills de Plugin são carregadas
quando o Plugin está ativado. Hoje esses diretórios são mesclados no mesmo caminho de
baixa precedência que `skills.load.extraDirs`, então uma Skill empacotada, gerenciada,
de agente ou de workspace com o mesmo nome os sobrescreve.
Você pode bloqueá-las por `metadata.openclaw.requires.config` na entrada de
config do Plugin. Consulte [Plugins](/pt-BR/tools/plugin) para descoberta/config e [Ferramentas](/pt-BR/tools) para a
superfície de ferramentas que essas Skills ensinam.

## Skill Workshop

O Plugin opcional e experimental Skill Workshop pode criar ou atualizar Skills
do workspace a partir de procedimentos reutilizáveis observados durante o trabalho do agente. Ele fica desativado por
padrão e precisa ser explicitamente ativado por
`plugins.entries.skill-workshop`.

O Skill Workshop grava apenas em `<workspace>/skills`, verifica conteúdo gerado,
oferece suporte a aprovação pendente ou gravações automáticas seguras, coloca em quarentena
propostas inseguras e atualiza o snapshot de Skill após gravações bem-sucedidas para que novas
Skills possam ficar disponíveis sem reinicializar o Gateway.

Use-o quando quiser que correções como “da próxima vez, verifique atribuição de GIF” ou
workflows difíceis de conquistar como checklists de QA de mídia se tornem instruções procedimentais duráveis.
Comece com aprovação pendente; use gravações automáticas apenas em workspaces confiáveis
após revisar suas propostas. Guia completo:
[Plugin Skill Workshop](/pt-BR/plugins/skill-workshop).

## ClawHub (instalação + sincronização)

ClawHub é o registro público de Skills do OpenClaw. Navegue em
[https://clawhub.ai](https://clawhub.ai). Use comandos nativos `openclaw skills`
para descobrir/instalar/atualizar Skills, ou a CLI separada `clawhub` quando
precisar de fluxos de publicação/sincronização.
Guia completo: [ClawHub](/pt-BR/tools/clawhub).

Fluxos comuns:

- Instalar uma Skill no seu workspace:
  - `openclaw skills install <skill-slug>`
- Atualizar todas as Skills instaladas:
  - `openclaw skills update --all`
- Sincronizar (scan + publicar atualizações):
  - `clawhub sync --all`

`openclaw skills install` nativo instala no diretório `skills/` do workspace ativo. A CLI separada
`clawhub` também instala em `./skills` sob seu diretório de trabalho atual
(ou usa como fallback o workspace OpenClaw configurado).
O OpenClaw reconhece isso como `<workspace>/skills` na próxima sessão.

## Observações de segurança

- Trate Skills de terceiros como **código não confiável**. Leia-as antes de ativar.
- Prefira execuções em sandbox para entradas não confiáveis e ferramentas arriscadas. Consulte [Sandboxing](/pt-BR/gateway/sandboxing).
- A descoberta de Skills do workspace e de diretórios extras aceita apenas raízes de skill e arquivos `SKILL.md` cujo realpath resolvido permaneça dentro da raiz configurada.
- Instalações de dependência de Skill com suporte do Gateway (`skills.install`, onboarding e a UI de configurações de Skills) executam o scanner integrado de código perigoso antes de executar metadados do instalador. Achados `critical` bloqueiam por padrão, a menos que o chamador defina explicitamente a sobrescrita perigosa; achados suspeitos ainda apenas emitem aviso.
- `openclaw skills install <slug>` é diferente: ele baixa uma pasta de Skill do ClawHub para o workspace e não usa o caminho de metadados de instalador acima.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam secrets no processo **host**
  para aquele turno do agente (não no sandbox). Mantenha secrets fora de prompts e logs.
- Para um modelo de ameaça mais amplo e checklists, consulte [Segurança](/pt-BR/gateway/security).

## Formato (AgentSkills + compatível com Pi)

`SKILL.md` deve incluir pelo menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Observações:

- Seguimos a especificação AgentSkills para layout/intenção.
- O parser usado pelo agente embutido oferece suporte apenas a chaves de frontmatter **de linha única**.
- `metadata` deve ser um **objeto JSON em linha única**.
- Use `{baseDir}` nas instruções para referenciar o caminho da pasta da skill.
- Chaves opcionais de frontmatter:
  - `homepage` — URL exibida como “Website” na UI de Skills do macOS (também suportada por `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (padrão: `true`). Quando `true`, a skill é exposta como um comando slash do usuário.
  - `disable-model-invocation` — `true|false` (padrão: `false`). Quando `true`, a skill é excluída do prompt do modelo (ainda disponível por invocação do usuário).
  - `command-dispatch` — `tool` (opcional). Quando definido como `tool`, o comando slash ignora o modelo e despacha diretamente para uma ferramenta.
  - `command-tool` — nome da ferramenta a invocar quando `command-dispatch: tool` estiver definido.
  - `command-arg-mode` — `raw` (padrão). Para despacho de ferramenta, encaminha a string bruta de args para a ferramenta (sem parsing no core).

    A ferramenta é invocada com params:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Bloqueio (filtros no carregamento)

O OpenClaw **filtra Skills no momento do carregamento** usando `metadata` (JSON em linha única):

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

Campos sob `metadata.openclaw`:

- `always: true` — sempre inclui a skill (ignora outros bloqueios).
- `emoji` — emoji opcional usado pela UI de Skills do macOS.
- `homepage` — URL opcional mostrada como “Website” na UI de Skills do macOS.
- `os` — lista opcional de plataformas (`darwin`, `linux`, `win32`). Se definida, a skill só é elegível nesses OSes.
- `requires.bins` — lista; cada item deve existir em `PATH`.
- `requires.anyBins` — lista; pelo menos um deve existir em `PATH`.
- `requires.env` — lista; a variável de ambiente deve existir **ou** ser fornecida na configuração.
- `requires.config` — lista de caminhos de `openclaw.json` que devem ser truthy.
- `primaryEnv` — nome da variável de ambiente associada a `skills.entries.<name>.apiKey`.
- `install` — array opcional de especificações de instalador usado pela UI de Skills do macOS (brew/node/go/uv/download).

Observação sobre sandboxing:

- `requires.bins` é verificado no **host** no momento do carregamento da skill.
- Se um agente estiver em sandbox, o binário também deve existir **dentro do contêiner**.
  Instale-o via `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem personalizada).
  `setupCommand` é executado uma vez após a criação do contêiner.
  Instalações de pacote também exigem saída de rede, um FS raiz gravável e usuário root no sandbox.
  Exemplo: a skill `summarize` (`skills/summarize/SKILL.md`) precisa da CLI `summarize`
  no contêiner do sandbox para rodar lá.

Exemplo de instalador:

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

Observações:

- Se vários instaladores estiverem listados, o gateway escolhe uma única opção **preferida** (brew quando disponível, caso contrário node).
- Se todos os instaladores forem `download`, o OpenClaw lista cada entrada para que você veja os artefatos disponíveis.
- Especificações de instalador podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por plataforma.
- Instalações Node respeitam `skills.install.nodeManager` em `openclaw.json` (padrão: npm; opções: npm/pnpm/yarn/bun).
  Isso afeta apenas **instalações de Skill**; o runtime do Gateway ainda deve ser Node
  (Bun não é recomendado para WhatsApp/Telegram).
- A seleção de instalador com suporte do Gateway é orientada por preferência, não apenas por node:
  quando as especificações de instalação misturam tipos, o OpenClaw prefere Homebrew quando
  `skills.install.preferBrew` está ativado e `brew` existe, depois `uv`, depois o
  node manager configurado, depois outros fallbacks como `go` ou `download`.
- Se toda especificação de instalação for `download`, o OpenClaw exibe todas as opções de download
  em vez de colapsar para um único instalador preferido.
- Instalações Go: se `go` estiver ausente e `brew` estiver disponível, o gateway instala Go por Homebrew primeiro e define `GOBIN` para o `bin` do Homebrew quando possível.
- Instalações por download: `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: automático quando um arquivo compactado é detectado), `stripComponents`, `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).

Se não houver `metadata.openclaw`, a skill será sempre elegível (a menos que
esteja desativada na configuração ou bloqueada por `skills.allowBundled` para Skills empacotadas).

## Sobrescritas de configuração (`~/.openclaw/openclaw.json`)

Skills empacotadas/gerenciadas podem ser ativadas ou desativadas e receber valores de env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string em texto puro
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

Observação: se o nome da skill contiver hífens, coloque a chave entre aspas (JSON5 permite chaves entre aspas).

Se você quiser geração/edição de imagem padrão dentro do próprio OpenClaw, use a
ferramenta core `image_generate` com `agents.defaults.imageGenerationModel` em vez de uma
skill empacotada. Os exemplos de skill aqui são para workflows personalizados ou de terceiros.

Para análise nativa de imagem, use a ferramenta `image` com `agents.defaults.imageModel`.
Para geração/edição nativa de imagem, use `image_generate` com
`agents.defaults.imageGenerationModel`. Se você escolher `openai/*`, `google/*`,
`fal/*` ou outro modelo de imagem específico de provider, adicione também a autenticação/chave de API
desse provider.

Por padrão, as chaves de configuração correspondem ao **nome da skill**. Se uma skill definir
`metadata.openclaw.skillKey`, use essa chave em `skills.entries`.

Regras:

- `enabled: false` desativa a skill mesmo se ela estiver empacotada/instalada.
- `env`: injetado **somente se** a variável ainda não estiver definida no processo.
- `apiKey`: conveniência para Skills que declaram `metadata.openclaw.primaryEnv`.
  Oferece suporte a string em texto puro ou objeto SecretRef (`{ source, provider, id }`).
- `config`: bag opcional para campos personalizados por skill; chaves personalizadas devem ficar aqui.
- `allowBundled`: allowlist opcional apenas para Skills **empacotadas**. Se definida, apenas
  Skills empacotadas na lista são elegíveis (Skills gerenciadas/workspace não são afetadas).

## Injeção de ambiente (por execução de agente)

Quando uma execução de agente começa, o OpenClaw:

1. Lê os metadados da skill.
2. Aplica qualquer `skills.entries.<key>.env` ou `skills.entries.<key>.apiKey` a
   `process.env`.
3. Constrói o prompt de sistema com as Skills **elegíveis**.
4. Restaura o ambiente original após o fim da execução.

Isso tem **escopo da execução do agente**, não de um ambiente global do shell.

Para o backend empacotado `claude-cli`, o OpenClaw também materializa o mesmo
snapshot elegível como um Plugin temporário do Claude Code e o passa com
`--plugin-dir`. O Claude Code então pode usar seu resolvedor nativo de skill enquanto
o OpenClaw continua sendo dono da precedência, das allowlists por agente, do bloqueio e da
injeção de env/chave de API em `skills.entries.*`. Outros backends CLI usam apenas o
catálogo do prompt.

## Snapshot de sessão (performance)

O OpenClaw faz snapshot das Skills elegíveis **quando uma sessão começa** e reutiliza essa lista nos turnos seguintes da mesma sessão. Mudanças em Skills ou na configuração passam a valer na próxima sessão nova.

As Skills também podem ser atualizadas no meio da sessão quando o watcher de Skills estiver ativado ou quando um novo Node remoto elegível aparecer (veja abaixo). Pense nisso como um **hot reload**: a lista atualizada é usada no próximo turno do agente.

Se a allowlist efetiva de Skills do agente mudar para essa sessão, o OpenClaw
atualiza o snapshot para que as Skills visíveis permaneçam alinhadas com o agente
atual.

## Nodes remotos de macOS (Gateway Linux)

Se o Gateway estiver rodando no Linux, mas um **Node macOS** estiver conectado **com `system.run` permitido** (segurança de aprovações de Exec não definida como `deny`), o OpenClaw pode tratar Skills exclusivas de macOS como elegíveis quando os binários necessários estiverem presentes nesse Node. O agente deve executar essas Skills via a ferramenta `exec` com `host=node`.

Isso depende de o Node informar seu suporte a comandos e de um probe de binário por `system.run`. Se o Node macOS ficar offline depois, as Skills permanecem visíveis; invocações podem falhar até que o Node se reconecte.

## Watcher de Skills (atualização automática)

Por padrão, o OpenClaw observa pastas de skill e incrementa o snapshot de Skills quando arquivos `SKILL.md` mudam. Configure isso em `skills.load`:

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

## Impacto em tokens (lista de Skills)

Quando Skills são elegíveis, o OpenClaw injeta uma lista XML compacta de Skills disponíveis no prompt de sistema (via `formatSkillsForPrompt` em `pi-coding-agent`). O custo é determinístico:

- **Overhead base (somente quando ≥1 skill):** 195 caracteres.
- **Por skill:** 97 caracteres + o comprimento dos valores com escape XML em `<name>`, `<description>` e `<location>`.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Observações:

- Escape XML expande `& < > " '` em entidades (`&amp;`, `&lt;` etc.), aumentando o comprimento.
- A contagem de tokens varia conforme o tokenizer do modelo. Uma estimativa aproximada no estilo OpenAI é ~4 caracteres/token, então **97 caracteres ≈ 24 tokens** por skill, além do comprimento real dos seus campos.

## Ciclo de vida das Skills gerenciadas

O OpenClaw envia um conjunto base de Skills como **Skills empacotadas** como parte da
instalação (pacote npm ou OpenClaw.app). `~/.openclaw/skills` existe para
sobrescritas locais (por exemplo, fixar/corrigir uma skill sem alterar a cópia
empacotada). Skills do workspace pertencem ao usuário e sobrescrevem ambas em caso de conflito de nome.

## Referência de configuração

Consulte [Configuração de Skills](/pt-BR/tools/skills-config) para o esquema completo de configuração.

## Procurando mais Skills?

Navegue em [https://clawhub.ai](https://clawhub.ai).

---

## Relacionado

- [Criando Skills](/pt-BR/tools/creating-skills) — criação de Skills personalizadas
- [Configuração de Skills](/pt-BR/tools/skills-config) — referência de configuração de Skills
- [Comandos Slash](/pt-BR/tools/slash-commands) — todos os comandos slash disponíveis
- [Plugins](/pt-BR/tools/plugin) — visão geral do sistema de Plugins
