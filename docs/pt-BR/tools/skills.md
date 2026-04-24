---
read_when:
    - Adicionando ou modificando Skills
    - Alterando a restrição ou as regras de carregamento de Skills
summary: 'Skills: gerenciadas vs workspace, regras de restrição e wiring de config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-24T06:18:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c7db23e1eb818d62283376cb33353882a9cb30e4476c5775218137da2ba82d9
    source_path: tools/skills.md
    workflow: 15
---

O OpenClaw usa pastas de skill compatíveis com **[AgentSkills](https://agentskills.io)** para ensinar o agente a usar ferramentas. Cada skill é um diretório que contém um `SKILL.md` com frontmatter YAML e instruções. O OpenClaw carrega **skills incluídas** mais substituições locais opcionais e as filtra no momento do carregamento com base em ambiente, configuração e presença de binários.

## Locais e precedência

O OpenClaw carrega skills destas fontes:

1. **Pastas extras de skills**: configuradas com `skills.load.extraDirs`
2. **Skills incluídas**: fornecidas com a instalação (pacote npm ou OpenClaw.app)
3. **Skills gerenciadas/locais**: `~/.openclaw/skills`
4. **Skills pessoais do agente**: `~/.agents/skills`
5. **Skills de agente do projeto**: `<workspace>/.agents/skills`
6. **Skills do workspace**: `<workspace>/skills`

Se houver conflito de nome de skill, a precedência é:

`<workspace>/skills` (mais alta) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → skills incluídas → `skills.load.extraDirs` (mais baixa)

## Skills por agente vs compartilhadas

Em configurações com **vários agentes**, cada agente tem seu próprio workspace. Isso significa:

- **Skills por agente** ficam em `<workspace>/skills` apenas para aquele agente.
- **Skills de agente do projeto** ficam em `<workspace>/.agents/skills` e se aplicam a
  esse workspace antes da pasta normal `skills/` do workspace.
- **Skills pessoais do agente** ficam em `~/.agents/skills` e se aplicam a todos os
  workspaces nessa máquina.
- **Skills compartilhadas** ficam em `~/.openclaw/skills` (gerenciadas/locais) e são visíveis
  para **todos os agentes** na mesma máquina.
- **Pastas compartilhadas** também podem ser adicionadas via `skills.load.extraDirs` (precedência
  mais baixa) se você quiser um pacote comum de skills usado por vários agentes.

Se o mesmo nome de skill existir em mais de um lugar, aplica-se a precedência
usual: workspace vence, depois skills de agente do projeto, depois skills pessoais do agente,
depois gerenciadas/locais, depois incluídas, depois diretórios extras.

## Allowlists de Skills por agente

**Localização** de skill e **visibilidade** de skill são controles separados.

- Localização/precedência decide qual cópia de uma skill com o mesmo nome vence.
- Allowlists de agente decidem quais skills visíveis um agente pode realmente usar.

Use `agents.defaults.skills` para uma linha de base compartilhada e depois substitua por agente com
`agents.list[].skills`:

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

Regras:

- Omita `agents.defaults.skills` para skills irrestritas por padrão.
- Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
- Defina `agents.list[].skills: []` para não ter skills.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final para aquele agente; ela
  não é mesclada com os padrões.

O OpenClaw aplica o conjunto efetivo de skills do agente na construção de prompt, descoberta de comando slash de skill, sincronização de sandbox e snapshots de skill.

## Plugins + Skills

Plugins podem enviar suas próprias skills listando diretórios `skills` em
`openclaw.plugin.json` (caminhos relativos à raiz do Plugin). As skills do Plugin são carregadas
quando o Plugin está ativado. Hoje esses diretórios são mesclados ao mesmo
caminho de baixa precedência que `skills.load.extraDirs`, então uma skill incluída,
gerenciada, de agente ou de workspace com o mesmo nome as substitui.
Você pode restringi-las via `metadata.openclaw.requires.config` na entrada de configuração do Plugin.
Consulte [Plugins](/pt-BR/tools/plugin) para descoberta/configuração e [Tools](/pt-BR/tools) para a
superfície de ferramentas que essas skills ensinam.

## Skill Workshop

O Plugin opcional e experimental Skill Workshop pode criar ou atualizar skills de workspace
a partir de procedimentos reutilizáveis observados durante o trabalho do agente. Ele vem desativado
por padrão e precisa ser ativado explicitamente em
`plugins.entries.skill-workshop`.

O Skill Workshop grava apenas em `<workspace>/skills`, analisa o conteúdo gerado,
oferece suporte a aprovação pendente ou gravações automáticas seguras, coloca propostas inseguras em quarentena
e atualiza o snapshot de skill após gravações bem-sucedidas para que novas
skills possam ficar disponíveis sem reiniciar o Gateway.

Use-o quando você quiser que correções como “da próxima vez, verifique atribuição de GIF” ou
fluxos de trabalho difíceis de conquistar, como checklists de QA de mídia, se tornem instruções procedurais duráveis. Comece com aprovação pendente; use gravações automáticas apenas em workspaces confiáveis depois de revisar as propostas. Guia completo:
[Plugin Skill Workshop](/pt-BR/plugins/skill-workshop).

## ClawHub (instalação + sincronização)

ClawHub é o registro público de skills do OpenClaw. Navegue em
[https://clawhub.ai](https://clawhub.ai). Use comandos nativos `openclaw skills`
para descobrir/instalar/atualizar skills, ou a CLI separada `clawhub` quando
precisar de fluxos de publicação/sincronização.
Guia completo: [ClawHub](/pt-BR/tools/clawhub).

Fluxos comuns:

- Instalar uma skill no seu workspace:
  - `openclaw skills install <skill-slug>`
- Atualizar todas as skills instaladas:
  - `openclaw skills update --all`
- Sincronizar (scan + publicar atualizações):
  - `clawhub sync --all`

`openclaw skills install` nativo instala no diretório `skills/` do workspace ativo. A CLI separada `clawhub` também instala em `./skills` sob o diretório de trabalho atual
(ou recorre ao workspace OpenClaw configurado).
O OpenClaw reconhece isso como `<workspace>/skills` na próxima sessão.

## Observações de segurança

- Trate skills de terceiros como **código não confiável**. Leia-as antes de ativar.
- Prefira execuções em sandbox para entradas não confiáveis e ferramentas arriscadas. Consulte [Sandboxing](/pt-BR/gateway/sandboxing).
- A descoberta de skills de workspace e de diretórios extras só aceita raízes de skill e arquivos `SKILL.md` cujo realpath resolvido permaneça dentro da raiz configurada.
- Instalações de dependência de skill apoiadas pelo Gateway (`skills.install`, onboarding e a UI de configurações de Skills) executam o scanner integrado de código perigoso antes de executar metadados de instalador. Achados `critical` bloqueiam por padrão, a menos que o chamador defina explicitamente a substituição perigosa; achados suspeitos ainda apenas geram aviso.
- `openclaw skills install <slug>` é diferente: ele baixa uma pasta de skill do ClawHub para o workspace e não usa o caminho de metadados de instalador acima.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no processo do **host**
  para aquele turno do agente (não na sandbox). Mantenha segredos fora de prompts e logs.
- Para um modelo de ameaça mais amplo e checklists, consulte [Security](/pt-BR/gateway/security).

## Formato (compatível com AgentSkills + Pi)

`SKILL.md` precisa incluir ao menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Observações:

- Seguimos a especificação AgentSkills para layout/intenção.
- O parser usado pelo agente embutido oferece suporte apenas a chaves de frontmatter de **linha única**.
- `metadata` deve ser um **objeto JSON de linha única**.
- Use `{baseDir}` nas instruções para referenciar o caminho da pasta da skill.
- Chaves opcionais de frontmatter:
  - `homepage` — URL exibida como “Website” na UI de Skills do macOS (também compatível via `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (padrão: `true`). Quando `true`, a skill é exposta como um comando slash do usuário.
  - `disable-model-invocation` — `true|false` (padrão: `false`). Quando `true`, a skill é excluída do prompt do modelo (ainda disponível via invocação do usuário).
  - `command-dispatch` — `tool` (opcional). Quando definido como `tool`, o comando slash ignora o modelo e despacha diretamente para uma ferramenta.
  - `command-tool` — nome da ferramenta a invocar quando `command-dispatch: tool` estiver definido.
  - `command-arg-mode` — `raw` (padrão). Para despacho de ferramenta, encaminha a string bruta de args para a ferramenta (sem parsing central).

    A ferramenta é invocada com params:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Restrição (filtros em tempo de carregamento)

O OpenClaw **filtra skills no momento do carregamento** usando `metadata` (JSON de linha única):

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

- `always: true` — sempre inclui a skill (ignora outras restrições).
- `emoji` — emoji opcional usado pela UI de Skills do macOS.
- `homepage` — URL opcional mostrada como “Website” na UI de Skills do macOS.
- `os` — lista opcional de plataformas (`darwin`, `linux`, `win32`). Se definida, a skill só é elegível nesses SOs.
- `requires.bins` — lista; cada item deve existir em `PATH`.
- `requires.anyBins` — lista; ao menos um item deve existir em `PATH`.
- `requires.env` — lista; a variável de ambiente deve existir **ou** ser fornecida na configuração.
- `requires.config` — lista de caminhos de `openclaw.json` que precisam ser truthy.
- `primaryEnv` — nome da variável de ambiente associada a `skills.entries.<name>.apiKey`.
- `install` — array opcional de especificações de instalador usado pela UI de Skills do macOS (brew/node/go/uv/download).

Observação sobre sandboxing:

- `requires.bins` é verificado no **host** no momento do carregamento da skill.
- Se um agente estiver em sandbox, o binário também precisa existir **dentro do container**.
  Instale-o via `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem personalizada).
  `setupCommand` executa uma vez após a criação do container.
  Instalações de pacote também exigem saída de rede, um sistema de arquivos raiz gravável e um usuário root na sandbox.
  Exemplo: a skill `summarize` (`skills/summarize/SKILL.md`) precisa da CLI `summarize`
  no container da sandbox para ser executada ali.

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

- Se vários instaladores estiverem listados, o gateway escolhe uma **única** opção preferida (brew quando disponível, caso contrário node).
- Se todos os instaladores forem `download`, o OpenClaw lista cada entrada para que você veja os artefatos disponíveis.
- Especificações de instalador podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por plataforma.
- Instalações de Node respeitam `skills.install.nodeManager` em `openclaw.json` (padrão: npm; opções: npm/pnpm/yarn/bun).
  Isso afeta apenas **instalações de skill**; o runtime do Gateway ainda deve ser Node
  (Bun não é recomendado para WhatsApp/Telegram).
- A seleção de instalador apoiada pelo Gateway é guiada por preferência, não apenas por node:
  quando as especificações de instalação misturam tipos, o OpenClaw prefere Homebrew quando
  `skills.install.preferBrew` está ativado e `brew` existe, depois `uv`, depois o
  gerenciador de node configurado e, depois, outros fallbacks como `go` ou `download`.
- Se toda especificação de instalação for `download`, o OpenClaw expõe todas as opções de download
  em vez de colapsar para um único instalador preferido.
- Instalações Go: se `go` estiver ausente e `brew` estiver disponível, o gateway instala Go via Homebrew primeiro e define `GOBIN` como o `bin` do Homebrew quando possível.
- Instalações por download: `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: automático quando um arquivo compactado é detectado), `stripComponents`, `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).

Se `metadata.openclaw` não estiver presente, a skill será sempre elegível (a menos que
esteja desativada na configuração ou bloqueada por `skills.allowBundled` para skills incluídas).

## Substituições de configuração (`~/.openclaw/openclaw.json`)

Skills incluídas/gerenciadas podem ser alternadas e receber valores de env:

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

Observação: se o nome da skill contiver hífens, coloque a chave entre aspas (JSON5 permite chaves entre aspas).

Se você quiser geração/edição de imagem padrão dentro do próprio OpenClaw, use a ferramenta central
`image_generate` com `agents.defaults.imageGenerationModel` em vez de uma
skill incluída. Os exemplos de skill aqui são para fluxos personalizados ou de terceiros.

Para análise nativa de imagem, use a ferramenta `image` com `agents.defaults.imageModel`.
Para geração/edição nativa de imagem, use `image_generate` com
`agents.defaults.imageGenerationModel`. Se você escolher `openai/*`, `google/*`,
`fal/*` ou outro modelo de imagem específico de provedor, adicione também a autenticação/chave de API
desse provedor.

As chaves de configuração correspondem ao **nome da skill** por padrão. Se uma skill definir
`metadata.openclaw.skillKey`, use essa chave em `skills.entries`.

Regras:

- `enabled: false` desativa a skill mesmo que ela esteja incluída/instalada.
- `env`: injetado **somente se** a variável ainda não estiver definida no processo.
- `apiKey`: atalho para skills que declaram `metadata.openclaw.primaryEnv`.
  Compatível com string em plaintext ou objeto SecretRef (`{ source, provider, id }`).
- `config`: bag opcional para campos personalizados por skill; chaves personalizadas devem ficar aqui.
- `allowBundled`: allowlist opcional apenas para skills **incluídas**. Se definido,
  apenas skills incluídas que estiverem na lista serão elegíveis (skills gerenciadas/workspace não são afetadas).

## Injeção de ambiente (por execução do agente)

Quando uma execução de agente começa, o OpenClaw:

1. Lê os metadados da skill.
2. Aplica qualquer `skills.entries.<key>.env` ou `skills.entries.<key>.apiKey` em
   `process.env`.
3. Constrói o prompt de sistema com as skills **elegíveis**.
4. Restaura o ambiente original depois que a execução termina.

Isso é **restrito à execução do agente**, não a um ambiente global de shell.

Para o backend incluído `claude-cli`, o OpenClaw também materializa o mesmo
snapshot elegível como um Plugin temporário do Claude Code e o passa com
`--plugin-dir`. O Claude Code pode então usar seu resolvedor nativo de skill enquanto
o OpenClaw continua controlando precedência, allowlists por agente, restrições e
injeção de env/chave de API em `skills.entries.*`. Outros backends de CLI usam apenas o catálogo do prompt.

## Snapshot de sessão (desempenho)

O OpenClaw cria um snapshot das skills elegíveis **quando uma sessão começa** e reutiliza essa lista nos turnos seguintes da mesma sessão. Alterações em skills ou configuração passam a valer na próxima sessão nova.

As skills também podem ser atualizadas no meio da sessão quando o watcher de skills está ativado ou quando aparece um novo Node remoto elegível (veja abaixo). Pense nisso como um **hot reload**: a lista atualizada é usada no próximo turno do agente.

Se a allowlist efetiva de skills do agente mudar para aquela sessão, o OpenClaw
atualiza o snapshot para que as skills visíveis permaneçam alinhadas com o
agente atual.

## Nodes macOS remotos (Gateway Linux)

Se o Gateway estiver em execução no Linux, mas um **Node macOS** estiver conectado **com `system.run` permitido** (segurança de Exec approvals não definida como `deny`), o OpenClaw pode tratar skills exclusivas de macOS como elegíveis quando os binários exigidos estiverem presentes nesse Node. O agente deve executar essas skills pela ferramenta `exec` com `host=node`.

Isso depende de o Node informar seu suporte a comandos e de uma probe de binário via `system.run`. Se o Node macOS ficar offline depois, as skills permanecem visíveis; as invocações podem falhar até que o Node se reconecte.

## Watcher de skills (auto-refresh)

Por padrão, o OpenClaw observa pastas de skills e incrementa o snapshot de skills quando arquivos `SKILL.md` mudam. Configure isso em `skills.load`:

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

## Impacto em tokens (lista de skills)

Quando há skills elegíveis, o OpenClaw injeta uma lista XML compacta de skills disponíveis no prompt de sistema (via `formatSkillsForPrompt` em `pi-coding-agent`). O custo é determinístico:

- **Overhead base (somente quando ≥1 skill):** 195 caracteres.
- **Por skill:** 97 caracteres + o comprimento dos valores com escape XML de `<name>`, `<description>` e `<location>`.

Fórmula (caracteres):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Observações:

- O escape XML expande `& < > " '` em entidades (`&amp;`, `&lt;` etc.), aumentando o comprimento.
- A contagem de tokens varia conforme o tokenizer do modelo. Uma estimativa aproximada no estilo OpenAI é ~4 caracteres/token, então **97 caracteres ≈ 24 tokens** por skill, além do comprimento real dos seus campos.

## Ciclo de vida de skills gerenciadas

O OpenClaw envia um conjunto básico de skills como **skills incluídas** como parte da
instalação (pacote npm ou OpenClaw.app). `~/.openclaw/skills` existe para
substituições locais (por exemplo, fixar/corrigir uma skill sem alterar a cópia
incluída). Skills de workspace pertencem ao usuário e substituem ambas em conflitos de nome.

## Referência de configuração

Consulte [Skills config](/pt-BR/tools/skills-config) para ver o schema completo de configuração.

## Procurando mais skills?

Navegue em [https://clawhub.ai](https://clawhub.ai).

---

## Relacionado

- [Criando Skills](/pt-BR/tools/creating-skills) — criando skills personalizadas
- [Skills Config](/pt-BR/tools/skills-config) — referência de configuração de skill
- [Comandos slash](/pt-BR/tools/slash-commands) — todos os comandos slash disponíveis
- [Plugins](/pt-BR/tools/plugin) — visão geral do sistema de Plugins
