---
read_when:
    - Você quer conhecimento persistente além de notas simples em MEMORY.md
    - Você está configurando o Plugin integrado memory-wiki
    - Você quer entender `wiki_search`, `wiki_get` ou o modo bridge
summary: 'memory-wiki: cofre de conhecimento compilado com proveniência, afirmações, dashboards e modo bridge'
title: Wiki de memória
x-i18n:
    generated_at: "2026-04-24T06:03:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9b2637514878a87f57f1f7d19128f0a4f622852c1a25d632410cb679f081b8e
    source_path: plugins/memory-wiki.md
    workflow: 15
---

`memory-wiki` é um Plugin incluído que transforma memória durável em um
cofre de conhecimento compilado.

Ele **não** substitui o Plugin de Active Memory. O Plugin de Active Memory continua
sendo responsável por recall, promoção, indexação e Dreaming. `memory-wiki` fica ao lado dele
e compila conhecimento durável em uma wiki navegável com páginas determinísticas,
afirmações estruturadas, proveniência, dashboards e digests legíveis por máquina.

Use-o quando quiser que a memória se comporte mais como uma camada de conhecimento mantida e
menos como uma pilha de arquivos Markdown.

## O que ele adiciona

- Um cofre de wiki dedicado com layout determinístico de páginas
- Metadados estruturados de afirmações e evidências, não apenas prosa
- Proveniência, confiança, contradições e perguntas em aberto em nível de página
- Digests compilados para consumidores de agente/runtime
- Ferramentas wiki-native de search/get/apply/lint
- Modo bridge opcional que importa artefatos públicos do Plugin de Active Memory
- Modo de render opcional amigável ao Obsidian e integração com CLI

## Como ele se encaixa com memory

Pense nessa divisão assim:

| Camada                                                  | Responsável por                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin de Active Memory (`memory-core`, QMD, Honcho etc.) | Recall, busca semântica, promoção, Dreaming, runtime de memória                         |
| `memory-wiki`                                           | Páginas compiladas da wiki, sínteses ricas em proveniência, dashboards, search/get/apply específicos da wiki |

Se o Plugin de Active Memory expuser artefatos compartilhados de recall, o OpenClaw poderá buscar
em ambas as camadas em uma única passagem com `memory_search corpus=all`.

Quando você precisar de ranking específico da wiki, proveniência ou acesso direto a páginas, use as
ferramentas wiki-native.

## Padrão híbrido recomendado

Um padrão forte para configurações local-first é:

- QMD como backend de Active Memory para recall e busca semântica ampla
- `memory-wiki` em modo `bridge` para páginas duráveis de conhecimento sintetizado

Essa divisão funciona bem porque cada camada permanece focada:

- QMD mantém pesquisáveis notas brutas, exports de sessão e coleções extras
- `memory-wiki` compila entidades estáveis, afirmações, dashboards e páginas-fonte

Regra prática:

- use `memory_search` quando quiser uma passagem ampla de recall por toda a memória
- use `wiki_search` e `wiki_get` quando quiser resultados de wiki com reconhecimento de proveniência
- use `memory_search corpus=all` quando quiser que a busca compartilhada abranja ambas as camadas

Se o modo bridge informar zero artefatos exportados, o Plugin de Active Memory não está
expondo entradas públicas de bridge no momento. Execute `openclaw wiki doctor` primeiro,
depois confirme se o Plugin de Active Memory oferece suporte a artefatos públicos.

## Modos de cofre

`memory-wiki` oferece suporte a três modos de cofre:

### `isolated`

Cofre próprio, fontes próprias, sem dependência de `memory-core`.

Use isso quando quiser que a wiki seja seu próprio store curado de conhecimento.

### `bridge`

Lê artefatos públicos de memória e eventos de memória do Plugin de Active Memory
por meio das interfaces públicas do SDK de Plugin.

Use isso quando quiser que a wiki compile e organize os artefatos exportados
do Plugin de memória sem acessar internals privados do Plugin.

O modo bridge pode indexar:

- artefatos de memória exportados
- relatórios de sonho
- notas diárias
- arquivos-raiz de memória
- logs de eventos de memória

### `unsafe-local`

Válvula de escape explícita para caminhos locais privados na mesma máquina.

Esse modo é intencionalmente experimental e não portátil. Use-o apenas quando
entender o limite de confiança e precisar especificamente de acesso ao sistema de arquivos local que o
modo bridge não consegue oferecer.

## Layout do cofre

O Plugin inicializa um cofre assim:

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

O conteúdo gerenciado permanece dentro de blocos gerados. Blocos de notas humanos são preservados.

Os principais grupos de páginas são:

- `sources/` para material bruto importado e páginas com suporte de bridge
- `entities/` para coisas duráveis, pessoas, sistemas, projetos e objetos
- `concepts/` para ideias, abstrações, padrões e políticas
- `syntheses/` para resumos compilados e rollups mantidos
- `reports/` para dashboards gerados

## Afirmações estruturadas e evidências

Páginas podem carregar frontmatter de `claims` estruturadas, não apenas texto livre.

Cada afirmação pode incluir:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Entradas de evidência podem incluir:

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

É isso que faz a wiki agir mais como uma camada de crença do que como um simples despejo passivo de notas. Afirmações podem ser rastreadas, pontuadas, contestadas e resolvidas de volta às fontes.

## Pipeline de compilação

A etapa de compilação lê páginas da wiki, normaliza resumos e emite artefatos estáveis
voltados para máquina em:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Esses digests existem para que agentes e código de runtime não precisem fazer scraping de páginas Markdown.

A saída compilada também alimenta:

- indexação inicial da wiki para fluxos de search/get
- lookup de claim-id de volta para páginas responsáveis
- suplementos compactos de prompt
- geração de relatórios/dashboards

## Dashboards e relatórios de integridade

Quando `render.createDashboards` está habilitado, a compilação mantém dashboards em
`reports/`.

Relatórios integrados incluem:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

Esses relatórios acompanham coisas como:

- clusters de notas de contradição
- clusters de afirmações concorrentes
- afirmações sem evidência estruturada
- páginas e afirmações com baixa confiança
- desatualização ou freshness desconhecida
- páginas com perguntas não resolvidas

## Busca e recuperação

`memory-wiki` oferece suporte a dois backends de busca:

- `shared`: usa o fluxo compartilhado de busca de memória, quando disponível
- `local`: busca a wiki localmente

Também oferece suporte a três corpora:

- `wiki`
- `memory`
- `all`

Comportamento importante:

- `wiki_search` e `wiki_get` usam digests compilados como primeira passagem quando possível
- IDs de afirmação podem ser resolvidos de volta à página responsável
- afirmações contestadas/desatualizadas/frescas influenciam o ranking
- rótulos de proveniência podem sobreviver nos resultados

Regra prática:

- use `memory_search corpus=all` para uma passagem ampla de recall
- use `wiki_search` + `wiki_get` quando você se importa com ranking específico da wiki,
  proveniência ou estrutura de crença em nível de página

## Ferramentas do agente

O Plugin registra estas ferramentas:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

O que elas fazem:

- `wiki_status`: modo atual do cofre, integridade, disponibilidade da CLI do Obsidian
- `wiki_search`: busca páginas da wiki e, quando configurado, corpora compartilhados de memória
- `wiki_get`: lê uma página da wiki por id/caminho ou usa fallback para corpus compartilhado de memória
- `wiki_apply`: mutações estreitas de síntese/metadados sem cirurgia livre na página
- `wiki_lint`: verificações estruturais, lacunas de proveniência, contradições, perguntas em aberto

O Plugin também registra um suplemento de corpus de memória não exclusivo, para que
`memory_search` e `memory_get` compartilhados possam alcançar a wiki quando o Plugin de Active Memory oferecer suporte à seleção de corpus.

## Comportamento de prompt e contexto

Quando `context.includeCompiledDigestPrompt` está habilitado, seções de prompt de memória
anexam um snapshot compilado compacto de `agent-digest.json`.

Esse snapshot é intencionalmente pequeno e de alto sinal:

- apenas páginas principais
- apenas afirmações principais
- contagem de contradições
- contagem de perguntas
- qualificadores de confiança/freshness

Isso é opt-in porque muda o formato do prompt e é útil principalmente para
mecanismos de contexto ou montagem legada de prompt que consomem explicitamente suplementos de memória.

## Configuração

Coloque a configuração em `plugins.entries.memory-wiki.config`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

Principais alternâncias:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` ou `obsidian`
- `bridge.readMemoryArtifacts`: importar artefatos públicos do Plugin de Active Memory
- `bridge.followMemoryEvents`: incluir logs de evento em modo bridge
- `search.backend`: `shared` ou `local`
- `search.corpus`: `wiki`, `memory` ou `all`
- `context.includeCompiledDigestPrompt`: anexar snapshot compacto de digest a seções de prompt de memória
- `render.createBacklinks`: gerar blocos relacionados determinísticos
- `render.createDashboards`: gerar páginas de dashboard

### Exemplo: QMD + modo bridge

Use isso quando quiser QMD para recall e `memory-wiki` para uma camada de
conhecimento mantida:

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

Isso mantém:

- QMD encarregado do recall de Active Memory
- `memory-wiki` focado em páginas compiladas e dashboards
- o formato do prompt inalterado até que você habilite intencionalmente prompts de digest compilado

## CLI

`memory-wiki` também expõe uma superfície de CLI de nível superior:

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

Consulte [CLI: wiki](/pt-BR/cli/wiki) para a referência completa de comandos.

## Suporte ao Obsidian

Quando `vault.renderMode` é `obsidian`, o Plugin grava Markdown amigável ao Obsidian
e pode opcionalmente usar a CLI oficial `obsidian`.

Fluxos compatíveis incluem:

- sondagem de status
- busca no cofre
- abertura de uma página
- invocação de um comando do Obsidian
- salto para a nota diária

Isso é opcional. A wiki ainda funciona em modo nativo sem Obsidian.

## Fluxo de trabalho recomendado

1. Mantenha seu Plugin de Active Memory para recall/promoção/Dreaming.
2. Habilite `memory-wiki`.
3. Comece com o modo `isolated`, a menos que você queira explicitamente o modo bridge.
4. Use `wiki_search` / `wiki_get` quando a proveniência importar.
5. Use `wiki_apply` para sínteses estreitas ou atualizações de metadados.
6. Execute `wiki_lint` após mudanças significativas.
7. Ative dashboards se quiser visibilidade de desatualização/contradições.

## Documentação relacionada

- [Visão geral de Memory](/pt-BR/concepts/memory)
- [CLI: memory](/pt-BR/cli/memory)
- [CLI: wiki](/pt-BR/cli/wiki)
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
