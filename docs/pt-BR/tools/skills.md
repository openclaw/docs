---
read_when:
    - Adicionando ou modificando Skills
    - Alterando gating de Skills, allowlists ou regras de carregamento
    - Entendendo a precedência de Skills e o comportamento de snapshot
sidebarTitle: Skills
summary: 'Skills: gerenciadas vs do workspace, regras de gating, allowlists de agente e integração de configuração'
title: Skills
x-i18n:
    generated_at: "2026-04-26T11:39:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

O OpenClaw usa pastas de Skill compatíveis com **[AgentSkills](https://agentskills.io)** para ensinar o agente a usar ferramentas. Cada Skill é um diretório
que contém um `SKILL.md` com frontmatter YAML e instruções. O OpenClaw
carrega Skills agrupadas mais substituições locais opcionais, e as filtra no
momento do carregamento com base no ambiente, na configuração e na presença de binários.

## Locais e precedência

O OpenClaw carrega Skills destas fontes, **da maior precedência para a menor**:

| #   | Fonte                 | Caminho                          |
| --- | --------------------- | -------------------------------- |
| 1   | Skills do workspace   | `<workspace>/skills`             |
| 2   | Skills de agente do projeto | `<workspace>/.agents/skills`     |
| 3   | Skills de agente pessoais | `~/.agents/skills`               |
| 4   | Skills gerenciadas/locais | `~/.openclaw/skills`             |
| 5   | Skills agrupadas      | distribuídas com a instalação    |
| 6   | Pastas extras de Skills | `skills.load.extraDirs` (configuração) |

Se houver conflito de nome de Skill, a fonte mais alta prevalece.

## Skills por agente vs compartilhadas

Em configurações **multiagente**, cada agente tem seu próprio workspace:

| Escopo               | Caminho                                     | Visível para                |
| -------------------- | ------------------------------------------- | --------------------------- |
| Por agente           | `<workspace>/skills`                        | Somente aquele agente       |
| Agente do projeto    | `<workspace>/.agents/skills`                | Somente o agente daquele workspace |
| Agente pessoal       | `~/.agents/skills`                          | Todos os agentes naquela máquina |
| Gerenciadas/locais compartilhadas | `~/.openclaw/skills`              | Todos os agentes naquela máquina |
| Diretórios extras compartilhados | `skills.load.extraDirs` (menor precedência) | Todos os agentes naquela máquina |

Mesmo nome em vários lugares → a fonte mais alta prevalece. Workspace vence
agente do projeto, que vence agente pessoal, que vence gerenciada/local, que vence agrupada,
que vence diretórios extras.

## Allowlists de Skill por agente

**Localização** de Skill e **visibilidade** de Skill são controles separados.
Localização/precedência decide qual cópia de uma Skill com o mesmo nome vence; as
allowlists de agente decidem quais Skills um agente realmente pode usar.

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

<AccordionGroup>
  <Accordion title="Regras de allowlist">
    - Omita `agents.defaults.skills` para Skills irrestritas por padrão.
    - Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
    - Defina `agents.list[].skills: []` para nenhuma Skill.
    - Uma lista não vazia em `agents.list[].skills` é o conjunto **final** para aquele
      agente — ela não é mesclada com os padrões.
    - A allowlist efetiva se aplica à construção de prompt, descoberta de
      comando slash de Skill, sincronização de sandbox e snapshots de Skill.
  </Accordion>
</AccordionGroup>

## Plugins e Skills

Plugins podem distribuir suas próprias Skills listando diretórios `skills` em
`openclaw.plugin.json` (caminhos relativos à raiz do plugin). As Skills do plugin
são carregadas quando o plugin é ativado. Esse é o lugar certo para guias operacionais
específicos de ferramenta que são longos demais para a descrição da ferramenta, mas devem ficar
disponíveis sempre que o plugin estiver instalado — por exemplo, o plugin de navegador
distribui uma Skill `browser-automation` para controle de navegador em múltiplas etapas.

Os diretórios de Skill do plugin são mesclados no mesmo caminho de baixa precedência que
`skills.load.extraDirs`, portanto uma Skill agrupada, gerenciada, de agente ou de workspace com o mesmo nome os substitui. Você pode controlá-los via
`metadata.openclaw.requires.config` na entrada de configuração do plugin.

Veja [Plugins](/pt-BR/tools/plugin) para descoberta/configuração e [Ferramentas](/pt-BR/tools) para
a superfície de ferramenta que essas Skills ensinam.

## Skill Workshop

O plugin opcional e experimental **Skill Workshop** pode criar ou atualizar
Skills do workspace a partir de procedimentos reutilizáveis observados durante o trabalho do agente. Ele
fica desativado por padrão e deve ser explicitamente ativado via
`plugins.entries.skill-workshop`.

O Skill Workshop grava apenas em `<workspace>/skills`, verifica o
conteúdo gerado, oferece suporte a aprovação pendente ou gravações automáticas seguras, coloca
propostas inseguras em quarentena e atualiza o snapshot de Skills após gravações bem-sucedidas,
para que novas Skills fiquem disponíveis sem reiniciar o Gateway.

Use-o para correções como _"da próxima vez, verifique a atribuição do GIF"_ ou
workflows conquistados com esforço, como checklists de QA de mídia. Comece com aprovação
pendente; use gravações automáticas apenas em workspaces confiáveis após revisar
as propostas dele. Guia completo: [Plugin Skill Workshop](/pt-BR/plugins/skill-workshop).

## ClawHub (instalação e sincronização)

[ClawHub](https://clawhub.ai) é o registro público de Skills do OpenClaw.
Use comandos nativos `openclaw skills` para descobrir/instalar/atualizar, ou a
CLI separada `clawhub` para fluxos de publicação/sincronização. Guia completo:
[ClawHub](/pt-BR/tools/clawhub).

| Ação                                 | Comando                               |
| ------------------------------------ | ------------------------------------- |
| Instalar uma Skill no workspace      | `openclaw skills install <skill-slug>` |
| Atualizar todas as Skills instaladas | `openclaw skills update --all`         |
| Sincronizar (verificar + publicar atualizações) | `clawhub sync --all`         |

`openclaw skills install` nativo instala no diretório
`skills/` do workspace ativo. A CLI separada `clawhub` também instala em
`./skills` no diretório de trabalho atual (ou usa como fallback o
workspace configurado do OpenClaw). O OpenClaw reconhece isso como
`<workspace>/skills` na próxima sessão.

## Segurança

<Warning>
Trate Skills de terceiros como **código não confiável**. Leia-as antes de ativar.
Prefira execuções em sandbox para entradas não confiáveis e ferramentas arriscadas. Veja
[Sandboxing](/pt-BR/gateway/sandboxing) para os controles do lado do agente.
</Warning>

- A descoberta de Skills em workspace e diretório extra aceita apenas raízes de Skill e arquivos `SKILL.md` cujo realpath resolvido permaneça dentro da raiz configurada.
- Instalações de dependência de Skill com suporte do Gateway (`skills.install`, onboarding e a interface de configurações de Skills) executam o scanner interno de código perigoso antes de executar metadados do instalador. Descobertas `critical` bloqueiam por padrão, a menos que o chamador defina explicitamente a substituição de perigoso; descobertas suspeitas ainda apenas emitem aviso.
- `openclaw skills install <slug>` é diferente — ele baixa uma pasta de Skill do ClawHub para o workspace e não usa o caminho de metadados do instalador acima.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no processo **host** para aquele turno do agente (não no sandbox). Mantenha segredos fora de prompts e logs.

Para um modelo de ameaça mais amplo e checklists, veja [Segurança](/pt-BR/gateway/security).

## Formato de SKILL.md

`SKILL.md` deve incluir pelo menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

O OpenClaw segue a especificação AgentSkills para layout/intenção. O parser usado
pelo agente incorporado oferece suporte apenas a chaves de frontmatter de **linha única**;
`metadata` deve ser um **objeto JSON em linha única**. Use `{baseDir}` nas
instruções para referenciar o caminho da pasta da Skill.

### Chaves opcionais de frontmatter

<ParamField path="homepage" type="string">
  URL exibida como "Website" na interface de Skills do macOS. Também suportada via `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Quando `true`, a Skill é exposta como um comando slash do usuário.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Quando `true`, a Skill é excluída do prompt do modelo (continua disponível por invocação do usuário).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Quando definido como `tool`, o comando slash ignora o modelo e despacha diretamente para uma ferramenta.
</ParamField>
<ParamField path="command-tool" type="string">
  Nome da ferramenta a ser invocada quando `command-dispatch: tool` estiver definido.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Para despacho de ferramenta, encaminha a string bruta de argumentos para a ferramenta (sem parsing do núcleo). A ferramenta é invocada com `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Gating (filtros no momento do carregamento)

O OpenClaw filtra Skills no momento do carregamento usando `metadata` (JSON em linha única):

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
  Emoji opcional usado pela interface de Skills do macOS.
</ParamField>
<ParamField path="homepage" type="string">
  URL opcional exibida como "Website" na interface de Skills do macOS.
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
  Lista de caminhos de `openclaw.json` que devem ser truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Nome da variável de ambiente associada a `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Especificações opcionais de instalador usadas pela interface de Skills do macOS (brew/node/go/uv/download).
</ParamField>

Se `metadata.openclaw` não estiver presente, a Skill será sempre elegível (a menos que
esteja desativada na configuração ou bloqueada por `skills.allowBundled` para Skills agrupadas).

<Note>
Blocos legados `metadata.clawdbot` ainda são aceitos quando
`metadata.openclaw` está ausente, para que Skills antigas instaladas mantenham seus
gates de dependência e dicas de instalador. Skills novas e atualizadas devem usar
`metadata.openclaw`.
</Note>

### Observações sobre sandboxing

- `requires.bins` é verificado no **host** no momento do carregamento da Skill.
- Se um agente estiver em sandbox, o binário também deve existir **dentro do container**. Instale-o via `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem personalizada). `setupCommand` é executado uma vez após a criação do container. Instalações de pacote também exigem saída de rede, sistema de arquivos raiz gravável e usuário root na sandbox.
- Exemplo: a Skill `summarize` (`skills/summarize/SKILL.md`) precisa da CLI `summarize` no container da sandbox para funcionar ali.

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
    - Se vários instaladores estiverem listados, o gateway escolherá uma única opção preferida (brew quando disponível, caso contrário node).
    - Se todos os instaladores forem `download`, o OpenClaw listará cada entrada para que você possa ver os artefatos disponíveis.
    - As especificações de instalador podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por plataforma.
    - Instalações com Node respeitam `skills.install.nodeManager` em `openclaw.json` (padrão: npm; opções: npm/pnpm/yarn/bun). Isso afeta apenas instalações de Skill; o runtime do Gateway ainda deve ser Node — Bun não é recomendado para WhatsApp/Telegram.
    - A seleção de instalador com suporte do Gateway é orientada por preferência: quando as especificações de instalação misturam tipos, o OpenClaw prefere Homebrew quando `skills.install.preferBrew` está ativado e `brew` existe, depois `uv`, depois o gerenciador de node configurado, e depois outros fallbacks como `go` ou `download`.
    - Se todas as especificações de instalação forem `download`, o OpenClaw exibe todas as opções de download em vez de reduzi-las a um único instalador preferido.
  </Accordion>
  <Accordion title="Detalhes por instalador">
    - **Instalações com Go:** se `go` estiver ausente e `brew` estiver disponível, o gateway instala Go via Homebrew primeiro e define `GOBIN` para o `bin` do Homebrew quando possível.
    - **Instalações por download:** `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: automático quando um arquivo é detectado), `stripComponents`, `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
</AccordionGroup>

## Substituições de configuração

Skills agrupadas e gerenciadas podem ser alternadas e receber valores de ambiente
em `skills.entries` em `~/.openclaw/openclaw.json`:

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

<ParamField path="enabled" type="boolean">
  `false` desativa a Skill mesmo que ela esteja agrupada ou instalada.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Conveniência para Skills que declaram `metadata.openclaw.primaryEnv`. Oferece suporte a texto simples ou SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Injetado apenas se a variável ainda não estiver definida no processo.
</ParamField>
<ParamField path="config" type="object">
  Bolsa opcional para campos personalizados por Skill. Chaves personalizadas devem ficar aqui.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Allowlist opcional apenas para Skills **agrupadas**. Se definida, somente as Skills agrupadas da lista serão elegíveis (Skills gerenciadas/do workspace não são afetadas).
</ParamField>

Se o nome da Skill contiver hífens, coloque a chave entre aspas (JSON5 permite
chaves entre aspas). As chaves de configuração correspondem ao **nome da Skill**
por padrão — se uma Skill definir `metadata.openclaw.skillKey`, use essa
chave em `skills.entries`.

<Note>
Para geração/edição de imagem padrão dentro do OpenClaw, use a ferramenta central
`image_generate` com `agents.defaults.imageGenerationModel` em vez
de uma Skill agrupada. Os exemplos de Skill aqui são para workflows personalizados ou de terceiros.
Para análise nativa de imagem, use a ferramenta `image` com
`agents.defaults.imageModel`. Se você escolher `openai/*`, `google/*`,
`fal/*` ou outro modelo de imagem específico de provedor, adicione também a
autenticação/chave de API desse provedor.
</Note>

## Injeção de ambiente

Quando uma execução do agente começa, o OpenClaw:

1. Lê os metadados da Skill.
2. Aplica `skills.entries.<key>.env` e `skills.entries.<key>.apiKey` a `process.env`.
3. Constrói o prompt do sistema com Skills **elegíveis**.
4. Restaura o ambiente original após o fim da execução.

A injeção de ambiente é **limitada à execução do agente**, não a um
ambiente global de shell.

Para o backend agrupado `claude-cli`, o OpenClaw também materializa o mesmo
snapshot elegível como um plugin temporário do Claude Code e o passa com
`--plugin-dir`. O Claude Code pode então usar seu resolvedor nativo de Skill enquanto
o OpenClaw continua controlando precedência, allowlists por agente, gating e
injeção de env/chave de API via `skills.entries.*`. Outros backends de CLI usam apenas o
catálogo de prompts.

## Snapshots e atualização

O OpenClaw cria um snapshot das Skills elegíveis **quando uma sessão começa** e
reutiliza essa lista para turnos subsequentes na mesma sessão. Alterações em
Skills ou configuração entram em vigor na próxima nova sessão.

As Skills podem ser atualizadas no meio da sessão em dois casos:

- O watcher de Skills está ativado.
- Um novo Node remoto elegível aparece.

Pense nisso como um **hot reload**: a lista atualizada é reconhecida no
próximo turno do agente. Se a allowlist efetiva de Skills do agente mudar para aquela
sessão, o OpenClaw atualiza o snapshot para que as Skills visíveis permaneçam alinhadas
com o agente atual.

### Watcher de Skills

Por padrão, o OpenClaw observa pastas de Skill e incrementa o snapshot de Skills
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

Se o Gateway for executado no Linux, mas um **Node macOS** estiver conectado com
`system.run` permitido (segurança de aprovações Exec não definida como `deny`),
o OpenClaw pode tratar Skills exclusivas de macOS como elegíveis quando os
binários necessários estiverem presentes nesse Node. O agente deve executar essas Skills
via a ferramenta `exec` com `host=node`.

Isso depende de o Node informar seu suporte a comandos e de uma verificação de binário
via `system.which` ou `system.run`. Nodes offline **não** tornam
Skills exclusivamente remotas visíveis. Se um Node conectado parar de responder a
verificações de binário, o OpenClaw limpa suas correspondências de binário em cache para que os agentes não vejam mais
Skills que atualmente não podem ser executadas ali.

## Impacto em tokens

Quando há Skills elegíveis, o OpenClaw injeta uma lista XML compacta de Skills disponíveis
no prompt do sistema (via `formatSkillsForPrompt` em
`pi-coding-agent`). O custo é determinístico:

- **Overhead base** (somente quando ≥1 Skill): 195 caracteres.
- **Por Skill:** 97 caracteres + o comprimento dos valores XML-escaped de `<name>`, `<description>` e `<location>`.

Fórmula (caracteres):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

O escape de XML expande `& < > " '` em entidades (`&amp;`, `&lt;` etc.),
aumentando o comprimento. A contagem de tokens varia conforme o tokenizer do modelo. Uma estimativa
aproximada no estilo OpenAI é ~4 caracteres/token, então **97 caracteres ≈ 24 tokens** por
Skill, além dos comprimentos reais dos campos.

## Ciclo de vida de Skills gerenciadas

O OpenClaw distribui um conjunto básico de Skills como **Skills agrupadas** com a
instalação (pacote npm ou OpenClaw.app). `~/.openclaw/skills` existe para
substituições locais — por exemplo, fixar ou corrigir uma Skill sem
alterar a cópia agrupada. Skills do workspace pertencem ao usuário e substituem
ambas em conflitos de nome.

## Procurando mais Skills?

Navegue em [https://clawhub.ai](https://clawhub.ai). Schema completo de
configuração: [Configuração de Skills](/pt-BR/tools/skills-config).

## Relacionado

- [ClawHub](/pt-BR/tools/clawhub) — registro público de Skills
- [Criando Skills](/pt-BR/tools/creating-skills) — criando Skills personalizadas
- [Plugins](/pt-BR/tools/plugin) — visão geral do sistema de plugins
- [Plugin Skill Workshop](/pt-BR/plugins/skill-workshop) — gerar Skills a partir do trabalho do agente
- [Configuração de Skills](/pt-BR/tools/skills-config) — referência de configuração de Skills
- [Comandos slash](/pt-BR/tools/slash-commands) — todos os comandos slash disponíveis
