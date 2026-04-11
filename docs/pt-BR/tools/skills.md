---
read_when:
    - Adicionando ou modificando Skills
    - Alterando regras de gate ou carregamento de Skills
summary: 'Skills: gerenciadas vs do workspace, regras de gate e configuração/conexão de env'
title: Skills
x-i18n:
    generated_at: "2026-04-11T02:47:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1eaf130966950b6eb24f859d9a77ecbf81c6cb80deaaa6a3a79d2c16d83115d
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

O OpenClaw usa pastas de skill compatíveis com **[AgentSkills](https://agentskills.io)** para ensinar o agente a usar ferramentas. Cada skill é um diretório contendo um `SKILL.md` com frontmatter YAML e instruções. O OpenClaw carrega **Skills integradas** mais overrides locais opcionais, e as filtra no momento do carregamento com base em ambiente, configuração e presença de binários.

## Localizações e precedência

O OpenClaw carrega Skills destas fontes:

1. **Pastas extras de skill**: configuradas com `skills.load.extraDirs`
2. **Skills integradas**: distribuídas com a instalação (pacote npm ou OpenClaw.app)
3. **Skills gerenciadas/locais**: `~/.openclaw/skills`
4. **Skills pessoais do agente**: `~/.agents/skills`
5. **Skills do agente do projeto**: `<workspace>/.agents/skills`
6. **Skills do workspace**: `<workspace>/skills`

Se houver conflito de nome de skill, a precedência é:

`<workspace>/skills` (mais alta) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills integradas → `skills.load.extraDirs` (mais baixa)

## Skills por agente vs compartilhadas

Em configurações **multiagente**, cada agente tem seu próprio workspace. Isso significa:

- **Skills por agente** ficam em `<workspace>/skills` apenas para aquele agente.
- **Skills do agente do projeto** ficam em `<workspace>/.agents/skills` e se aplicam àquele
  workspace antes da pasta normal `skills/` do workspace.
- **Skills pessoais do agente** ficam em `~/.agents/skills` e se aplicam a todos os
  workspaces naquela máquina.
- **Skills compartilhadas** ficam em `~/.openclaw/skills` (gerenciadas/locais) e são visíveis
  para **todos os agentes** na mesma máquina.
- **Pastas compartilhadas** também podem ser adicionadas por `skills.load.extraDirs` (precedência
  mais baixa) se você quiser um pacote comum de Skills usado por vários agentes.

Se o mesmo nome de skill existir em mais de um lugar, aplica-se a precedência
normal: workspace vence, depois Skills do agente do projeto, depois Skills pessoais do agente,
depois gerenciadas/locais, depois integradas, depois diretórios extras.

## Allowlists de Skills por agente

A **localização** da skill e a **visibilidade** da skill são controles separados.

- Localização/precedência decide qual cópia de uma skill com o mesmo nome vence.
- Allowlists por agente decidem quais Skills visíveis um agente pode realmente usar.

Use `agents.defaults.skills` para uma base compartilhada e, depois, sobrescreva por agente com
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
      { id: "locked-down", skills: [] }, // sem Skills
    ],
  },
}
```

Regras:

- Omita `agents.defaults.skills` para Skills irrestritas por padrão.
- Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
- Defina `agents.list[].skills: []` para não ter Skills.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final daquele agente; ela
  não é mesclada com os padrões.

O OpenClaw aplica o conjunto efetivo de Skills do agente em todo o processo de construção de prompt,
descoberta de slash commands de Skill, sincronização de sandbox e snapshots de Skill.

## Plugins + Skills

Plugins podem distribuir suas próprias Skills listando diretórios `skills` em
`openclaw.plugin.json` (caminhos relativos à raiz do plugin). As Skills do plugin são carregadas
quando o plugin está ativado. Hoje esses diretórios são mesclados no mesmo caminho
de baixa precedência que `skills.load.extraDirs`, então uma skill de mesmo nome integrada,
gerenciada, do agente ou do workspace a substitui.
Você pode aplicar gate nelas via `metadata.openclaw.requires.config` na entrada de config
do plugin. Veja [Plugins](/pt-BR/tools/plugin) para descoberta/configuração e [Ferramentas](/pt-BR/tools) para a
superfície de ferramentas que essas Skills ensinam.

## ClawHub (instalação + sincronização)

ClawHub é o registro público de Skills do OpenClaw. Navegue em
[https://clawhub.ai](https://clawhub.ai). Use os comandos nativos `openclaw skills`
para descobrir/instalar/atualizar Skills, ou a CLI separada `clawhub` quando
você precisar de fluxos de publicação/sincronização.
Guia completo: [ClawHub](/pt-BR/tools/clawhub).

Fluxos comuns:

- Instalar uma skill no seu workspace:
  - `openclaw skills install <skill-slug>`
- Atualizar todas as Skills instaladas:
  - `openclaw skills update --all`
- Sincronizar (varrer + publicar atualizações):
  - `clawhub sync --all`

O `openclaw skills install` nativo instala no diretório `skills/` do workspace ativo. A CLI separada
`clawhub` também instala em `./skills` sob o diretório de trabalho atual
(ou recorre ao workspace configurado do OpenClaw).
O OpenClaw identifica isso como `<workspace>/skills` na próxima sessão.

## Notas de segurança

- Trate Skills de terceiros como **código não confiável**. Leia antes de ativar.
- Prefira execuções em sandbox para entradas não confiáveis e ferramentas arriscadas. Veja [Sandboxing](/pt-BR/gateway/sandboxing).
- A descoberta de Skills do workspace e de diretórios extras aceita apenas raízes de skill e arquivos `SKILL.md` cujo realpath resolvido permaneça dentro da raiz configurada.
- Instalações de dependências de Skills via gateway (`skills.install`, onboarding e a UI de configurações de Skills) executam o scanner interno de código perigoso antes de executar metadados de instalação. Achados `critical` bloqueiam por padrão, a menos que o chamador defina explicitamente o override de perigoso; achados suspeitos ainda geram apenas aviso.
- `openclaw skills install <slug>` é diferente: ele baixa uma pasta de skill do ClawHub para o workspace e não usa o caminho de metadados de instalação acima.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no processo **host**
  para aquele turno do agente (não no sandbox). Mantenha segredos fora de prompts e logs.
- Para um modelo de ameaça mais amplo e checklists, veja [Segurança](/pt-BR/gateway/security).

## Formato (AgentSkills + compatível com Pi)

`SKILL.md` deve incluir no mínimo:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Notas:

- Seguimos a especificação AgentSkills para layout/intenção.
- O parser usado pelo agente embutido aceita chaves de frontmatter **em uma única linha** apenas.
- `metadata` deve ser um **objeto JSON em uma única linha**.
- Use `{baseDir}` nas instruções para referenciar o caminho da pasta da skill.
- Chaves opcionais de frontmatter:
  - `homepage` — URL exibida como “Website” na UI de Skills do macOS (também suportada via `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (padrão: `true`). Quando `true`, a skill é exposta como um slash command do usuário.
  - `disable-model-invocation` — `true|false` (padrão: `false`). Quando `true`, a skill é excluída do prompt do modelo (ainda disponível por invocação do usuário).
  - `command-dispatch` — `tool` (opcional). Quando definido como `tool`, o slash command ignora o modelo e é despachado diretamente para uma ferramenta.
  - `command-tool` — nome da ferramenta a invocar quando `command-dispatch: tool` estiver definido.
  - `command-arg-mode` — `raw` (padrão). Para dispatch de ferramenta, encaminha a string bruta de args para a ferramenta (sem parsing pelo core).

    A ferramenta é invocada com os parâmetros:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (filtros no momento do carregamento)

O OpenClaw **filtra Skills no momento do carregamento** usando `metadata` (JSON em uma única linha):

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

- `always: true` — sempre inclui a skill (ignora os demais gates).
- `emoji` — emoji opcional usado pela UI de Skills do macOS.
- `homepage` — URL opcional mostrada como “Website” na UI de Skills do macOS.
- `os` — lista opcional de plataformas (`darwin`, `linux`, `win32`). Se definida, a skill só é elegível nesses sistemas operacionais.
- `requires.bins` — lista; cada item deve existir no `PATH`.
- `requires.anyBins` — lista; pelo menos um item deve existir no `PATH`.
- `requires.env` — lista; a variável de ambiente deve existir **ou** ser fornecida na configuração.
- `requires.config` — lista de caminhos de `openclaw.json` que devem ser truthy.
- `primaryEnv` — nome da variável de ambiente associada a `skills.entries.<name>.apiKey`.
- `install` — array opcional de especificações de instalador usadas pela UI de Skills do macOS (brew/node/go/uv/download).

Observação sobre sandboxing:

- `requires.bins` é verificado no **host** no momento do carregamento da skill.
- Se um agente estiver em sandbox, o binário também deve existir **dentro do contêiner**.
  Instale-o por meio de `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem personalizada).
  `setupCommand` é executado uma vez depois que o contêiner é criado.
  Instalações de pacote também exigem saída de rede, um sistema de arquivos raiz gravável e um usuário root no sandbox.
  Exemplo: a skill `summarize` (`skills/summarize/SKILL.md`) precisa da CLI `summarize`
  no contêiner do sandbox para ser executada ali.

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

Notas:

- Se vários instaladores estiverem listados, o gateway escolhe uma única opção preferida (**brew** quando disponível, caso contrário **node**).
- Se todos os instaladores forem `download`, o OpenClaw lista cada entrada para que você possa ver os artefatos disponíveis.
- Especificações de instalador podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por plataforma.
- Instalações por node respeitam `skills.install.nodeManager` em `openclaw.json` (padrão: npm; opções: npm/pnpm/yarn/bun).
  Isso afeta apenas as **instalações de Skill**; o runtime do Gateway ainda deve ser Node
  (Bun não é recomendado para WhatsApp/Telegram).
- A seleção de instalador via gateway é orientada por preferência, não apenas por node:
  quando as especificações de instalação misturam tipos, o OpenClaw prefere Homebrew quando
  `skills.install.preferBrew` está ativado e `brew` existe, depois `uv`, depois o
  gerenciador node configurado e, então, outros fallbacks como `go` ou `download`.
- Se todas as especificações de instalação forem `download`, o OpenClaw expõe todas as opções de download
  em vez de reduzi-las a um único instalador preferido.
- Instalações Go: se `go` estiver ausente e `brew` estiver disponível, o gateway instala Go via Homebrew primeiro e define `GOBIN` para o `bin` do Homebrew quando possível.
- Instalações por download: `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: automático quando um arquivo compactado é detectado), `stripComponents`, `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).

Se não houver `metadata.openclaw`, a skill é sempre elegível (a menos que
esteja desativada na configuração ou bloqueada por `skills.allowBundled` para Skills integradas).

## Overrides de configuração (`~/.openclaw/openclaw.json`)

Skills integradas/gerenciadas podem ser ativadas/desativadas e receber valores de env:

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

Observação: se o nome da skill contiver hífens, coloque a chave entre aspas (o JSON5 permite chaves entre aspas).

Se você quiser geração/edição de imagens padrão dentro do próprio OpenClaw, use a
ferramenta central `image_generate` com `agents.defaults.imageGenerationModel` em vez de uma
skill integrada. Os exemplos de Skill aqui são para fluxos personalizados ou de terceiros.

Para análise de imagens nativa, use a ferramenta `image` com `agents.defaults.imageModel`.
Para geração/edição nativa de imagens, use `image_generate` com
`agents.defaults.imageGenerationModel`. Se você escolher `openai/*`, `google/*`,
`fal/*` ou outro modelo de imagem específico de provedor, adicione também a autenticação/chave de API desse provedor.

As chaves de configuração correspondem ao **nome da skill** por padrão. Se uma skill definir
`metadata.openclaw.skillKey`, use essa chave em `skills.entries`.

Regras:

- `enabled: false` desativa a skill mesmo que ela esteja integrada/instalada.
- `env`: injetado **apenas se** a variável ainda não estiver definida no processo.
- `apiKey`: conveniência para Skills que declaram `metadata.openclaw.primaryEnv`.
  Suporta string em texto puro ou objeto SecretRef (`{ source, provider, id }`).
- `config`: bag opcional para campos personalizados por skill; chaves personalizadas devem ficar aqui.
- `allowBundled`: allowlist opcional apenas para Skills **integradas**. Se definida, apenas
  Skills integradas na lista serão elegíveis (Skills gerenciadas/do workspace não são afetadas).

## Injeção de ambiente (por execução de agente)

Quando uma execução de agente começa, o OpenClaw:

1. Lê os metadados da skill.
2. Aplica qualquer `skills.entries.<key>.env` ou `skills.entries.<key>.apiKey` a
   `process.env`.
3. Constrói o prompt do sistema com Skills **elegíveis**.
4. Restaura o ambiente original após o fim da execução.

Isso tem **escopo da execução do agente**, não de um ambiente global de shell.

Para o backend integrado `claude-cli`, o OpenClaw também materializa o mesmo
snapshot elegível como um plugin temporário do Claude Code e o passa com
`--plugin-dir`. O Claude Code pode então usar seu resolvedor nativo de Skills, enquanto
o OpenClaw continua sendo responsável por precedência, allowlists por agente, gating e
injeção de env/chave de API em `skills.entries.*`. Outros backends de CLI usam apenas o catálogo do prompt.

## Snapshot de sessão (desempenho)

O OpenClaw cria um snapshot das Skills elegíveis **quando uma sessão começa** e reutiliza essa lista nos turnos seguintes da mesma sessão. Alterações em Skills ou na configuração entram em vigor na próxima sessão nova.

As Skills também podem ser atualizadas no meio da sessão quando o watcher de Skills está ativado ou quando um novo nó remoto elegível aparece (veja abaixo). Pense nisso como um **hot reload**: a lista atualizada é capturada no próximo turno do agente.

Se a allowlist efetiva de Skills do agente mudar para aquela sessão, o OpenClaw
atualiza o snapshot para que as Skills visíveis permaneçam alinhadas com o agente
atual.

## Nós remotos macOS (gateway Linux)

Se o Gateway estiver em execução no Linux, mas um **nó macOS** estiver conectado **com `system.run` permitido** (segurança de aprovações de Exec diferente de `deny`), o OpenClaw pode tratar Skills exclusivas de macOS como elegíveis quando os binários necessários estiverem presentes naquele nó. O agente deve executar essas Skills por meio da ferramenta `exec` com `host=node`.

Isso depende de o nó reportar seu suporte a comandos e de um probe de binário via `system.run`. Se o nó macOS ficar offline depois, as Skills permanecem visíveis; as invocações podem falhar até que o nó se reconecte.

## Watcher de Skills (autoatualização)

Por padrão, o OpenClaw monitora pastas de skill e incrementa o snapshot de Skills quando arquivos `SKILL.md` mudam. Configure isso em `skills.load`:

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

Quando há Skills elegíveis, o OpenClaw injeta uma lista XML compacta de Skills disponíveis no prompt do sistema (via `formatSkillsForPrompt` em `pi-coding-agent`). O custo é determinístico:

- **Overhead base (somente quando ≥1 skill):** 195 caracteres.
- **Por skill:** 97 caracteres + o tamanho dos valores XML-escaped de `<name>`, `<description>` e `<location>`.

Fórmula (caracteres):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Notas:

- O escaping XML expande `& < > " '` em entidades (`&amp;`, `&lt;` etc.), aumentando o tamanho.
- A contagem de tokens varia conforme o tokenizer do modelo. Uma estimativa aproximada no estilo OpenAI é ~4 caracteres/token, então **97 caracteres ≈ 24 tokens** por skill, além do tamanho real dos seus campos.

## Ciclo de vida de Skills gerenciadas

O OpenClaw distribui um conjunto base de Skills como **Skills integradas** como parte da
instalação (pacote npm ou OpenClaw.app). `~/.openclaw/skills` existe para
overrides locais (por exemplo, fixar/aplicar patch em uma skill sem alterar a cópia
integrada). Skills do workspace pertencem ao usuário e substituem ambas em conflitos de nome.

## Referência de configuração

Veja [Configuração de Skills](/pt-BR/tools/skills-config) para o esquema completo de configuração.

## Procurando mais Skills?

Navegue em [https://clawhub.ai](https://clawhub.ai).

---

## Relacionado

- [Criando Skills](/pt-BR/tools/creating-skills) — criando Skills personalizadas
- [Configuração de Skills](/pt-BR/tools/skills-config) — referência de configuração de Skills
- [Slash Commands](/pt-BR/tools/slash-commands) — todos os slash commands disponíveis
- [Plugins](/pt-BR/tools/plugin) — visão geral do sistema de plugins
