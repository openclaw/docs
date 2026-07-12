---
read_when:
    - Você quer usar a CLI memory-wiki
    - Você está documentando ou alterando `openclaw wiki`
summary: Referência da CLI para `openclaw wiki` (status do cofre memory-wiki, pesquisa, compilação, lint, aplicação, bridge, importação do ChatGPT e auxiliares do Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-07-11T23:51:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecione e mantenha o cofre `memory-wiki`. Fornecido pelo plugin `memory-wiki` incluído.

Relacionado: [Plugin Memory Wiki](/pt-BR/plugins/memory-wiki), [Visão geral da memória](/pt-BR/concepts/memory), [CLI: memória](/pt-BR/cli/memory)

## Comandos comuns

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Seleção de agente

Quando `plugins.entries.memory-wiki.config.vault.scope` for `agent`, selecione o
cofre com a opção de nível superior `--agent <id>`:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

Em uma configuração com vários agentes configurados, `--agent` é obrigatório para operações da CLI, para que um comando não possa ler nem gravar em um cofre padrão arbitrário. Se apenas um agente estiver configurado, esse agente continuará sendo o padrão. IDs de agente desconhecidos causam falha antes do início da operação no cofre. A opção não altera o caminho selecionado quando `vault.scope` é `global`.

Os clientes do Gateway seguem a mesma regra: transmita `agentId` nas solicitações `wiki.*` baseadas em cofre em uma configuração multiagente com escopo por agente. Um ID ausente ou desconhecido é um erro. Turnos de agentes, ferramentas da wiki, complementos do corpus de memória e resumos compilados de prompts já carregam o contexto do agente ativo em tempo de execução.

## Comandos

### `wiki status`

Exiba o modo e o escopo do cofre, o agente resolvido, a integridade e a disponibilidade da CLI do Obsidian. Use este comando primeiro para verificar se o cofre pretendido foi inicializado, se o modo de ponte está íntegro ou se a integração com o Obsidian está disponível.

Quando o modo de ponte está ativo e configurado para ler artefatos de memória, este comando consulta o Gateway em execução para acessar o mesmo contexto ativo do plugin de memória usado pela memória do agente e do ambiente de execução.

### `wiki doctor`

Execute verificações de integridade da wiki e informe correções práticas. Encerra com código diferente de zero quando não está íntegra.

Quando o modo de ponte está ativo e configurado para ler artefatos de memória, este comando consulta o Gateway em execução antes de gerar o relatório. Importações de ponte desabilitadas e configurações de ponte que não leem artefatos de memória permanecem locais e offline.

Problemas típicos:

- modo de ponte habilitado sem artefatos públicos de memória
- layout do cofre inválido ou ausente
- CLI externa do Obsidian ausente quando o modo Obsidian é esperado

### `wiki init`

Crie o layout do cofre da wiki e as páginas iniciais, incluindo índices de nível superior e diretórios de cache.

### `wiki ingest <path>`

Importe um arquivo Markdown ou de texto local para a pasta `sources/` da wiki como uma página de origem. `<path>` deve ser um caminho de arquivo local; atualmente, não há ingestão por URL. Rejeita arquivos binários.

As páginas de origem importadas contêm frontmatter de proveniência (`sourceType: local-file`, `sourcePath`, `ingestedAt`). A ingestão sempre recompila o cofre em seguida.

Opções: `--title <title>` substitui o título da origem (padrão: derivado do nome do arquivo).

### `wiki okf import <path>`

Importe um pacote descompactado no Open Knowledge Format para páginas de conceitos da wiki.

O importador lê todos os documentos de conceito `.md` não reservados na árvore de diretórios OKF, exige um campo `type` não vazio e trata valores desconhecidos de `type` do OKF como conceitos genéricos. Os arquivos reservados `index.md` e `log.md` do OKF não são importados como conceitos.

As páginas importadas são niveladas em `concepts/`, para que os fluxos existentes de compilação, pesquisa, obtenção, resumo e painel da wiki as acessem imediatamente. O ID original do conceito OKF, `type`, `resource`, `tags`, carimbo de data e hora, caminho de origem e frontmatter completo são preservados no frontmatter da página. Os links Markdown internos do OKF são reescritos para as páginas geradas da wiki; links quebrados ou externos permanecem inalterados. A importação sempre recompila o cofre em seguida.

Exemplos:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Recrie índices, blocos relacionados, painéis e resumos compilados. Grava artefatos estáveis voltados para máquinas em:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Se `render.createDashboards` estiver habilitado, a compilação também atualizará as páginas de relatório.

### `wiki lint`

Verifique o cofre e grave um relatório que abranja:

- problemas estruturais (links quebrados, IDs ausentes ou duplicados, tipo ou título da página ausente, frontmatter inválido)
- lacunas de proveniência (IDs de origem ausentes, proveniência de importação ausente)
- contradições (contradições sinalizadas, alegações conflitantes)
- perguntas em aberto
- páginas e alegações com baixa confiança
- páginas e alegações desatualizadas

Execute este comando após atualizações relevantes da wiki.

### `wiki search <query>`

Pesquise o conteúdo da wiki. O comportamento depende da configuração:

- `search.backend`: `shared` ou `local`
- `search.corpus`: `wiki`, `memory` ou `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` ou `raw-claim`

Use `wiki search` para classificação e proveniência específicas da wiki. Para uma única consulta ampla à memória compartilhada, prefira `openclaw memory search` quando o plugin de memória ativo disponibilizar pesquisa compartilhada.

Modos de pesquisa:

- `find-person`: aliases, identificadores, perfis sociais, IDs canônicos e páginas de pessoas
- `route-question`: indicações de quem consultar, de melhor uso e contexto de relacionamentos
- `source-evidence`: páginas de origem e campos de evidências estruturadas
- `raw-claim`: texto estruturado da alegação com metadados da alegação e das evidências

Exemplos:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

A saída de texto inclui linhas `Claim:` e `Evidence:` quando um resultado corresponde a uma alegação estruturada. A saída JSON também expõe `matchedClaimId`, `matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` e `evidenceSourceIds` para análise detalhada pelo agente.

### `wiki get <lookup>`

Leia uma página da wiki por ID ou caminho relativo.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Aplique alterações específicas sem edição livre da página:

- `apply synthesis <title>`: crie ou atualize uma página de síntese com um corpo de resumo gerenciado
- `apply metadata <lookup>`: atualize os metadados de uma página existente

Ambos aceitam `--source-id`, `--contradiction`, `--question` (cada um pode ser repetido), `--confidence <n>` (0–1) e `--status <status>`. `apply metadata` também aceita `--clear-confidence` para remover um valor de confiança armazenado. Essa é a maneira compatível de evoluir as páginas da wiki sem alterar os blocos gerados e gerenciados.

### `wiki bridge import`

Importe artefatos públicos de memória do plugin de memória ativo para páginas de origem baseadas em ponte. Use este comando no modo `bridge` para trazer os artefatos de memória exportados mais recentes para o cofre da wiki.

Para leituras ativas de artefatos pela ponte, a CLI encaminha a importação por RPC do Gateway, usando assim o contexto do plugin de memória do ambiente de execução. Se as importações da ponte estiverem desabilitadas ou as leituras de artefatos estiverem desativadas, o comando manterá o comportamento local e offline de zero importações. A atualização do índice após a importação é controlada por `ingest.autoCompile`.

### `wiki unsafe-local import`

Importe de caminhos locais configurados explicitamente (`unsafeLocal.paths`) no modo `unsafe-local`. Intencionalmente experimental e restrito à mesma máquina. A atualização do índice após a importação é controlada por `ingest.autoCompile`.

### `wiki chatgpt import`

Importe uma exportação do ChatGPT para páginas de origem em rascunho da wiki.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| Opção             | Padrão        | Descrição                                                                    |
| ----------------- | ------------- | ---------------------------------------------------------------------------- |
| `--export <path>` | (obrigatório) | Diretório de exportação do ChatGPT ou caminho de `conversations.json`.       |
| `--dry-run`       | `false`       | Visualize contagens de itens criados, atualizados e ignorados sem gravar páginas. |

Uma importação que não seja de simulação e altere alguma página registra um ID de execução da importação, exibido no resumo e necessário para a reversão.

### `wiki chatgpt rollback <run-id>`

Reverta uma execução de importação do ChatGPT aplicada anteriormente, removendo as páginas que ela criou e restaurando as páginas que sobrescreveu. Não realiza nenhuma operação (e informa `alreadyRolledBack`) se a execução já tiver sido revertida.

### `wiki obsidian ...`

Comandos auxiliares do Obsidian para cofres executados no modo compatível com o Obsidian: `status`, `search`, `open`, `command`, `daily`. Eles exigem a CLI oficial `obsidian` em `PATH` quando `obsidian.useOfficialCli` está habilitado.

A validação da configuração rejeita `obsidian.useOfficialCli: true` quando
`vault.scope` é `agent`, pois `obsidian.vaultName` é uma única configuração global,
e não um mapeamento por agente. A renderização de Markdown compatível com o
Obsidian continua disponível.

## Orientações práticas de uso

- Use `wiki search` + `wiki get` quando a proveniência e a identidade da página forem importantes.
- Use `wiki apply` em vez de editar manualmente seções geradas e gerenciadas.
- Use `wiki lint` antes de confiar em conteúdo contraditório ou com baixa confiança.
- Use `wiki compile` após importações em massa ou alterações nas origens quando quiser painéis e resumos compilados atualizados imediatamente.
- Use `wiki okf import` quando um catálogo de dados, uma exportação de documentação ou um pipeline de enriquecimento de agentes já gerar pacotes Markdown do OKF.
- Use `wiki bridge import` quando o modo de ponte depender de artefatos de memória recém-exportados.

## Integrações com a configuração

O comportamento de `openclaw wiki` é determinado por:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consulte [Plugin Memory Wiki](/pt-BR/plugins/memory-wiki) para ver o modelo completo de configuração.

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Wiki de memória](/pt-BR/plugins/memory-wiki)
