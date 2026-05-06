---
read_when:
    - Adicionar ou modificar Skills
    - Alterar o gating de Skills, listas de permissão ou regras de carregamento
    - Entendendo a precedência de Skills e o comportamento de snapshots
sidebarTitle: Skills
summary: 'Skills: gerenciadas vs. de espaço de trabalho, regras de controle, listas de permissões de agentes e integração de configuração'
title: Skills
x-i18n:
    generated_at: "2026-05-06T09:18:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22e1951cc4a932029bc33b43c06ff975b58d9ef81ffe679e2922401e1b6f801c
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa pastas de skill **compatíveis com [AgentSkills](https://agentskills.io)** para ensinar o agente a usar ferramentas. Cada skill é um diretório contendo um `SKILL.md` com frontmatter YAML e instruções. O OpenClaw carrega skills incluídas no pacote, além de substituições locais opcionais, e as filtra no momento do carregamento com base no ambiente, na configuração e na presença de binários.

## Locais e precedência

O OpenClaw carrega skills destas fontes, **da maior precedência para a menor**:

| #   | Fonte                 | Caminho                          |
| --- | --------------------- | -------------------------------- |
| 1   | Skills do workspace   | `<workspace>/skills`             |
| 2   | Skills do agente do projeto | `<workspace>/.agents/skills`     |
| 3   | Skills pessoais do agente | `~/.agents/skills`               |
| 4   | Skills gerenciadas/locais | `~/.openclaw/skills`             |
| 5   | Skills incluídas no pacote | enviadas com a instalação        |
| 6   | Pastas extras de skills | `skills.load.extraDirs` (config) |

Se houver conflito de nome de skill, vence a fonte de maior precedência.

O diretório nativo `$CODEX_HOME/skills` do Codex CLI não é uma dessas raízes de skills do OpenClaw. No modo de harness do Codex, inicializações locais do servidor de app usam homes do Codex isoladas por agente, então skills pessoais do Codex CLI não são carregadas implicitamente. Use `openclaw migrate codex --dry-run` para inventariá-las e `openclaw migrate codex` para escolher diretórios de skills com um prompt interativo de caixas de seleção antes de copiá-los para o workspace atual do agente OpenClaw. Para execuções não interativas, repita `--skill <name>` para as skills exatas a copiar.

## Skills por agente vs compartilhadas

Em configurações **multiagente**, cada agente tem seu próprio workspace:

| Escopo               | Caminho                                     | Visível para                |
| -------------------- | ------------------------------------------- | --------------------------- |
| Por agente           | `<workspace>/skills`                        | Apenas esse agente          |
| Agente do projeto    | `<workspace>/.agents/skills`                | Apenas o agente desse workspace |
| Agente pessoal       | `~/.agents/skills`                          | Todos os agentes nessa máquina |
| Gerenciada/local compartilhada | `~/.openclaw/skills`                        | Todos os agentes nessa máquina |
| Diretórios extras compartilhados | `skills.load.extraDirs` (menor precedência) | Todos os agentes nessa máquina |

Mesmo nome em vários lugares → vence a fonte de maior precedência. Workspace vence agente do projeto, que vence agente pessoal, que vence gerenciada/local, que vence incluída no pacote, que vence diretórios extras.

## Listas de permissão de skills por agente

A **localização** da skill e a **visibilidade** da skill são controles separados. Localização/precedência decide qual cópia de uma skill com o mesmo nome vence; listas de permissão do agente decidem quais skills um agente pode realmente usar.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // herda github, weather
      { id: "docs", skills: ["docs-search"] }, // substitui os padrões
      { id: "locked-down", skills: [] }, // sem skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Regras de lista de permissão">
    - Omita `agents.defaults.skills` para skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
    - Defina `agents.list[].skills: []` para não ter skills.
    - Uma lista `agents.list[].skills` não vazia é o conjunto **final** para esse agente - ela não é mesclada com os padrões.
    - A lista de permissão efetiva se aplica à construção de prompts, descoberta de comandos de barra de skill, sincronização do sandbox e snapshots de skills.

  </Accordion>
</AccordionGroup>

## Plugins e skills

Plugins podem enviar suas próprias skills listando diretórios `skills` em `openclaw.plugin.json` (caminhos relativos à raiz do Plugin). As skills do Plugin são carregadas quando o Plugin está habilitado. Este é o lugar certo para guias operacionais específicos de ferramenta que são longos demais para a descrição da ferramenta, mas devem estar disponíveis sempre que o Plugin estiver instalado - por exemplo, o Plugin de navegador envia uma skill `browser-automation` para controle de navegador em várias etapas.

Os diretórios de skills de Plugin são mesclados no mesmo caminho de baixa precedência que `skills.load.extraDirs`, então uma skill de mesmo nome incluída no pacote, gerenciada, de agente ou de workspace os substitui. Você pode condicioná-los via `metadata.openclaw.requires.config` na entrada de configuração do Plugin.

Consulte [Plugins](/pt-BR/tools/plugin) para descoberta/configuração e [Ferramentas](/pt-BR/tools) para a superfície de ferramentas que essas skills ensinam.

## Skill Workshop

O Plugin opcional e experimental **Skill Workshop** pode criar ou atualizar skills de workspace a partir de procedimentos reutilizáveis observados durante o trabalho do agente. Ele fica desabilitado por padrão e deve ser explicitamente habilitado via `plugins.entries.skill-workshop`.

O Skill Workshop grava apenas em `<workspace>/skills`, verifica o conteúdo gerado, oferece suporte a aprovação pendente ou gravações seguras automáticas, coloca propostas inseguras em quarentena e atualiza o snapshot de skills após gravações bem-sucedidas para que novas skills fiquem disponíveis sem reiniciar o Gateway.

Use-o para correções como _"da próxima vez, verifique a atribuição do GIF"_ ou fluxos de trabalho conquistados com esforço, como checklists de QA de mídia. Comece com aprovação pendente; use gravações automáticas apenas em workspaces confiáveis após revisar suas propostas. Guia completo: [Plugin Skill Workshop](/pt-BR/plugins/skill-workshop).

## ClawHub (instalação e sincronização)

[ClawHub](https://clawhub.ai) é o registro público de skills para o OpenClaw. Use os comandos nativos `openclaw skills` para descobrir/instalar/atualizar, ou a CLI separada `clawhub` para fluxos de publicação/sincronização. Guia completo: [ClawHub](/pt-BR/tools/clawhub).

| Ação                               | Comando                                |
| ---------------------------------- | -------------------------------------- |
| Instalar uma skill no workspace    | `openclaw skills install <skill-slug>` |
| Atualizar todas as skills instaladas | `openclaw skills update --all`         |
| Sincronizar (verificar + publicar atualizações) | `clawhub sync --all`                   |

O `openclaw skills install` nativo instala no diretório `skills/` do workspace ativo. A CLI separada `clawhub` também instala em `./skills` no diretório de trabalho atual (ou recorre ao workspace OpenClaw configurado). O OpenClaw detecta isso como `<workspace>/skills` na próxima sessão.
Raízes de skills configuradas também oferecem suporte a um nível de agrupamento, como `skills/<group>/<skill>/SKILL.md`, para que skills de terceiros relacionadas possam ser mantidas em uma pasta compartilhada sem varredura recursiva ampla.

As páginas de skills do ClawHub expõem o estado mais recente da verificação de segurança antes da instalação, com páginas de detalhes de scanners para VirusTotal, ClawScan e análise estática. `openclaw skills install <slug>` continua sendo apenas o caminho de instalação; publicadores recuperam falsos positivos pelo painel do ClawHub ou por `clawhub skill rescan <slug>`.

## Segurança

<Warning>
Trate skills de terceiros como **código não confiável**. Leia-as antes de habilitar. Prefira execuções em sandbox para entradas não confiáveis e ferramentas arriscadas. Consulte [Sandboxing](/pt-BR/gateway/sandboxing) para os controles do lado do agente.
</Warning>

- A descoberta de skills em workspace e diretórios extras só aceita raízes de skills e arquivos `SKILL.md` cujo realpath resolvido permaneça dentro da raiz configurada.
- Instalações de dependências de skills apoiadas pelo Gateway (`skills.install`, onboarding e a UI de configurações de Skills) executam o scanner integrado de código perigoso antes de executar metadados do instalador. Achados `critical` bloqueiam por padrão, a menos que o chamador defina explicitamente a substituição perigosa; achados suspeitos ainda apenas avisam.
- `openclaw skills install <slug>` é diferente - ele baixa uma pasta de skill do ClawHub para o workspace e não usa o caminho de metadados do instalador acima.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no processo do **host** para aquele turno do agente (não no sandbox). Mantenha segredos fora de prompts e logs.

Para um modelo de ameaças e checklists mais abrangentes, consulte [Segurança](/pt-BR/gateway/security).

## Formato de SKILL.md

`SKILL.md` deve incluir pelo menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

O OpenClaw segue a especificação AgentSkills para layout/intenção. O parser usado pelo agente incorporado oferece suporte apenas a chaves de frontmatter de **linha única**; `metadata` deve ser um **objeto JSON de linha única**. Use `{baseDir}` nas instruções para referenciar o caminho da pasta da skill.

### Chaves opcionais de frontmatter

<ParamField path="homepage" type="string">
  URL exibida como "Website" na UI de Skills do macOS. Também compatível via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, a skill é exposta como um comando de barra do usuário.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, o OpenClaw mantém as instruções da skill fora do prompt normal do agente. A skill ainda fica instalada e ainda pode ser executada explicitamente como um comando de barra quando `user-invocable` também é `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Quando definido como `tool`, o comando de barra ignora o modelo e despacha diretamente para uma ferramenta.
</ParamField>
<ParamField path="command-tool" type="string">
  Nome da ferramenta a invocar quando `command-dispatch: tool` está definido.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para despacho de ferramenta, encaminha a string bruta de args para a ferramenta (sem parsing no núcleo). A ferramenta é invocada com `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
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
  URL opcional mostrada como "Website" na UI de Skills do macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Lista opcional de plataformas. Se definida, a skill só é elegível nesses SOs.
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

Se nenhum `metadata.openclaw` estiver presente, a skill é sempre elegível (a menos que esteja desabilitada na configuração ou bloqueada por `skills.allowBundled` para skills incluídas no pacote).

<Note>
Blocos legados `metadata.clawdbot` ainda são aceitos quando `metadata.openclaw` está ausente, para que skills instaladas mais antigas mantenham seus gates de dependência e dicas de instalador. Skills novas e atualizadas devem usar `metadata.openclaw`.
</Note>

### Observações sobre sandboxing

- `requires.bins` é verificado no **host** no momento do carregamento da skill.
- Se um agente estiver em sandbox, o binário também deve existir **dentro do contêiner**. Instale-o via `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem personalizada). `setupCommand` é executado uma vez depois que o contêiner é criado. Instalações de pacotes também exigem saída de rede, um FS raiz gravável e um usuário root no sandbox.
- Exemplo: a skill `summarize` (`skills/summarize/SKILL.md`) precisa da CLI `summarize` no contêiner de sandbox para ser executada lá.

### Especificações do instalador

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
    - Se vários instaladores forem listados, o gateway escolhe uma única opção preferencial (brew quando disponível, caso contrário node).
    - Se todos os instaladores forem `download`, o OpenClaw lista cada entrada para que você possa ver os artefatos disponíveis.
    - As especificações do instalador podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por plataforma.
    - Instalações do Node respeitam `skills.install.nodeManager` em `openclaw.json` (padrão: npm; opções: npm/pnpm/yarn/bun). Isso afeta apenas instalações de Skills; o runtime do Gateway ainda deve ser Node - Bun não é recomendado para WhatsApp/Telegram.
    - A seleção de instalador apoiada pelo Gateway é orientada por preferência: quando as especificações de instalação misturam tipos, o OpenClaw prefere Homebrew quando `skills.install.preferBrew` está habilitado e `brew` existe, depois `uv`, depois o gerenciador node configurado, depois outros fallbacks como `go` ou `download`.
    - Se toda especificação de instalação for `download`, o OpenClaw expõe todas as opções de download em vez de reduzi-las a um instalador preferencial.

  </Accordion>
  <Accordion title="Per-installer details">
    - **Instalações Go:** se `go` estiver ausente e `brew` estiver disponível, o gateway instala Go via Homebrew primeiro e define `GOBIN` para o `bin` do Homebrew quando possível.
    - **Instalações por download:** `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: automático quando um arquivo compactado é detectado), `stripComponents`, `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Sobrescritas de configuração

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
  A skill empacotada `coding-agent` é opt-in: defina
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
  Contêiner opcional para campos personalizados por skill. Chaves personalizadas devem ficar aqui.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Lista de permissões opcional apenas para Skills **empacotadas**. Se definida, somente Skills empacotadas na lista são elegíveis (Skills gerenciadas/de workspace não são afetadas).
</ParamField>

Se o nome da skill contiver hifens, coloque a chave entre aspas (JSON5 permite
chaves entre aspas). As chaves de configuração correspondem ao **nome da skill** por padrão - se uma skill
definir `metadata.openclaw.skillKey`, use essa chave em `skills.entries`.

<Note>
Para geração/edição de imagens padrão dentro do OpenClaw, use a ferramenta central
`image_generate` com `agents.defaults.imageGenerationModel` em vez
de uma skill empacotada. Os exemplos de Skills aqui são para fluxos de trabalho
personalizados ou de terceiros. Para análise de imagem nativa, use a ferramenta `image` com
`agents.defaults.imageModel`. Se você escolher `openai/*`, `google/*`,
`fal/*` ou outro modelo de imagem específico de provedor, adicione também a
chave de autenticação/API desse provedor.
</Note>

## Injeção de ambiente

Quando uma execução de agente começa, o OpenClaw:

1. Lê os metadados de Skills.
2. Aplica `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` a `process.env`.
3. Cria o prompt de sistema com Skills **elegíveis**.
4. Restaura o ambiente original após o término da execução.

A injeção de ambiente é **escopada à execução do agente**, não a um ambiente
global de shell.

Para o backend empacotado `claude-cli`, o OpenClaw também materializa o mesmo
snapshot elegível como um plugin temporário do Claude Code e o passa com
`--plugin-dir`. O Claude Code pode então usar seu resolvedor nativo de Skills enquanto
o OpenClaw ainda controla precedência, listas de permissão por agente, gating e
injeção de env/chave de API de `skills.entries.*`. Outros backends de CLI usam apenas o
catálogo de prompt.

## Snapshots e atualização

O OpenClaw tira snapshots das Skills elegíveis **quando uma sessão começa** e
reutiliza essa lista para turnos subsequentes na mesma sessão. Alterações em
Skills ou configuração entram em vigor na próxima nova sessão.

Skills podem ser atualizadas no meio da sessão em dois casos:

- O observador de Skills está habilitado.
- Um novo node remoto elegível aparece.

Pense nisso como um **hot reload**: a lista atualizada é usada no
próximo turno do agente. Se a lista de permissões efetiva de Skills do agente mudar para essa
sessão, o OpenClaw atualiza o snapshot para que as Skills visíveis permaneçam alinhadas
ao agente atual.

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

### Nodes macOS remotos (gateway Linux)

Se o Gateway roda no Linux, mas um **node macOS** está conectado com
`system.run` permitido (segurança de aprovações Exec não definida como `deny`),
o OpenClaw pode tratar Skills exclusivas de macOS como elegíveis quando os binários
necessários estiverem presentes nesse node. O agente deve executar essas Skills
pela ferramenta `exec` com `host=node`.

Isso depende de o node informar seu suporte a comandos e de uma sondagem de bin
via `system.which` ou `system.run`. Nodes offline **não** tornam
Skills somente remotas visíveis. Se um node conectado parar de responder a sondagens de bin,
o OpenClaw limpa suas correspondências de bin em cache para que agentes não vejam mais
Skills que não podem ser executadas ali no momento.

## Impacto em tokens

Quando Skills são elegíveis, o OpenClaw injeta uma lista XML compacta de Skills
disponíveis no prompt de sistema (via `formatSkillsForPrompt` em
`pi-coding-agent`). O custo é determinístico:

- **Sobrecarga base** (somente quando ≥1 skill): 195 caracteres.
- **Por skill:** 97 caracteres + o comprimento dos valores XML-escapados de `<name>`, `<description>` e `<location>`.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

O escape XML expande `& < > " '` em entidades (`&amp;`, `&lt;`, etc.),
aumentando o comprimento. Contagens de tokens variam conforme o tokenizer do modelo. Uma estimativa aproximada
no estilo OpenAI é ~4 caracteres/token, então **97 caracteres ≈ 24 tokens** por
skill, além dos comprimentos reais dos seus campos.

## Ciclo de vida de Skills gerenciadas

O OpenClaw vem com um conjunto base de Skills como **Skills empacotadas** com a
instalação (pacote npm ou OpenClaw.app). `~/.openclaw/skills` existe para
sobrescritas locais - por exemplo, fixar ou corrigir uma skill sem
alterar a cópia empacotada. Skills de workspace pertencem ao usuário e sobrescrevem
ambas em conflitos de nome.

## Procurando mais Skills?

Navegue por [https://clawhub.ai](https://clawhub.ai). Esquema de configuração
completo: [Configuração de Skills](/pt-BR/tools/skills-config).

## Relacionado

- [ClawHub](/pt-BR/tools/clawhub) - registro público de Skills
- [Criando Skills](/pt-BR/tools/creating-skills) - criação de Skills personalizadas
- [Plugins](/pt-BR/tools/plugin) - visão geral do sistema de plugins
- [Plugin Skill Workshop](/pt-BR/plugins/skill-workshop) - gere Skills a partir do trabalho do agente
- [Configuração de Skills](/pt-BR/tools/skills-config) - referência de configuração de Skills
- [Comandos de barra](/pt-BR/tools/slash-commands) - todos os comandos de barra disponíveis
