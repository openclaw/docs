---
read_when:
    - Adicionando ou modificando Skills
    - Alterando regras de bloqueio ou carregamento de Skill
summary: 'Skills: gerenciadas vs workspace, regras de bloqueio e configuração/env wiring'
title: Skills
x-i18n:
    generated_at: "2026-04-25T13:58:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44f946d91588c878754340aaf55e0e3b9096bba12aea36fb90c445cd41e4f892
    source_path: tools/skills.md
    workflow: 15
---

O OpenClaw usa pastas de skill compatíveis com **[AgentSkills](https://agentskills.io)** para ensinar o agente a usar ferramentas. Cada skill é um diretório contendo um `SKILL.md` com frontmatter YAML e instruções. O OpenClaw carrega **Skills incluídas** mais substituições locais opcionais e as filtra no momento do carregamento com base em ambiente, configuração e presença de binários.

## Locais e precedência

O OpenClaw carrega Skills destas fontes:

1. **Pastas extras de skill**: configuradas com `skills.load.extraDirs`
2. **Skills incluídas**: distribuídas com a instalação (pacote npm ou OpenClaw.app)
3. **Skills gerenciadas/locais**: `~/.openclaw/skills`
4. **Skills pessoais de agente**: `~/.agents/skills`
5. **Skills de agente do projeto**: `<workspace>/.agents/skills`
6. **Skills do workspace**: `<workspace>/skills`

Se houver conflito de nome de skill, a precedência é:

`<workspace>/skills` (mais alta) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → Skills incluídas → `skills.load.extraDirs` (mais baixa)

## Skills por agente vs compartilhadas

Em configurações **multiagente**, cada agente tem seu próprio workspace. Isso significa:

- **Skills por agente** ficam em `<workspace>/skills` apenas para aquele agente.
- **Skills de agente do projeto** ficam em `<workspace>/.agents/skills` e se aplicam a
  esse workspace antes da pasta normal `skills/` do workspace.
- **Skills pessoais de agente** ficam em `~/.agents/skills` e se aplicam em todos os
  workspaces daquela máquina.
- **Skills compartilhadas** ficam em `~/.openclaw/skills` (gerenciadas/locais) e são visíveis
  para **todos os agentes** na mesma máquina.
- **Pastas compartilhadas** também podem ser adicionadas via `skills.load.extraDirs` (precedência
  mais baixa) se você quiser um pacote comum de Skills usado por múltiplos agentes.

Se o mesmo nome de skill existir em mais de um lugar, aplica-se a precedência
normal: workspace vence, depois Skills de agente do projeto, depois Skills pessoais de agente,
depois gerenciadas/locais, depois incluídas e, por fim, extra dirs.

## Listas de permissões de Skills por agente

**Local** da skill e **visibilidade** da skill são controles separados.

- Local/precedência decide qual cópia de uma skill com o mesmo nome vence.
- Listas de permissões do agente decidem quais Skills visíveis um agente pode de fato usar.

Use `agents.defaults.skills` para uma linha de base compartilhada e depois substitua por agente com
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
- Defina `agents.list[].skills: []` para nenhuma Skill.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final para aquele agente; ela
  não é mesclada com os padrões.

O OpenClaw aplica o conjunto efetivo de Skills do agente na construção de prompt, na descoberta de
comando slash de skill, na sincronização de sandbox e nos snapshots de Skills.

## Plugins + Skills

Plugins podem distribuir suas próprias Skills listando diretórios `skills` em
`openclaw.plugin.json` (caminhos relativos à raiz do plugin). Skills de plugin são carregadas
quando o plugin está habilitado. Esse é o lugar certo para guias operacionais específicos de ferramenta
que são longos demais para a descrição da ferramenta, mas devem ficar disponíveis
sempre que o plugin estiver instalado; por exemplo, o plugin de navegador distribui uma
skill `browser-automation` para controle de navegador em várias etapas. Atualmente esses
diretórios são mesclados no mesmo caminho de baixa precedência de
`skills.load.extraDirs`, então uma skill incluída, gerenciada, de agente ou de workspace com o mesmo nome as substitui.
Você pode controlá-las com `metadata.openclaw.requires.config` na entrada de configuração
do plugin. Consulte [Plugins](/pt-BR/tools/plugin) para descoberta/configuração e [Ferramentas](/pt-BR/tools) para a
superfície de ferramentas que essas Skills ensinam.

## Skill Workshop

O Plugin opcional e experimental Skill Workshop pode criar ou atualizar Skills de workspace
a partir de procedimentos reutilizáveis observados durante o trabalho do agente. Ele fica desabilitado por
padrão e deve ser habilitado explicitamente por meio de
`plugins.entries.skill-workshop`.

O Skill Workshop grava apenas em `<workspace>/skills`, analisa o conteúdo gerado,
oferece suporte a aprovação pendente ou gravações automáticas seguras, coloca
propostas inseguras em quarentena e atualiza o snapshot de Skills após gravações bem-sucedidas para que novas
Skills possam ficar disponíveis sem reiniciar o Gateway.

Use-o quando quiser que correções como “da próxima vez, verifique a atribuição do GIF” ou
workflows conquistados com esforço, como checklists de QA de mídia, se tornem instruções procedurais duráveis.
Comece com aprovação pendente; use gravações automáticas apenas em workspaces confiáveis após revisar as propostas. Guia completo:
[Plugin Skill Workshop](/pt-BR/plugins/skill-workshop).

## ClawHub (instalação + sincronização)

ClawHub é o registro público de Skills do OpenClaw. Navegue em
[https://clawhub.ai](https://clawhub.ai). Use comandos nativos `openclaw skills`
para descobrir/instalar/atualizar Skills, ou a CLI separada `clawhub` quando
precisar de workflows de publicação/sincronização.
Guia completo: [ClawHub](/pt-BR/tools/clawhub).

Fluxos comuns:

- Instalar uma skill no seu workspace:
  - `openclaw skills install <skill-slug>`
- Atualizar todas as Skills instaladas:
  - `openclaw skills update --all`
- Sincronizar (varrer + publicar atualizações):
  - `clawhub sync --all`

O comando nativo `openclaw skills install` instala no diretório `skills/` do workspace ativo. A CLI separada `clawhub` também instala em `./skills` no seu
diretório de trabalho atual (ou recorre ao workspace configurado do OpenClaw).
O OpenClaw detecta isso como `<workspace>/skills` na próxima sessão.

## Observações de segurança

- Trate Skills de terceiros como **código não confiável**. Leia-as antes de habilitar.
- Prefira execuções com sandbox para entradas não confiáveis e ferramentas arriscadas. Consulte [Sandboxing](/pt-BR/gateway/sandboxing).
- A descoberta de Skills em workspace e extra-dir aceita apenas raízes de skill e arquivos `SKILL.md` cujo realpath resolvido permaneça dentro da raiz configurada.
- Instalações de dependência de skill com suporte do Gateway (`skills.install`, onboarding e a UI de configurações de Skills) executam o scanner integrado de código perigoso antes de executar metadados do instalador. Resultados `critical` bloqueiam por padrão, a menos que o chamador defina explicitamente a substituição de perigoso; resultados suspeitos continuam apenas como aviso.
- `openclaw skills install <slug>` é diferente: ele baixa uma pasta de skill do ClawHub para o workspace e não usa o caminho de metadados do instalador acima.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no processo do **host**
  para aquele turno do agente (não no sandbox). Mantenha segredos fora de prompts e logs.
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
- O parser usado pelo agente incorporado oferece suporte apenas a chaves de frontmatter em **uma única linha**.
- `metadata` deve ser um **objeto JSON em uma única linha**.
- Use `{baseDir}` nas instruções para referenciar o caminho da pasta da skill.
- Chaves opcionais de frontmatter:
  - `homepage` — URL exibida como “Website” na UI de Skills do macOS (também compatível via `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (padrão: `true`). Quando `true`, a skill é exposta como comando slash do usuário.
  - `disable-model-invocation` — `true|false` (padrão: `false`). Quando `true`, a skill é excluída do prompt do modelo (ainda disponível por invocação do usuário).
  - `command-dispatch` — `tool` (opcional). Quando definido como `tool`, o comando slash ignora o modelo e despacha diretamente para uma ferramenta.
  - `command-tool` — nome da ferramenta a invocar quando `command-dispatch: tool` estiver definido.
  - `command-arg-mode` — `raw` (padrão). Para dispatch de ferramenta, encaminha a string bruta de args para a ferramenta (sem parsing do core).

    A ferramenta é invocada com params:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Bloqueio (filtros no momento do carregamento)

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

- `always: true` — sempre inclui a skill (ignora outros gates).
- `emoji` — emoji opcional usado pela UI de Skills do macOS.
- `homepage` — URL opcional exibida como “Website” na UI de Skills do macOS.
- `os` — lista opcional de plataformas (`darwin`, `linux`, `win32`). Se definida, a skill só é elegível nesses SOs.
- `requires.bins` — lista; cada item deve existir no `PATH`.
- `requires.anyBins` — lista; pelo menos um item deve existir no `PATH`.
- `requires.env` — lista; a variável env deve existir **ou** ser fornecida na configuração.
- `requires.config` — lista de caminhos de `openclaw.json` que devem ser truthy.
- `primaryEnv` — nome da variável env associada a `skills.entries.<name>.apiKey`.
- `install` — array opcional de especificações de instalador usado pela UI de Skills do macOS (brew/node/go/uv/download).

Blocos legados `metadata.clawdbot` ainda são aceitos quando
`metadata.openclaw` está ausente, então Skills instaladas mais antigas mantêm seus
gates de dependência e dicas de instalador. Skills novas e atualizadas devem usar
`metadata.openclaw`.

Observação sobre sandboxing:

- `requires.bins` é verificado no **host** no momento do carregamento da skill.
- Se um agente estiver em sandbox, o binário também deve existir **dentro do contêiner**.
  Instale-o via `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem personalizada).
  `setupCommand` é executado uma vez após a criação do contêiner.
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

Observações:

- Se vários instaladores estiverem listados, o gateway escolhe uma única opção **preferida** (brew quando disponível, caso contrário node).
- Se todos os instaladores forem `download`, o OpenClaw lista cada entrada para que você possa ver os artefatos disponíveis.
- Especificações de instalador podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por plataforma.
- Instalações com Node respeitam `skills.install.nodeManager` em `openclaw.json` (padrão: npm; opções: npm/pnpm/yarn/bun).
  Isso afeta apenas **instalações de skill**; o runtime do Gateway ainda deve ser Node
  (Bun não é recomendado para WhatsApp/Telegram).
- A seleção de instalador com suporte do Gateway é guiada por preferência, não apenas por node:
  quando as especificações de instalação misturam tipos, o OpenClaw prefere Homebrew quando
  `skills.install.preferBrew` está habilitado e `brew` existe, depois `uv`, depois o
  gerenciador node configurado e, em seguida, outros fallbacks, como `go` ou `download`.
- Se toda especificação de instalação for `download`, o OpenClaw mostra todas as opções de download
  em vez de reduzi-las a um único instalador preferido.
- Instalações com Go: se `go` estiver ausente e `brew` estiver disponível, o gateway instala Go via Homebrew primeiro e define `GOBIN` para o `bin` do Homebrew quando possível.
- Instalações por download: `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: automático quando um arquivo for detectado), `stripComponents`, `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).

Se não houver `metadata.openclaw`, a skill será sempre elegível (a menos que
esteja desabilitada na configuração ou bloqueada por `skills.allowBundled` para Skills incluídas).

## Substituições de configuração (`~/.openclaw/openclaw.json`)

Skills incluídas/gerenciadas podem ser ativadas/desativadas e receber valores de env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string em texto simples
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
ferramenta central `image_generate` com `agents.defaults.imageGenerationModel` em vez de uma
skill incluída. Os exemplos de skill aqui são para workflows personalizados ou de terceiros.

Para análise nativa de imagem, use a ferramenta `image` com `agents.defaults.imageModel`.
Para geração/edição nativa de imagem, use `image_generate` com
`agents.defaults.imageGenerationModel`. Se você escolher `openai/*`, `google/*`,
`fal/*` ou outro modelo de imagem específico de provedor, adicione também a
autenticação/chave de API desse provedor.

As chaves de configuração correspondem ao **nome da skill** por padrão. Se uma skill definir
`metadata.openclaw.skillKey`, use essa chave em `skills.entries`.

Regras:

- `enabled: false` desabilita a skill mesmo que ela esteja incluída/instalada.
- `env`: injetado **somente se** a variável ainda não estiver definida no processo.
- `apiKey`: conveniência para Skills que declaram `metadata.openclaw.primaryEnv`.
  Aceita string em texto simples ou objeto SecretRef (`{ source, provider, id }`).
- `config`: bolsa opcional para campos personalizados por skill; chaves personalizadas devem ficar aqui.
- `allowBundled`: lista de permissões opcional apenas para Skills **incluídas**. Se definida, apenas
  Skills incluídas na lista serão elegíveis (Skills gerenciadas/workspace não são afetadas).

## Injeção de ambiente (por execução de agente)

Quando uma execução de agente começa, o OpenClaw:

1. Lê os metadados da skill.
2. Aplica qualquer `skills.entries.<key>.env` ou `skills.entries.<key>.apiKey` a
   `process.env`.
3. Constrói o prompt de sistema com Skills **elegíveis**.
4. Restaura o ambiente original após o fim da execução.

Isso é **limitado à execução do agente**, não um ambiente global de shell.

Para o backend incluído `claude-cli`, o OpenClaw também materializa o mesmo
snapshot elegível como um plugin temporário do Claude Code e o passa com
`--plugin-dir`. O Claude Code pode então usar seu resolvedor nativo de Skills enquanto
o OpenClaw continua controlando precedência, listas de permissões por agente, bloqueio e
injeção de env/chave de API em `skills.entries.*`. Outros backends de CLI usam apenas o
catálogo do prompt.

## Snapshot de sessão (desempenho)

O OpenClaw cria um snapshot das Skills elegíveis **quando uma sessão começa** e reutiliza essa lista nos turnos seguintes da mesma sessão. Alterações em Skills ou configuração entram em vigor na próxima sessão nova.

As Skills também podem ser atualizadas no meio da sessão quando o watcher de Skills está habilitado ou quando um novo nó remoto elegível aparece (veja abaixo). Pense nisso como um **hot reload**: a lista atualizada é capturada no próximo turno do agente.

Se a lista de permissões efetiva de Skills do agente mudar para aquela sessão, o OpenClaw
atualiza o snapshot para que as Skills visíveis permaneçam alinhadas ao agente
atual.

## Nós remotos do macOS (gateway Linux)

Se o Gateway estiver em execução no Linux, mas um **nó macOS** estiver conectado **com `system.run` permitido** (segurança de aprovações de Exec não definida como `deny`), o OpenClaw pode tratar Skills exclusivas do macOS como elegíveis quando os binários necessários estiverem presentes nesse nó. O agente deve executar essas Skills por meio da ferramenta `exec` com `host=node`.

Isso depende de o nó informar seu suporte a comandos e de uma sondagem de binário via `system.run`. Se o nó macOS ficar offline depois, as Skills continuam visíveis; as invocações podem falhar até que o nó se reconecte.

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

Quando as Skills são elegíveis, o OpenClaw injeta uma lista XML compacta de Skills disponíveis no prompt de sistema (via `formatSkillsForPrompt` em `pi-coding-agent`). O custo é determinístico:

- **Overhead base (somente quando ≥1 skill):** 195 caracteres.
- **Por skill:** 97 caracteres + o comprimento dos valores XML-escaped de `<name>`, `<description>` e `<location>`.

Fórmula (caracteres):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Observações:

- O escape XML expande `& < > " '` em entidades (`&amp;`, `&lt;` etc.), aumentando o comprimento.
- A contagem de tokens varia conforme o tokenizer do modelo. Uma estimativa aproximada no estilo OpenAI é ~4 caracteres/token, então **97 caracteres ≈ 24 tokens** por skill, além dos comprimentos reais dos campos.

## Ciclo de vida de Skills gerenciadas

O OpenClaw distribui um conjunto básico de Skills como **Skills incluídas** como parte da
instalação (pacote npm ou OpenClaw.app). `~/.openclaw/skills` existe para
substituições locais (por exemplo, fixar/aplicar patch em uma skill sem alterar a cópia
incluída). Skills de workspace pertencem ao usuário e substituem ambas em conflitos de nome.

## Referência de configuração

Consulte [Configuração de Skills](/pt-BR/tools/skills-config) para o schema completo de configuração.

## Procurando mais Skills?

Navegue em [https://clawhub.ai](https://clawhub.ai).

---

## Relacionado

- [Criando Skills](/pt-BR/tools/creating-skills) — criando Skills personalizadas
- [Configuração de Skills](/pt-BR/tools/skills-config) — referência de configuração de skill
- [Comandos Slash](/pt-BR/tools/slash-commands) — todos os comandos slash disponíveis
- [Plugins](/pt-BR/tools/plugin) — visão geral do sistema de plugins
