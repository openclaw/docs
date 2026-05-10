---
read_when:
    - Adicionar ou modificar Skills
    - Alterando controles de habilitação de Skills, listas de permissões ou regras de carregamento
    - Entendendo a precedência de Skills e o comportamento de instantâneos
sidebarTitle: Skills
summary: 'Skills: gerenciadas vs. de espaço de trabalho, regras de controle, listas de permissões de agentes e integração da configuração'
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:53:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw usa pastas de Skills **compatíveis com [AgentSkills](https://agentskills.io)**
para ensinar o agente a usar ferramentas. Cada Skill é um diretório
contendo um `SKILL.md` com frontmatter YAML e instruções. O OpenClaw
carrega Skills incluídas junto com substituições locais opcionais, e as filtra
no momento do carregamento com base no ambiente, na configuração e na presença de binários.

## Locais e precedência

O OpenClaw carrega Skills destas fontes, **maior precedência primeiro**:

| #   | Fonte                 | Caminho                          |
| --- | --------------------- | -------------------------------- |
| 1   | Skills do workspace   | `<workspace>/skills`             |
| 2   | Skills do agente do projeto | `<workspace>/.agents/skills` |
| 3   | Skills pessoais do agente | `~/.agents/skills`           |
| 4   | Skills gerenciadas/locais | `~/.openclaw/skills`         |
| 5   | Skills incluídas      | enviadas com a instalação        |
| 6   | Pastas extras de Skills | `skills.load.extraDirs` (config) |

Se houver conflito no nome de uma Skill, a fonte mais alta vence.

O diretório nativo `$CODEX_HOME/skills` da Codex CLI não é uma dessas raízes de
Skills do OpenClaw. No modo de harness do Codex, inicializações locais do servidor
de app usam homes do Codex isolados por agente, então Skills pessoais da Codex CLI
não são carregadas implicitamente. Use `openclaw migrate codex --dry-run` para
inventariá-las e `openclaw migrate codex` para escolher diretórios de Skills com
um prompt interativo de caixa de seleção antes de copiá-los para o workspace atual
do agente OpenClaw. Para execuções não interativas, repita `--skill <name>` para
as Skills exatas a copiar.

## Skills por agente vs compartilhadas

Em configurações **multiagente**, cada agente tem seu próprio workspace:

| Escopo               | Caminho                                     | Visível para                 |
| -------------------- | ------------------------------------------- | ---------------------------- |
| Por agente           | `<workspace>/skills`                        | Somente esse agente          |
| Agente do projeto    | `<workspace>/.agents/skills`                | Somente o agente desse workspace |
| Agente pessoal       | `~/.agents/skills`                          | Todos os agentes nessa máquina |
| Gerenciadas/locais compartilhadas | `~/.openclaw/skills`             | Todos os agentes nessa máquina |
| Diretórios extras compartilhados | `skills.load.extraDirs` (menor precedência) | Todos os agentes nessa máquina |

Mesmo nome em vários lugares → a fonte mais alta vence. Workspace supera
agente do projeto, supera agente pessoal, supera gerenciadas/locais, supera incluídas,
supera diretórios extras.

## Listas de permissão de Skills por agente

A **localização** da Skill e a **visibilidade** da Skill são controles separados.
Localização/precedência decide qual cópia de uma Skill com o mesmo nome vence; listas de permissão
do agente decidem quais Skills um agente pode realmente usar.

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
  <Accordion title="Regras de lista de permissão">
    - Omita `agents.defaults.skills` para Skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
    - Defina `agents.list[].skills: []` para nenhuma Skill.
    - Uma lista `agents.list[].skills` não vazia é o conjunto **final** para esse
      agente - ela não é mesclada com os padrões.
    - A lista de permissão efetiva se aplica à construção de prompts, descoberta de
      comandos slash de Skills, sincronização de sandbox e snapshots de Skills.
  </Accordion>
</AccordionGroup>

## Plugins e Skills

Plugins podem enviar suas próprias Skills listando diretórios `skills` em
`openclaw.plugin.json` (caminhos relativos à raiz do Plugin). Skills de Plugin
são carregadas quando o Plugin está habilitado. Este é o lugar certo para guias
operacionais específicos de ferramenta que são longos demais para a descrição da ferramenta,
mas devem estar disponíveis sempre que o Plugin estiver instalado - por exemplo, o Plugin de navegador
envia uma Skill `browser-automation` para controle de navegador em várias etapas.

Diretórios de Skills de Plugin são mesclados no mesmo caminho de baixa precedência que
`skills.load.extraDirs`, então uma Skill incluída, gerenciada, de agente ou de
workspace com o mesmo nome os substitui. Você pode condicioná-los via
`metadata.openclaw.requires.config` na entrada de configuração do Plugin.

Consulte [Plugins](/pt-BR/tools/plugin) para descoberta/configuração e [Ferramentas](/pt-BR/tools) para
a superfície de ferramentas que essas Skills ensinam.

## Skill Workshop

O Plugin opcional e experimental **Skill Workshop** pode criar ou atualizar
Skills do workspace a partir de procedimentos reutilizáveis observados durante o trabalho do agente. Ele
vem desabilitado por padrão e deve ser habilitado explicitamente via
`plugins.entries.skill-workshop`.

O Skill Workshop escreve somente em `<workspace>/skills`, verifica conteúdo
gerado, oferece suporte a aprovação pendente ou gravações seguras automáticas, coloca
propostas inseguras em quarentena e atualiza o snapshot de Skills após gravações
bem-sucedidas para que novas Skills fiquem disponíveis sem reiniciar o Gateway.

Use-o para correções como _"da próxima vez, verifique a atribuição de GIF"_ ou
fluxos de trabalho conquistados com esforço, como checklists de QA de mídia. Comece com aprovação
pendente; use gravações automáticas somente em workspaces confiáveis após revisar
suas propostas. Guia completo: [Plugin Skill Workshop](/pt-BR/plugins/skill-workshop).

## ClawHub (instalação e sincronização)

[ClawHub](https://clawhub.ai) é o registro público de Skills para OpenClaw.
Use comandos nativos `openclaw skills` para descobrir/instalar/atualizar, ou a
CLI separada `clawhub` para fluxos de publicação/sincronização. Guia completo:
[ClawHub](/pt-BR/clawhub).

| Ação                               | Comando                                |
| ---------------------------------- | -------------------------------------- |
| Instalar uma Skill no workspace    | `openclaw skills install <skill-slug>` |
| Atualizar todas as Skills instaladas | `openclaw skills update --all`       |
| Sincronizar (verificar + publicar atualizações) | `clawhub sync --all`        |

O `openclaw skills install` nativo instala no diretório `skills/` do workspace
ativo. A CLI separada `clawhub` também instala em `./skills` no seu diretório
de trabalho atual (ou faz fallback para o workspace OpenClaw configurado).
O OpenClaw reconhece isso como `<workspace>/skills` na próxima sessão.
Raízes de Skills configuradas também aceitam um nível de agrupamento, como
`skills/<group>/<skill>/SKILL.md`, para que Skills de terceiros relacionadas possam
ficar em uma pasta compartilhada sem varredura recursiva ampla.

Clientes Gateway que precisam de entrega privada, não ClawHub, podem preparar um arquivo zip de Skill
com `skills.upload.begin`, `skills.upload.chunk` e
`skills.upload.commit`, depois instalar o upload confirmado com
`skills.install({ source: "upload", uploadId, slug, force?, sha256? })`. Este é
um caminho explícito de upload administrativo para clientes confiáveis, não o fluxo normal de
`openclaw skills install <slug>` ou de instalação pelo ClawHub. Ele vem desligado por padrão
e só funciona quando `skills.install.allowUploadedArchives: true` está definido em
`openclaw.json`. O modo de upload ainda instala no diretório padrão do workspace do agente
`skills/<slug>`; o nome da pasta interna do arquivo é ignorado para o
destino final de instalação.

Páginas de Skills do ClawHub expõem o estado mais recente de verificação de segurança antes da instalação,
com páginas de detalhes de scanner para VirusTotal, ClawScan e análise estática.
`openclaw skills install <slug>` continua sendo apenas o caminho de instalação; publicadores
recuperam falsos positivos pelo painel do ClawHub ou por
`clawhub skill rescan <slug>`.

## Segurança

<Warning>
Trate Skills de terceiros como **código não confiável**. Leia-as antes de habilitar.
Prefira execuções em sandbox para entradas não confiáveis e ferramentas arriscadas. Consulte
[Sandboxing](/pt-BR/gateway/sandboxing) para os controles do lado do agente.
</Warning>

- A descoberta de Skills de workspace e diretórios extras aceita somente raízes de Skills e arquivos `SKILL.md` cujo realpath resolvido permaneça dentro da raiz configurada.
- Instalações de arquivo privado pelo Gateway vêm desligadas por padrão. Quando explicitamente habilitadas,
  exigem um upload zip confirmado contendo `SKILL.md` e reutilizam as mesmas
  proteções de extração de arquivo, travessia de caminho, symlink, force e rollback que
  instalações de Skills do ClawHub. Elas são controladas por
  `skills.install.allowUploadedArchives`; instalações normais do ClawHub não exigem
  essa configuração.
- Instalações de dependências de Skills apoiadas pelo Gateway (`skills.install`, onboarding e a UI de configurações de Skills) executam o scanner integrado de código perigoso antes de executar metadados de instalador. Achados `critical` bloqueiam por padrão, a menos que o chamador defina explicitamente a substituição perigosa; achados suspeitos ainda apenas avisam.
- `openclaw skills install <slug>` é diferente - ele baixa uma pasta de Skill do ClawHub para o workspace e não usa o caminho de metadados de instalador acima.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no processo **host** para esse turno do agente (não no sandbox). Mantenha segredos fora de prompts e logs.

Para um modelo de ameaças e checklists mais amplos, consulte [Segurança](/pt-BR/gateway/security).

## Formato de SKILL.md

`SKILL.md` deve incluir pelo menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

O OpenClaw segue a especificação AgentSkills para layout/intenção. O parser usado
pelo agente incorporado aceita apenas chaves de frontmatter de **linha única**;
`metadata` deve ser um **objeto JSON de linha única**. Use `{baseDir}` nas
instruções para referenciar o caminho da pasta da Skill.

### Chaves opcionais de frontmatter

<ParamField path="homepage" type="string">
  URL exibida como "Site" na UI de Skills do macOS. Também aceita via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, a Skill é exposta como um comando slash do usuário.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, o OpenClaw mantém as instruções da Skill fora do prompt normal
  do agente. A Skill ainda fica instalada e ainda pode ser executada explicitamente como um
  comando slash quando `user-invocable` também é `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Quando definido como `tool`, o comando slash ignora o modelo e despacha diretamente para uma ferramenta.
</ParamField>
<ParamField path="command-tool" type="string">
  Nome da ferramenta a invocar quando `command-dispatch: tool` estiver definido.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para despacho de ferramenta, encaminha a string bruta de argumentos para a ferramenta (sem parsing pelo núcleo). A ferramenta é invocada com `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Controle (filtros de carregamento)

O OpenClaw filtra Skills no momento do carregamento usando `metadata` (JSON de linha única):

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
  Quando `true`, sempre inclua a skill (pula outros gates).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji opcional usado pela UI de Skills do macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opcional exibida como "Site" na UI de Skills do macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Lista opcional de plataformas. Se definida, a skill só será elegível nesses sistemas operacionais.
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

Se nenhum `metadata.openclaw` estiver presente, a skill será sempre elegível (a menos que
esteja desabilitada na configuração ou bloqueada por `skills.allowBundled` para skills empacotadas).

<Note>
Blocos legados `metadata.clawdbot` ainda são aceitos quando
`metadata.openclaw` está ausente, para que skills instaladas mais antigas mantenham seus
gates de dependência e dicas de instalador. Skills novas e atualizadas devem usar
`metadata.openclaw`.
</Note>

### Observações sobre sandbox

- `requires.bins` é verificado no **host** no momento do carregamento da skill.
- Se um agente estiver em sandbox, o binário também deve existir **dentro do contêiner**. Instale-o via `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem personalizada). `setupCommand` é executado uma vez depois que o contêiner é criado. Instalações de pacotes também exigem saída de rede, um FS raiz gravável e um usuário root no sandbox.
- Exemplo: a skill `summarize` (`skills/summarize/SKILL.md`) precisa da CLI `summarize` no contêiner sandbox para ser executada lá.

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
  <Accordion title="Regras de seleção de instalador">
    - Se vários instaladores forem listados, o Gateway escolhe uma única opção preferida (brew quando disponível, caso contrário node).
    - Se todos os instaladores forem `download`, o OpenClaw lista cada entrada para que você possa ver os artefatos disponíveis.
    - Especificações de instalador podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por plataforma.
    - Instalações Node respeitam `skills.install.nodeManager` em `openclaw.json` (padrão: npm; opções: npm/pnpm/yarn/bun). Isso afeta apenas instalações de skills; o runtime do Gateway ainda deve ser Node - Bun não é recomendado para WhatsApp/Telegram.
    - A seleção de instalador apoiada pelo Gateway é orientada por preferência: quando as especificações de instalação misturam tipos, o OpenClaw prefere Homebrew quando `skills.install.preferBrew` está habilitado e `brew` existe, depois `uv`, depois o gerenciador node configurado, depois outros fallbacks como `go` ou `download`.
    - Se todas as especificações de instalação forem `download`, o OpenClaw expõe todas as opções de download em vez de reduzi-las a um instalador preferido.

  </Accordion>
  <Accordion title="Detalhes por instalador">
    - **Instalações Go:** se `go` estiver ausente e `brew` estiver disponível, o gateway instala Go via Homebrew primeiro e define `GOBIN` para o `bin` do Homebrew quando possível.
    - **Instalações por download:** `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: auto quando arquivo detectado), `stripComponents`, `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Sobrescritas de configuração

Skills empacotadas e gerenciadas podem ser alternadas e receber valores de ambiente
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
  `false` desabilita a skill mesmo se ela for empacotada ou instalada.
  A skill empacotada `coding-agent` é opt-in: defina
  `skills.entries.coding-agent.enabled: true` antes de expô-la aos agentes,
  depois garanta que um de `claude`, `codex`, `opencode` ou `pi` esteja instalado e
  autenticado para sua própria CLI.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Atalho para skills que declaram `metadata.openclaw.primaryEnv`. Aceita texto simples ou SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Injetado apenas se a variável ainda não estiver definida no processo.
</ParamField>
<ParamField path="config" type="object">
  Bolsa opcional para campos personalizados por skill. Chaves personalizadas devem ficar aqui.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Allowlist opcional apenas para skills **empacotadas**. Se definida, apenas skills empacotadas na lista serão elegíveis (skills gerenciadas/do workspace não são afetadas).
</ParamField>

Se o nome da skill contiver hifens, coloque a chave entre aspas (JSON5 permite
chaves entre aspas). As chaves de configuração correspondem ao **nome da skill** por padrão - se uma skill
define `metadata.openclaw.skillKey`, use essa chave em `skills.entries`.

<Note>
Para geração/edição de imagens de estoque dentro do OpenClaw, use a ferramenta principal
`image_generate` com `agents.defaults.imageGenerationModel` em vez
de uma skill empacotada. Os exemplos de skill aqui são para workflows personalizados ou de terceiros.
Para análise de imagem nativa, use a ferramenta `image` com
`agents.defaults.imageModel`. Se você escolher `openai/*`, `google/*`,
`fal/*` ou outro modelo de imagem específico de provedor, adicione também a
autenticação/chave de API desse provedor.
</Note>

## Injeção de ambiente

Quando uma execução de agente começa, o OpenClaw:

1. Lê os metadados da skill.
2. Aplica `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` a `process.env`.
3. Cria o prompt de sistema com as skills **elegíveis**.
4. Restaura o ambiente original depois que a execução termina.

A injeção de ambiente é **escopada à execução do agente**, não a um ambiente
global de shell.

Para o backend `claude-cli` empacotado, o OpenClaw também materializa o mesmo
snapshot elegível como um Plugin temporário do Claude Code e o passa com
`--plugin-dir`. O Claude Code pode então usar seu resolvedor nativo de skills enquanto
o OpenClaw ainda controla precedência, allowlists por agente, gating e
injeção de ambiente/chave de API de `skills.entries.*`. Outros backends de CLI usam apenas o
catálogo do prompt.

## Snapshots e atualização

O OpenClaw cria snapshots das skills elegíveis **quando uma sessão começa** e
reutiliza essa lista para turnos subsequentes na mesma sessão. Alterações em
skills ou configuração entram em vigor na próxima nova sessão.

Skills podem ser atualizadas no meio da sessão em dois casos:

- O observador de skills está habilitado.
- Um novo nó remoto elegível aparece.

Pense nisso como um **hot reload**: a lista atualizada é usada no
próximo turno do agente. Se a allowlist efetiva de skills do agente mudar para essa
sessão, o OpenClaw atualiza o snapshot para que as skills visíveis permaneçam alinhadas
com o agente atual.

### Observador de Skills

Por padrão, o OpenClaw observa pastas de skills e incrementa o snapshot de skills
quando arquivos `SKILL.md` mudam. Configure em `skills.load`:

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

Use `allowSymlinkTargets` para layouts intencionais de repositórios irmãos em que a raiz de uma
skill integrada contém um symlink, por exemplo
`~/.agents/skills/manager -> ~/Projects/manager/skills`. A lista de destinos é
comparada depois da resolução por realpath e deve permanecer restrita.

### Nós macOS remotos (Gateway Linux)

Se o Gateway roda no Linux, mas um **nó macOS** está conectado com
`system.run` permitido (segurança de aprovações Exec não definida como `deny`),
o OpenClaw pode tratar skills exclusivas de macOS como elegíveis quando os
binários necessários estiverem presentes nesse nó. O agente deve executar essas skills
por meio da ferramenta `exec` com `host=node`.

Isso depende de o nó relatar seu suporte a comandos e de uma sondagem de binário
via `system.which` ou `system.run`. Nós offline **não** tornam
skills somente remotas visíveis. Se um nó conectado parar de responder a sondagens de binários,
o OpenClaw limpa suas correspondências de binários em cache para que os agentes não vejam mais
skills que não podem ser executadas ali no momento.

## Impacto em tokens

Quando skills são elegíveis, o OpenClaw injeta uma lista XML compacta de
skills disponíveis no prompt de sistema (via `formatSkillsForPrompt` em
`pi-coding-agent`). O custo é determinístico:

- **Sobrecarga base** (somente quando ≥1 skill): 195 caracteres.
- **Por skill:** 97 caracteres + o comprimento dos valores `<name>`, `<description>` e `<location>` com escape de XML.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

O escape de XML expande `& < > " '` em entidades (`&amp;`, `&lt;`, etc.),
aumentando o comprimento. Contagens de tokens variam conforme o tokenizer do modelo. Uma estimativa aproximada
no estilo OpenAI é ~4 caracteres/token, então **97 caracteres ≈ 24 tokens** por
skill mais os comprimentos reais dos seus campos.

## Ciclo de vida de skills gerenciadas

O OpenClaw distribui um conjunto base de skills como **skills empacotadas** com a
instalação (pacote npm ou OpenClaw.app). `~/.openclaw/skills` existe para
sobrescritas locais - por exemplo, fixar ou corrigir uma skill sem
alterar a cópia empacotada. Skills do workspace são de propriedade do usuário e sobrescrevem
ambas em conflitos de nome.

## Procurando mais skills?

Navegue em [https://clawhub.ai](https://clawhub.ai). Esquema completo de configuração:
[Configuração de Skills](/pt-BR/tools/skills-config).

## Relacionado

- [ClawHub](/pt-BR/clawhub) - registro público de skills
- [Criação de skills](/pt-BR/tools/creating-skills) - construção de skills personalizadas
- [Plugins](/pt-BR/tools/plugin) - visão geral do sistema de plugins
- [Plugin Skill Workshop](/pt-BR/plugins/skill-workshop) - gera skills a partir do trabalho do agente
- [Configuração de Skills](/pt-BR/tools/skills-config) - referência de configuração de skills
- [Comandos de barra](/pt-BR/tools/slash-commands) - todos os comandos de barra disponíveis
