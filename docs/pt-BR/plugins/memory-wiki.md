---
read_when:
    - Você quer conhecimento persistente além de simples anotações no MEMORY.md
    - Você está configurando o Plugin memory-wiki incluído no pacote
    - Você precisa de cofres wiki separados para agentes em um único Gateway
    - Você quer entender `wiki_search`, `wiki_get` ou o modo bridge
summary: 'memory-wiki: cofre de conhecimento compilado com proveniência, afirmações, painéis e modo de ponte'
title: Wiki de memória
x-i18n:
    generated_at: "2026-07-12T15:31:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf6c046bfa062b9df6deaa0753d992f9dbc45e2506d6ed4fb1a2836141a901c7
    source_path: plugins/memory-wiki.md
    workflow: 16
---

`memory-wiki` é um plugin incluído que compila conhecimento durável em uma
wiki navegável: páginas determinísticas, alegações estruturadas com evidências,
proveniência, painéis e resumos legíveis por máquina.

Ele não substitui o plugin de Active Memory. Recuperação, promoção, indexação e
Dreaming continuam sob responsabilidade de qualquer backend de memória configurado
(`memory-core`, QMD, Honcho etc.). O `memory-wiki` fica ao lado dele e compila
conhecimento em uma camada de wiki mantida.

| Camada                  | Responsável por                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------- |
| Plugin de Active Memory | Recuperação, busca semântica, promoção, Dreaming, runtime de memória                    |
| `memory-wiki`           | Páginas de wiki compiladas, sínteses ricas em proveniência, painéis, busca/acesso/aplicação na wiki |

Regra prática:

- `memory_search` para uma passagem ampla de recuperação em todos os corpora configurados
- `wiki_search` / `wiki_get` quando você deseja classificação específica da wiki, proveniência ou estrutura de crenças no nível da página
- `memory_search corpus=all` para abranger as duas camadas em uma chamada, quando o plugin de Active Memory oferece suporte à seleção de corpus

Uma configuração comum com prioridade local: QMD como backend de Active Memory para recuperação e
`memory-wiki` no modo `bridge` para páginas sintetizadas duráveis. Consulte o
exemplo de QMD + modo bridge em [Configuração](#configuration).

Se o modo bridge relatar zero artefatos exportados, o plugin de Active Memory
não está expondo entradas públicas para a ponte no momento. Primeiro, execute `openclaw wiki doctor`
e confirme se o plugin de Active Memory oferece suporte a artefatos públicos.

## Modos do cofre

- `isolated` (padrão): cofre próprio, fontes próprias, sem dependência do plugin de Active Memory. Use isso para um repositório de conhecimento selecionado e autocontido.
- `bridge`: lê artefatos públicos de memória e logs de eventos do plugin de Active Memory por meio de interfaces públicas do SDK de plugins. Use isso para compilar os artefatos exportados pelo plugin de memória sem acessar componentes internos privados do plugin.
- `unsafe-local`: mecanismo de escape explícito para caminhos locais privados na mesma máquina. Intencionalmente experimental e não portátil; use somente quando compreender o limite de confiança e precisar especificamente de acesso ao sistema de arquivos local que o modo bridge não pode fornecer.

O modo e o escopo do cofre são escolhas separadas:

- `vaultMode` escolhe de onde vêm as entradas da wiki.
- `vault.scope` escolhe se todos os agentes usam um único cofre ou se cada agente recebe um cofre filho.

`vault.scope: "global"` é o padrão e preserva o comportamento existente de
cofre único. Use `vault.scope: "agent"` com o modo `isolated` ou `bridge` quando
os agentes não puderem compartilhar páginas da wiki, resumos compilados, resultados de busca ou gravações.
O escopo de agente não pode ser combinado com o modo `unsafe-local`, pois esses caminhos
privados configurados não são entradas pertencentes ao agente. A validação da configuração rejeita essa
combinação.

O modo bridge pode indexar, de acordo com cada opção de configuração `bridge.*`:

- artefatos de memória exportados (`indexMemoryRoot`)
- notas diárias (`indexDailyNotes`)
- relatórios de Dreaming (`indexDreamReports`)
- logs de eventos de memória (`followMemoryEvents`)

Quando o modo bridge está ativo e `bridge.readMemoryArtifacts` está habilitado,
`openclaw wiki status`, `openclaw wiki doctor` e `openclaw wiki bridge
import` são encaminhados pelo Gateway em execução para que vejam o mesmo contexto do plugin de Active Memory
que a memória do agente/runtime. Se a ponte estiver desabilitada ou a
leitura de artefatos estiver desativada, esses comandos mantêm o comportamento local/offline.

## Layout do cofre

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

O conteúdo gerenciado permanece dentro dos blocos gerados; os blocos de notas humanas são
preservados entre regenerações.

- `sources/`: material bruto importado e páginas respaldadas por bridge/unsafe-local
- `entities/`: coisas, pessoas, sistemas, projetos e objetos duráveis
- `concepts/`: ideias, abstrações, padrões e políticas (também o destino das importações de OKF)
- `syntheses/`: resumos compilados e consolidações mantidas
- `reports/`: painéis gerados

## Importações do Open Knowledge Format

```bash
openclaw wiki okf import ./bundles/ga4
```

Importe um pacote descompactado do Open Knowledge Format para páginas de conceitos da wiki. É uma boa
opção quando um catálogo de dados, rastreador de documentação ou agente de enriquecimento já
produz OKF: mantenha o OKF como artefato de intercâmbio portátil e deixe o `memory-wiki`
transformá-lo em páginas de conceitos nativas do OpenClaw e resumos compilados.

- arquivos `.md` não reservados são documentos de conceitos
- cada conceito importado exige um campo de frontmatter `type` não vazio; a ausência de `type` produz um aviso `missing-type` e o arquivo é ignorado
- valores desconhecidos de `type` são aceitos como conceitos genéricos
- `index.md` e `log.md` são reservados e nunca importados como conceitos
- links Markdown quebrados ou externos permanecem inalterados

As páginas importadas são niveladas em `concepts/` para que os fluxos existentes de compilação, busca, acesso e
painéis as vejam sem uma segunda árvore de wiki. Cada página mantém o
ID original do conceito OKF, o caminho da fonte, `type`, `resource`, `tags`, o carimbo de data/hora
e todo o frontmatter do produtor. Links internos de OKF são reescritos para as páginas de
conceitos geradas na wiki e também emitem entradas estruturadas em `relationships` com
`kind: okf-link`.

## Alegações estruturadas e evidências

As páginas contêm frontmatter estruturado de `claims`, não apenas texto livre. Cada
alegação pode incluir `id`, `text`, `status`, `confidence`, `evidence[]` e
`updatedAt`. Cada entrada de evidência pode incluir `kind`, `sourceId`, `path`,
`lines`, `weight`, `confidence`, `privacyTier`, `note` e `updatedAt`.

Isso faz com que a wiki funcione como uma camada de crenças, não como um depósito passivo de notas.
As alegações podem ser rastreadas, pontuadas, contestadas e vinculadas novamente às fontes.

## Metadados de entidades voltados para agentes

As páginas de entidades contêm metadados genéricos de roteamento que podem ser usados para pessoas, equipes,
sistemas, projetos ou qualquer outro tipo de entidade:

- `entityType`: por exemplo, `person`, `team`, `system`, `project`
- `canonicalId`: chave de identidade estável entre aliases e importações
- `aliases`: nomes, identificadores ou rótulos que apontam para a mesma página
- `privacyTier`: string de formato livre; `public` é tratado como sem necessidade de revisão, qualquer outro valor (por exemplo, `local-private`, `sensitive`, `confirm-before-use`) é sinalizado em `reports/privacy-review.md`
- `bestUsedFor` / `notEnoughFor`: dicas compactas de roteamento
- `lastRefreshedAt`: carimbo de data/hora da atualização da fonte, separado do horário de edição da página
- `personCard`: cartão opcional de roteamento específico de pessoa (identificadores, redes sociais, e-mails, fuso horário, área, assuntos a consultar, assuntos a evitar, confiança e nível de privacidade)
- `relationships`: arestas tipadas para páginas relacionadas (destino, tipo, peso, confiança, tipo de evidência, nível de privacidade e observação)

Para uma wiki de pessoas, comece por `reports/person-agent-directory.md` e depois abra
a página da pessoa com `wiki_get` antes de usar detalhes de contato ou fatos
inferidos.

<Accordion title="Exemplo de página de entidade">
```yaml
pageType: entity
entityType: person
id: entity.example-person
canonicalId: maintainer.example-person
aliases:
  - Alex
  - example-handle
privacyTier: local-private
bestUsedFor:
  - Roteamento do ecossistema de exemplo
notEnoughFor:
  - aprovação jurídica
lastRefreshedAt: "2026-04-29T00:00:00.000Z"
personCard:
  handles:
    - "@example-handle"
  socials:
    - "https://x.example/example-handle"
  emails:
    - alex@example.com
  timezone: America/Chicago
  lane: Ecossistema de exemplo
  askFor:
    - Perguntas sobre a implantação do exemplo
  avoidAskingFor:
    - decisões de cobrança não relacionadas
  confidence: 0.8
  privacyTier: confirm-before-use
relationships:
  - targetId: entity.other-person
    targetTitle: Outra pessoa
    kind: collaborates-with
    confidence: 0.7
    evidenceKind: discrawl-stat
claims:
  - id: claim.example.routing
    text: Alex é útil para o roteamento do ecossistema de exemplo.
    status: supported
    confidence: 0.9
    evidence:
      - kind: maintainer-whois
        sourceId: source.maintainers
        privacyTier: local-private
```
</Accordion>

## Pipeline de compilação

A compilação lê as páginas da wiki, normaliza os resumos e emite artefatos estáveis
voltados para máquinas em:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Os agentes e o código de runtime leem esses resumos em vez de extrair conteúdo do Markdown.
A saída compilada também alimenta a indexação inicial da wiki para busca/acesso, a
consulta de IDs de alegações até as páginas proprietárias, suplementos compactos de prompt e a geração de
relatórios.

## Painéis e relatórios de integridade

Quando `render.createDashboards` está habilitado, a compilação mantém painéis em
`reports/`:

| Relatório                           | Acompanha                                                  |
| ----------------------------------- | ---------------------------------------------------------- |
| `reports/open-questions.md`         | páginas com perguntas não resolvidas                       |
| `reports/contradictions.md`         | agrupamentos de notas de contradição                       |
| `reports/low-confidence.md`         | páginas e alegações com baixa confiança                    |
| `reports/claim-health.md`           | alegações sem evidências estruturadas                      |
| `reports/stale-pages.md`            | páginas desatualizadas ou com atualização desconhecida     |
| `reports/person-agent-directory.md` | cartões de roteamento de pessoas/entidades                  |
| `reports/relationship-graph.md`     | arestas de relacionamentos estruturados                    |
| `reports/provenance-coverage.md`    | cobertura das classes de evidências                        |
| `reports/privacy-review.md`         | níveis de privacidade não públicos que exigem revisão antes do uso |

## Busca e recuperação

Dois backends de busca:

- `shared`: usa o fluxo compartilhado de busca de memória quando disponível
- `local`: pesquisa a wiki localmente

Três corpora: `wiki`, `memory`, `all`.

- `wiki_search` / `wiki_get` usam resumos compilados como primeira passagem quando possível
- IDs de alegações apontam novamente para a página proprietária
- alegações contestadas/desatualizadas/recentes influenciam a classificação
- rótulos de proveniência permanecem nos resultados

Modos de busca (parâmetro `--mode` / `mode` da ferramenta):

| Modo              | Prioriza                                                               |
| ----------------- | ---------------------------------------------------------------------- |
| `auto`            | padrão equilibrado                                                     |
| `find-person`     | entidades semelhantes a pessoas, aliases, identificadores, redes sociais e IDs canônicos |
| `route-question`  | cartões de agentes, dicas de assuntos a consultar/melhor uso e contexto de relacionamentos |
| `source-evidence` | páginas de fontes e metadados de evidências estruturadas               |
| `raw-claim`       | alegações estruturadas correspondentes; retorna metadados de alegações/evidências |

Quando um resultado corresponde a uma alegação estruturada, `wiki_search` retorna
`matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`,
`evidenceKinds` e `evidenceSourceIds` em seu payload de detalhes. A saída de texto
inclui linhas compactas `Claim:` e `Evidence:` quando disponíveis.

## Ferramentas para agentes

| Ferramenta    | Finalidade                                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wiki_status` | modo e escopo atuais do vault, agente resolvido, integridade, disponibilidade da CLI do Obsidian                                                                                    |
| `wiki_search` | pesquisa páginas da wiki e, quando configurado, o corpus de memória compartilhada; aceita `mode` para buscar pessoas, rotear perguntas, obter evidências de fontes ou examinar alegações brutas |
| `wiki_get`    | lê uma página da wiki por id/caminho, recorrendo ao corpus de memória compartilhada quando a pesquisa compartilhada está habilitada e a busca não encontra resultados                |
| `wiki_apply`  | mutações específicas de síntese/metadados sem edição livre da página                                                                                                                |
| `wiki_lint`   | verificações estruturais, lacunas de proveniência, contradições, perguntas em aberto                                                                                                |

O plugin também registra um complemento não exclusivo do corpus de memória, permitindo que
`memory_search` e `memory_get` acessem a wiki quando o plugin de memória ativo
oferece suporte à seleção de corpus.

## Comportamento de prompt e contexto

Quando `context.includeCompiledDigestPrompt` está habilitado, as seções de prompt de memória
acrescentam um snapshot compilado compacto de `agent-digest.json`: somente as principais páginas,
somente as principais alegações, contagem de contradições, contagem de perguntas e qualificadores
de confiança/atualidade. Isso é opcional porque altera o formato do prompt; é relevante principalmente
para mecanismos de contexto ou composição de prompts que consomem explicitamente complementos
de memória.

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
            scope: "global",
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
          unsafeLocal: {
            allowPrivateMemoryCoreAccess: false,
            paths: [],
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

| Chave                                      | Valores / padrão                                | Observações                                                                                              |
| ------------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `vaultMode`                                | `isolated` (padrão), `bridge`, `unsafe-local`   | seleciona o comportamento de entrada e integração                                                        |
| `vault.scope`                              | `global` (padrão), `agent`                      | um vault compartilhado ou um vault filho por agente                                                      |
| `vault.path`                               | padrão global `~/.openclaw/wiki/main`           | vault global exato; o diretório pai no escopo de agente tem como padrão `~/.openclaw/wiki`                |
| `vault.renderMode`                         | `native` (padrão), `obsidian`                   |                                                                                                          |
| `bridge.readMemoryArtifacts`               | padrão `true`                                   | importa artefatos públicos do plugin de memória ativo                                                     |
| `bridge.followMemoryEvents`                | padrão `true`                                   | inclui logs de eventos no modo de ponte                                                                   |
| `unsafeLocal.allowPrivateMemoryCoreAccess` | padrão `false`                                  | obrigatório para executar importações `unsafe-local`                                                      |
| `unsafeLocal.paths`                        | padrão `[]`                                     | caminhos locais explícitos para importar no modo `unsafe-local`                                          |
| `search.backend`                           | `shared` (padrão), `local`                      |                                                                                                          |
| `search.corpus`                            | `wiki` (padrão), `memory`, `all`                |                                                                                                          |
| `context.includeCompiledDigestPrompt`      | padrão `false`                                  | acrescenta o snapshot compacto do resumo do agente selecionado às seções de prompt de memória             |
| `render.createBacklinks`                   | padrão `true`                                   | gera blocos relacionados determinísticos                                                                 |
| `render.createDashboards`                  | padrão `true`                                   | gera páginas de painel                                                                                    |

### Vaults por agente

Defina `vault.scope` como `agent` para fornecer uma wiki separada a cada agente configurado.
Nesse escopo, `vault.path` é um diretório pai, e o OpenClaw acrescenta o
id normalizado do agente:

```json5
{
  agents: {
    list: [{ id: "support" }, { id: "marketing" }],
  },
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
          },
        },
      },
    },
  },
}
```

Isso resulta em `~/.openclaw/wiki/support` e
`~/.openclaw/wiki/marketing`. Se `vault.path` for omitido no escopo de agente, o
diretório pai terá como padrão `~/.openclaw/wiki`. Portanto, o agente `main`
padrão mantém o caminho existente `~/.openclaw/wiki/main`.

As ferramentas do agente, os resumos de prompt compilados e o complemento da wiki exposto por
`memory_search` / `memory_get` resolvem o vault com base no contexto do agente ativo.
Para chamadas da CLI e do Gateway em uma configuração com vários agentes, informe
explicitamente o agente com `openclaw wiki --agent <agentId> ...` ou com o
`agentId` da solicitação do Gateway. Um único agente configurado permanece como padrão quando nenhum id é
fornecido.

No modo de ponte, as importações com escopo de agente aceitam um artefato público de memória somente quando
seu `agentIds` inclui o agente selecionado. Artefatos pertencentes a outro agente,
sem metadados de propriedade ou com proprietário desconhecido são ignorados. O escopo global
mantém o comportamento existente de artefatos compartilhados.

<Warning>
Alterar `vault.scope` não copia nem divide um vault existente. No escopo de agente,
um `vault.path` configurado explicitamente torna-se um diretório pai; portanto, mova ou
importe deliberadamente as páginas existentes antes de migrar agentes de produção. Primeiro, faça
backup do vault.

Vaults por agente constituem um limite de conhecimento no mesmo processo, não um limite de
segurança do sistema operacional. Plugins e ferramentas sem sandbox com acesso ao sistema de arquivos do host ainda podem
ler o diretório de outro agente. Use [sandboxing](/pt-BR/gateway/sandboxing) ou
[perfis separados do Gateway](/pt-BR/gateway/multiple-gateways) quando os agentes não confiarem
uns nos outros.
</Warning>

### Exemplo: QMD + modo de ponte

Use esta configuração quando quiser usar o QMD para recuperação e o `memory-wiki` como uma camada
de conhecimento mantida. Cada camada permanece focada: o QMD mantém notas brutas, exportações
de sessões e coleções adicionais pesquisáveis, enquanto o `memory-wiki` compila
entidades estáveis, alegações, painéis e páginas de fontes.

```json5
{
  memory: {
    backend: "qmd",
  },
  plugins: {
    entries: {
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

Isso mantém o QMD responsável pela recuperação da memória ativa, o `memory-wiki` focado em
páginas compiladas e painéis, e o formato do prompt inalterado até que você
habilite intencionalmente os prompts de resumo compilado.

## CLI

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

Consulte [CLI: wiki](/pt-BR/cli/wiki) para obter a referência completa dos comandos, incluindo
`wiki okf import`, `wiki apply metadata`, `wiki unsafe-local import`,
`wiki chatgpt import` / `wiki chatgpt rollback` e o conjunto completo de subcomandos
`wiki obsidian`.

## Suporte ao Obsidian

Quando `vault.renderMode` é `obsidian`, o plugin grava Markdown compatível com o Obsidian
e pode, opcionalmente, usar a CLI oficial `obsidian` para consultar o status,
pesquisar no vault, abrir uma página, invocar um comando e acessar diretamente a
nota diária. Isso é opcional; a wiki continua funcionando no modo nativo sem o
Obsidian.

Vaults com escopo de agente ainda podem usar Markdown compatível com o Obsidian, mas a validação
da configuração rejeita `obsidian.useOfficialCli: true` com `vault.scope: "agent"`.
A configuração atual `obsidian.vaultName` é global e não pode selecionar um vault
distinto do Obsidian para cada agente. Em vez disso, use as ferramentas da wiki e as operações da CLI,
ou mantenha uma wiki operada pelo Obsidian no escopo global.

## Fluxo de trabalho recomendado

<Steps>
<Step title="Mantenha o plugin de memória ativo para recuperação">
A recuperação, a promoção e o Dreaming continuam sob responsabilidade do backend de memória configurado.
</Step>
<Step title="Habilite o memory-wiki">
Comece com o modo `isolated`, a menos que queira explicitamente o modo de ponte.
</Step>
<Step title="Use wiki_search / wiki_get quando a proveniência for importante">
Prefira-os ao `memory_search` quando quiser classificação específica da wiki ou uma estrutura de crenças no nível da página.
</Step>
<Step title="Use wiki_apply para sínteses específicas ou atualizações de metadados">
Evite editar manualmente blocos gerenciados gerados.
</Step>
<Step title="Execute wiki_lint após alterações significativas">
Detecta contradições, perguntas em aberto e lacunas de proveniência.
</Step>
<Step title="Ative os painéis para visualizar itens desatualizados e contradições">
Defina `render.createDashboards: true` (padrão).
</Step>
</Steps>

## Documentação relacionada

- [Visão geral da memória](/pt-BR/concepts/memory)
- [CLI: memória](/pt-BR/cli/memory)
- [CLI: wiki](/pt-BR/cli/wiki)
- [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview)
