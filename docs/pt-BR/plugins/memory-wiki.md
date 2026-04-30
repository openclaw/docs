---
read_when:
    - Você quer conhecimento persistente além de simples notas em MEMORY.md
    - Você está configurando o Plugin memory-wiki incluído
    - Você quer entender wiki_search, wiki_get ou o modo ponte
summary: 'memory-wiki: cofre de conhecimento compilado com proveniência, declarações, painéis e modo de ponte'
title: Wiki de memória
x-i18n:
    generated_at: "2026-04-30T10:00:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 744d569f8b0c9b668ea54dc057f808544359eaae87d5557de2e6acd1b31acd89
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` é um Plugin incluído que transforma memória durável em um cofre de conhecimento compilado.

Ele **não** substitui o Plugin de Active Memory. O Plugin de Active Memory ainda
é responsável por recall, promoção, indexação e Dreaming. `memory-wiki` fica ao lado dele
e compila conhecimento durável em uma wiki navegável com páginas determinísticas,
declarações estruturadas, proveniência, painéis e resumos legíveis por máquina.

Use-o quando quiser que a memória se comporte mais como uma camada de conhecimento mantida e
menos como uma pilha de arquivos Markdown.

## O que ele adiciona

- Um cofre wiki dedicado com layout de página determinístico
- Metadados estruturados de declarações e evidências, não apenas prosa
- Proveniência, confiança, contradições e perguntas em aberto no nível da página
- Resumos compilados para consumidores de agente/runtime
- Ferramentas nativas da wiki para busca/obtenção/aplicação/lint
- Modo de ponte opcional que importa artefatos públicos do Plugin de Active Memory
- Modo de renderização compatível com Obsidian e integração com CLI opcionais

## Como ele se encaixa com a memória

Pense na divisão assim:

| Camada                                                  | Responsável por                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Plugin de Active Memory (`memory-core`, QMD, Honcho, etc.) | Recall, busca semântica, promoção, Dreaming, runtime de memória                            |
| `memory-wiki`                                           | Páginas wiki compiladas, sínteses ricas em proveniência, painéis, busca/obtenção/aplicação específicas da wiki |

Se o Plugin de Active Memory expuser artefatos de recall compartilhados, o OpenClaw pode pesquisar
as duas camadas em uma única passagem com `memory_search corpus=all`.

Quando você precisar de ranqueamento específico da wiki, proveniência ou acesso direto à página, use as
ferramentas nativas da wiki.

## Padrão híbrido recomendado

Um bom padrão inicial para configurações local-first é:

- QMD como backend de Active Memory para recall e busca semântica ampla
- `memory-wiki` em modo `bridge` para páginas de conhecimento sintetizado duráveis

Essa divisão funciona bem porque cada camada permanece focada:

- QMD mantém notas brutas, exportações de sessão e coleções extras pesquisáveis
- `memory-wiki` compila entidades, declarações, painéis e páginas-fonte estáveis

Regra prática:

- use `memory_search` quando quiser uma única passagem ampla de recall pela memória
- use `wiki_search` e `wiki_get` quando quiser resultados de wiki atentos à proveniência
- use `memory_search corpus=all` quando quiser que a busca compartilhada abranja as duas camadas

Se o modo de ponte relatar zero artefatos exportados, o Plugin de Active Memory não está
expondo entradas públicas de ponte no momento. Execute `openclaw wiki doctor` primeiro,
depois confirme que o Plugin de Active Memory oferece suporte a artefatos públicos.

Quando o modo de ponte está ativo e `bridge.readMemoryArtifacts` está habilitado,
`openclaw wiki status`, `openclaw wiki doctor` e `openclaw wiki bridge
import` leem pelo Gateway em execução. Isso mantém as verificações de ponte da CLI alinhadas
com o contexto do Plugin de memória em runtime. Se a ponte estiver desabilitada ou as leituras de artefato
estiverem desativadas, esses comandos mantêm seu comportamento local/offline.

## Modos de cofre

`memory-wiki` oferece suporte a três modos de cofre:

### `isolated`

Cofre próprio, fontes próprias, sem dependência de `memory-core`.

Use isto quando quiser que a wiki seja seu próprio armazenamento de conhecimento curado.

### `bridge`

Lê artefatos públicos de memória e eventos de memória do Plugin de Active Memory
por meio de pontos públicos do SDK de Plugin.

Use isto quando quiser que a wiki compile e organize os artefatos exportados do Plugin de memória
sem acessar componentes internos privados do Plugin.

O modo de ponte pode indexar:

- artefatos de memória exportados
- relatórios de sonho
- notas diárias
- arquivos raiz de memória
- logs de eventos de memória

### `unsafe-local`

Saída de emergência explícita de mesma máquina para caminhos privados locais.

Este modo é intencionalmente experimental e não portável. Use-o apenas quando você
entender o limite de confiança e precisar especificamente de acesso ao sistema de arquivos local que
o modo de ponte não consegue fornecer.

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

- `sources/` para material bruto importado e páginas apoiadas por ponte
- `entities/` para coisas, pessoas, sistemas, projetos e objetos duráveis
- `concepts/` para ideias, abstrações, padrões e políticas
- `syntheses/` para resumos compilados e consolidações mantidas
- `reports/` para painéis gerados

## Declarações estruturadas e evidências

As páginas podem carregar frontmatter `claims` estruturado, não apenas texto livre.

Cada declaração pode incluir:

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

Entradas de evidência podem incluir:

- `kind`
- `sourceId`
- `path`
- `lines`
- `weight`
- `confidence`
- `privacyTier`
- `note`
- `updatedAt`

É isso que faz a wiki agir mais como uma camada de crenças do que como um despejo passivo
de notas. Declarações podem ser rastreadas, pontuadas, contestadas e resolvidas de volta às fontes.

## Metadados de entidade voltados ao agente

Páginas de entidade também podem carregar metadados de roteamento para uso do agente. Isto é
frontmatter genérico, então funciona para pessoas, equipes, sistemas, projetos ou qualquer outro
tipo de entidade.

Campos comuns incluem:

- `entityType`: por exemplo `person`, `team`, `system` ou `project`
- `canonicalId`: chave de identidade estável usada entre aliases e importações
- `aliases`: nomes, identificadores ou rótulos que devem resolver para a mesma página
- `privacyTier`: `public`, `local-private`, `sensitive` ou `confirm-before-use`
- `bestUsedFor` / `notEnoughFor`: dicas compactas de roteamento
- `lastRefreshedAt`: timestamp de atualização da fonte separado do horário de edição da página
- `personCard`: cartão de roteamento opcional específico de pessoa com identificadores, redes sociais,
  emails, fuso horário, área, pedir-por, evitar-pedir-por, confiança e privacidade
- `relationships`: arestas tipadas para páginas relacionadas com destino, tipo, peso,
  confiança, tipo de evidência, nível de privacidade e observação

Para uma wiki de pessoas, o agente geralmente deve começar com
`reports/person-agent-directory.md`, depois abrir a página da pessoa com `wiki_get`
antes de usar detalhes de contato ou fatos inferidos.

Exemplo:

```yaml
pageType: entity
entityType: person
id: entity.brad-groux
canonicalId: maintainer.brad-groux
aliases:
  - Brad
  - bgroux
privacyTier: local-private
bestUsedFor:
  - Microsoft Teams and Azure routing
notEnoughFor:
  - legal approval
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@bgroux"
  socials:
    - "https://x.example/bgroux"
  emails:
    - brad@example.com
  timezone: America/Chicago
  lane: Microsoft ecosystem
  askFor:
    - Teams rollout questions
  avoidAskingFor:
    - unrelated billing decisions
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.alice
    targetTitle: Alice
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.brad.teams
    text: Brad is useful for Microsoft Teams routing.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```

## Pipeline de compilação

A etapa de compilação lê páginas wiki, normaliza resumos e emite artefatos estáveis
voltados à máquina em:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Esses resumos existem para que agentes e código de runtime não precisem extrair Markdown
das páginas.

A saída compilada também alimenta:

- indexação inicial da wiki para fluxos de busca/obtenção
- lookup de id de declaração de volta às páginas proprietárias
- suplementos compactos de prompt
- geração de relatórios/painéis

## Painéis e relatórios de integridade

Quando `render.createDashboards` está habilitado, a compilação mantém painéis em
`reports/`.

Relatórios integrados incluem:

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`
- `reports/person-agent-directory.md`
- `reports/relationship-graph.md`
- `reports/provenance-coverage.md`
- `reports/privacy-review.md`

Esses relatórios acompanham coisas como:

- agrupamentos de notas de contradição
- agrupamentos de declarações concorrentes
- declarações sem evidência estruturada
- páginas e declarações de baixa confiança
- atualização obsoleta ou desconhecida
- páginas com perguntas não resolvidas
- cartões de roteamento de pessoa/entidade
- arestas de relacionamento estruturadas
- cobertura de classes de evidência
- níveis de privacidade não públicos que precisam de revisão antes do uso

## Busca e recuperação

`memory-wiki` oferece suporte a dois backends de busca:

- `shared`: usa o fluxo de busca de memória compartilhada quando disponível
- `local`: pesquisa a wiki localmente

Ele também oferece suporte a três corpora:

- `wiki`
- `memory`
- `all`

Comportamento importante:

- `wiki_search` e `wiki_get` usam resumos compilados como primeira passagem quando possível
- ids de declaração podem resolver de volta para a página proprietária
- declarações contestadas/obsoletas/recentes influenciam o ranqueamento
- rótulos de proveniência podem sobreviver nos resultados
- o modo de busca pode enviesar o ranqueamento para lookup de pessoas, roteamento de perguntas, evidência
  de fonte ou declarações brutas

Regra prática:

- use `memory_search corpus=all` para uma única passagem ampla de recall
- use `wiki_search` + `wiki_get` quando você se importar com ranqueamento específico da wiki,
  proveniência ou estrutura de crença no nível da página

Modos de busca:

- `auto`: padrão equilibrado
- `find-person`: impulsiona entidades semelhantes a pessoas, aliases, identificadores, redes sociais e
  IDs canônicos
- `route-question`: impulsiona cartões de agente, dicas de pedir-por, dicas de melhor-uso-para e
  contexto de relacionamento
- `source-evidence`: impulsiona páginas-fonte e metadados de evidência estruturada
- `raw-claim`: impulsiona declarações estruturadas correspondentes e retorna metadados de declaração/evidência
  nos resultados

Quando um resultado corresponde a uma declaração estruturada, `wiki_search` pode retornar
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` e `evidenceSourceIds` em seu payload de detalhes. A saída em texto
também inclui linhas compactas `Claim:` e `Evidence:` quando disponíveis.

## Ferramentas de agente

O Plugin registra estas ferramentas:

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

O que elas fazem:

- `wiki_status`: modo de cofre atual, integridade, disponibilidade da CLI do Obsidian
- `wiki_search`: pesquisa páginas wiki e, quando configurado, corpora de memória compartilhada;
  aceita `mode` para lookup de pessoas, roteamento de perguntas, evidência de fonte ou drilldown de
  declaração bruta
- `wiki_get`: lê uma página wiki por id/caminho ou faz fallback para corpus de memória compartilhada
- `wiki_apply`: mutações estreitas de síntese/metadados sem cirurgia livre de página
- `wiki_lint`: verificações estruturais, lacunas de proveniência, contradições, perguntas em aberto

O Plugin também registra um suplemento não exclusivo de corpus de memória, para que
`memory_search` e `memory_get` compartilhados possam alcançar a wiki quando o Plugin de Active Memory
oferece suporte à seleção de corpus.

## Comportamento de prompt e contexto

Quando `context.includeCompiledDigestPrompt` está habilitado, seções de prompt de memória
anexam um snapshot compilado compacto de `agent-digest.json`.

Esse snapshot é intencionalmente pequeno e de alto sinal:

- apenas páginas principais
- apenas declarações principais
- contagem de contradições
- contagem de perguntas
- qualificadores de confiança/atualidade

Isto é opt-in porque altera o formato do prompt e é útil principalmente para mecanismos de contexto
ou montagem legada de prompt que consomem explicitamente suplementos de memória.

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

Alternâncias principais:

- `vaultMode`: `isolated`, `bridge`, `unsafe-local`
- `vault.renderMode`: `native` ou `obsidian`
- `bridge.readMemoryArtifacts`: importar artefatos públicos do plugin de memória ativa
- `bridge.followMemoryEvents`: incluir logs de eventos no modo bridge
- `search.backend`: `shared` ou `local`
- `search.corpus`: `wiki`, `memory` ou `all`
- `context.includeCompiledDigestPrompt`: anexar uma captura compacta do resumo às seções de prompt de memória
- `render.createBacklinks`: gerar blocos relacionados determinísticos
- `render.createDashboards`: gerar páginas de painel

### Exemplo: QMD + modo bridge

Use isto quando quiser o QMD para recuperação e `memory-wiki` para uma camada de
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

Isto mantém:

- o QMD responsável pela recuperação de memória ativa
- `memory-wiki` focado em páginas compiladas e painéis
- o formato do prompt inalterado até que você ative intencionalmente os prompts de resumo compilado

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

Quando `vault.renderMode` é `obsidian`, o plugin grava Markdown amigável ao
Obsidian e pode opcionalmente usar a CLI oficial `obsidian`.

Os fluxos de trabalho compatíveis incluem:

- sondagem de status
- busca no vault
- abertura de uma página
- invocação de um comando do Obsidian
- salto para a nota diária

Isto é opcional. A wiki ainda funciona no modo nativo sem o Obsidian.

## Fluxo de trabalho recomendado

1. Mantenha seu plugin de memória ativa para recuperação/promoção/dreaming.
2. Ative `memory-wiki`.
3. Comece com o modo `isolated`, a menos que você queira explicitamente o modo bridge.
4. Use `wiki_search` / `wiki_get` quando a proveniência for importante.
5. Use `wiki_apply` para sínteses restritas ou atualizações de metadados.
6. Execute `wiki_lint` após alterações significativas.
7. Ative painéis se quiser visibilidade de itens obsoletos/contradições.

## Documentação relacionada

- [Visão geral de memória](/pt-BR/concepts/memory)
- [CLI: memory](/pt-BR/cli/memory)
- [CLI: wiki](/pt-BR/cli/wiki)
- [Visão geral do Plugin SDK](/pt-BR/plugins/sdk-overview)
