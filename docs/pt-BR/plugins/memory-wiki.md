---
read_when:
    - Você quer conhecimento persistente além de simples notas em `MEMORY.md`
    - Você está configurando o Plugin empacotado memory-wiki
    - Você quer entender `wiki_search`, `wiki_get` ou o modo bridge
summary: 'memory-wiki: cofre de conhecimento compilado com proveniência, afirmações, painéis e modo bridge'
title: Wiki de Memória
x-i18n:
    generated_at: "2026-04-12T23:29:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44d168a7096f744c56566ecac57499192eb101b4dd8a78e1b92f3aa0d6da3ad1
    source_path: plugins/memory-wiki.md
    workflow: 15
---

# Wiki de Memória

`memory-wiki` é um Plugin empacotado que transforma memória durável em um
cofre de conhecimento compilado.

Ele **não** substitui o Plugin de Active Memory. O Plugin de Active Memory ainda
é responsável por recordação, promoção, indexação e Dreaming. `memory-wiki` fica ao lado dele
e compila conhecimento durável em uma wiki navegável com páginas determinísticas,
afirmações estruturadas, proveniência, painéis e resumos legíveis por máquina.

Use-o quando você quiser que a memória se comporte mais como uma camada de conhecimento mantida
e menos como uma pilha de arquivos Markdown.

## O que ele adiciona

- Um cofre de wiki dedicado com layout de página determinístico
- Metadados estruturados de afirmações e evidências, não apenas prosa
- Proveniência, confiança, contradições e perguntas em aberto no nível da página
- Resumos compilados para consumidores de agente/runtime
- Ferramentas nativas da wiki para search/get/apply/lint
- Modo bridge opcional que importa artefatos públicos do Plugin de Active Memory
- Modo de renderização opcional compatível com Obsidian e integração com CLI

## Como ele se encaixa com a memória

Pense na divisão assim:

| Camada                                                  | Responsável por                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin de Active Memory (`memory-core`, QMD, Honcho etc.) | Recordação, busca semântica, promoção, Dreaming, runtime de memória                        |
| `memory-wiki`                                           | Páginas de wiki compiladas, sínteses ricas em proveniência, painéis, search/get/apply específicos da wiki |

Se o Plugin de Active Memory expuser artefatos de recordação compartilhados, o OpenClaw poderá pesquisar
as duas camadas em uma única passagem com `memory_search corpus=all`.

Quando você precisar de classificação específica da wiki, proveniência ou acesso direto à página, use as
ferramentas nativas da wiki.

## Padrão híbrido recomendado

Um padrão forte por padrão para configurações local-first é:

- QMD como backend de memória ativa para recordação e busca semântica ampla
- `memory-wiki` em modo `bridge` para páginas de conhecimento durável sintetizado

Essa divisão funciona bem porque cada camada permanece focada:

- QMD mantém notas brutas, exportações de sessão e coleções extras pesquisáveis
- `memory-wiki` compila entidades estáveis, afirmações, painéis e páginas-fonte

Regra prática:

- use `memory_search` quando quiser uma passagem ampla única de recordação pela memória
- use `wiki_search` e `wiki_get` quando quiser resultados de wiki com reconhecimento de proveniência
- use `memory_search corpus=all` quando quiser que a busca compartilhada cubra ambas as camadas

Se o modo bridge informar zero artefatos exportados, o Plugin de Active Memory não está
expondo entradas públicas de bridge no momento. Execute `openclaw wiki doctor` primeiro
e depois confirme que o Plugin de Active Memory oferece suporte a artefatos públicos.

## Modos do cofre

`memory-wiki` oferece suporte a três modos de cofre:

### `isolated`

Cofre próprio, fontes próprias, sem dependência de `memory-core`.

Use isso quando você quiser que a wiki seja seu próprio armazenamento curado de conhecimento.

### `bridge`

Lê artefatos públicos de memória e eventos de memória do Plugin de Active Memory
por meio de interfaces públicas do Plugin SDK.

Use isso quando você quiser que a wiki compile e organize os artefatos exportados
do Plugin de memória sem acessar internals privados do Plugin.

O modo bridge pode indexar:

- artefatos de memória exportados
- relatórios de Dreaming
- notas diárias
- arquivos-raiz de memória
- logs de eventos de memória

### `unsafe-local`

Escape hatch explícito na mesma máquina para caminhos privados locais.

Esse modo é intencionalmente experimental e não portátil. Use-o somente quando
você entender o limite de confiança e precisar especificamente de acesso ao sistema de arquivos local que
o modo bridge não consegue fornecer.

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

O conteúdo gerenciado permanece dentro de blocos gerados. Blocos de notas humanas são preservados.

Os principais grupos de páginas são:

- `sources/` para material bruto importado e páginas com bridge
- `entities/` para coisas duráveis, pessoas, sistemas, projetos e objetos
- `concepts/` para ideias, abstrações, padrões e políticas
- `syntheses/` para resumos compilados e consolidações mantidas
- `reports/` para painéis gerados

## Afirmações e evidências estruturadas

As páginas podem carregar frontmatter `claims` estruturado, e não apenas texto livre.

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

Isso é o que faz a wiki agir mais como uma camada de crenças do que como um despejo
passivo de notas. As afirmações podem ser rastreadas, pontuadas, contestadas e resolvidas de volta às fontes.

## Pipeline de compilação

A etapa de compilação lê as páginas da wiki, normaliza os resumos e emite
artefatos estáveis voltados para máquina em:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Esses resumos existem para que agentes e código de runtime não precisem extrair conteúdo de páginas Markdown.

A saída compilada também alimenta:

- indexação inicial da wiki para fluxos de search/get
- busca de claim-id de volta para as páginas proprietárias
- suplementos compactos de prompt
- geração de relatórios/painéis

## Painéis e relatórios de integridade

Quando `render.createDashboards` está habilitado, a compilação mantém painéis em `reports/`.

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
- conteúdo desatualizado ou com atualização desconhecida
- páginas com perguntas não resolvidas

## Busca e recuperação

`memory-wiki` oferece suporte a dois backends de busca:

- `shared`: usar o fluxo compartilhado de busca de memória quando disponível
- `local`: pesquisar a wiki localmente

Ele também oferece suporte a três corpora:

- `wiki`
- `memory`
- `all`

Comportamento importante:

- `wiki_search` e `wiki_get` usam resumos compilados como primeira passagem quando possível
- IDs de afirmação podem ser resolvidos de volta para a página proprietária
- afirmações contestadas/desatualizadas/atuais influenciam a classificação
- rótulos de proveniência podem ser preservados nos resultados

Regra prática:

- use `memory_search corpus=all` para uma passagem ampla única de recordação
- use `wiki_search` + `wiki_get` quando se importar com classificação específica da wiki,
  proveniência ou estrutura de crenças no nível da página

## Ferramentas do agente

O Plugin registra estas ferramentas:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

O que elas fazem:

- `wiki_status`: modo atual do cofre, integridade, disponibilidade da CLI do Obsidian
- `wiki_search`: pesquisa páginas da wiki e, quando configurado, corpora de memória compartilhados
- `wiki_get`: lê uma página da wiki por id/path ou recorre ao corpus de memória compartilhado
- `wiki_apply`: mutações restritas de síntese/metadados sem cirurgia livre na página
- `wiki_lint`: verificações estruturais, lacunas de proveniência, contradições, perguntas em aberto

O Plugin também registra um suplemento não exclusivo de corpus de memória, para que
`memory_search` e `memory_get` compartilhados possam alcançar a wiki quando o Plugin de Active Memory
oferecer suporte à seleção de corpus.

## Comportamento de prompt e contexto

Quando `context.includeCompiledDigestPrompt` está habilitado, as seções de prompt de memória
anexam um snapshot compilado compacto de `agent-digest.json`.

Esse snapshot é intencionalmente pequeno e de alto sinal:

- somente páginas principais
- somente afirmações principais
- contagem de contradições
- contagem de perguntas
- qualificadores de confiança/atualidade

Isso é opt-in porque altera o formato do prompt e é principalmente útil para mecanismos de contexto
ou composição legada de prompt que consomem explicitamente suplementos de memória.

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

Principais opções:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` ou `obsidian`
- `bridge.readMemoryArtifacts`: importar artefatos públicos do Plugin de Active Memory
- `bridge.followMemoryEvents`: incluir logs de eventos no modo bridge
- `search.backend`: `shared` ou `local`
- `search.corpus`: `wiki`, `memory` ou `all`
- `context.includeCompiledDigestPrompt`: anexar snapshot compacto do resumo às seções de prompt de memória
- `render.createBacklinks`: gerar blocos relacionados determinísticos
- `render.createDashboards`: gerar páginas de painel

### Exemplo: QMD + modo bridge

Use isso quando você quiser QMD para recordação e `memory-wiki` para uma camada de
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

- QMD no comando da recordação da memória ativa
- `memory-wiki` focado em páginas compiladas e painéis
- formato do prompt inalterado até que você habilite intencionalmente prompts de resumo compilado

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

Consulte [CLI: wiki](/cli/wiki) para a referência completa de comandos.

## Suporte ao Obsidian

Quando `vault.renderMode` é `obsidian`, o Plugin grava Markdown compatível com Obsidian
e pode opcionalmente usar a CLI oficial `obsidian`.

Fluxos compatíveis incluem:

- verificação de status
- busca no cofre
- abertura de uma página
- invocação de um comando do Obsidian
- ir para a nota diária

Isso é opcional. A wiki continua funcionando em modo native sem Obsidian.

## Fluxo de trabalho recomendado

1. Mantenha seu Plugin de memória ativa para recordação/promoção/Dreaming.
2. Habilite `memory-wiki`.
3. Comece com o modo `isolated`, a menos que você queira explicitamente o modo bridge.
4. Use `wiki_search` / `wiki_get` quando a proveniência for importante.
5. Use `wiki_apply` para sínteses restritas ou atualizações de metadados.
6. Execute `wiki_lint` após mudanças significativas.
7. Ative painéis se quiser visibilidade sobre conteúdo desatualizado/contradições.

## Documentação relacionada

- [Visão geral da memória](/pt-BR/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview)
