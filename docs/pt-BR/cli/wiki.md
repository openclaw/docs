---
read_when:
    - Você quer usar a CLI memory-wiki
    - Você está documentando ou alterando `openclaw wiki`
summary: Referência da CLI para `openclaw wiki` (status do cofre memory-wiki, busca, compilação, lint, aplicação, ponte e auxiliares do Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-06-27T17:22:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecione e mantenha o cofre `memory-wiki`.

Fornecido pelo plugin `memory-wiki` incluído.

Relacionado:

- [plugin Memory Wiki](/pt-BR/plugins/memory-wiki)
- [Visão geral de memória](/pt-BR/concepts/memory)
- [CLI: memória](/pt-BR/cli/memory)

## Para que serve

Use `openclaw wiki` quando quiser um cofre de conhecimento compilado com:

- busca nativa de wiki e leitura de páginas
- sínteses ricas em proveniência
- relatórios de contradição e atualização
- importações de ponte a partir do plugin de memória ativa
- auxiliares opcionais de CLI do Obsidian

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

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## Comandos

### `wiki status`

Inspecione o modo atual do cofre, sua integridade e a disponibilidade da CLI do Obsidian.

Use isto primeiro quando não tiver certeza se o cofre foi inicializado, se o modo de ponte
está íntegro ou se a integração com o Obsidian está disponível.

Quando o modo de ponte está ativo e configurado para ler artefatos de memória, este comando
consulta o Gateway em execução para ver o mesmo contexto do plugin de memória ativa que a
memória do agente/runtime.

### `wiki doctor`

Execute verificações de integridade da wiki e exponha problemas de configuração ou do cofre.

Quando o modo de ponte está ativo e configurado para ler artefatos de memória, este comando
consulta o Gateway em execução antes de criar o relatório. Importações de ponte desabilitadas
e configurações de ponte que não leem artefatos de memória permanecem locais/offline.

Problemas típicos incluem:

- modo de ponte habilitado sem artefatos públicos de memória
- layout do cofre inválido ou ausente
- CLI externa do Obsidian ausente quando o modo Obsidian é esperado

### `wiki init`

Crie o layout do cofre da wiki e páginas iniciais.

Isto inicializa a estrutura raiz, incluindo índices de nível superior e diretórios
de cache.

### `wiki ingest <path-or-url>`

Importe conteúdo para a camada de fontes da wiki.

Observações:

- a ingestão de URL é controlada por `ingest.allowUrlIngest`
- páginas de fonte importadas mantêm a proveniência nos metadados iniciais
- a compilação automática pode ser executada após a ingestão quando habilitada

### `wiki okf import <path>`

Importe um pacote Open Knowledge Format descompactado para páginas de conceitos da wiki.

O importador lê todos os documentos de conceito `.md` não reservados na árvore de
diretórios OKF, exige um campo `type` não vazio e trata valores OKF `type`
desconhecidos como conceitos genéricos. Arquivos OKF reservados `index.md` e `log.md`
não são importados como conceitos.

As páginas importadas são achatadas em `concepts/` para que os fluxos existentes de compilação,
busca, leitura, resumo e painel da wiki as vejam imediatamente. O ID de conceito OKF
original, `type`, `resource`, `tags`, carimbo de data/hora, caminho de origem e todos os
metadados iniciais são preservados nos metadados iniciais da página. Links markdown OKF
internos são reescritos para as páginas de wiki geradas; links quebrados ou externos ficam
inalterados.

Exemplos:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

Recrie índices, blocos relacionados, painéis e resumos compilados.

Isto grava artefatos estáveis voltados a máquinas em:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Se `render.createDashboards` estiver habilitado, a compilação também atualiza páginas de relatório.

### `wiki lint`

Analise o cofre e relate:

- problemas estruturais
- lacunas de proveniência
- contradições
- perguntas em aberto
- páginas/reivindicações de baixa confiança
- páginas/reivindicações desatualizadas

Execute isto após atualizações significativas na wiki.

### `wiki search <query>`

Pesquise conteúdo da wiki.

O comportamento depende da configuração:

- `search.backend`: `shared` ou `local`
- `search.corpus`: `wiki`, `memory` ou `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` ou
  `raw-claim`

Use `wiki search` quando quiser classificação ou detalhes de proveniência específicos da wiki.
Para uma passagem ampla de recuperação compartilhada, prefira `openclaw memory search` quando o
plugin de memória ativa expuser busca compartilhada.

Os modos de busca ajudam o agente a escolher a superfície correta:

- `find-person`: aliases, identificadores, redes sociais, IDs canônicos e páginas de pessoa
- `route-question`: dicas de quem consultar/para que usar melhor e contexto de relacionamento
- `source-evidence`: páginas de fonte e campos de evidência estruturada
- `raw-claim`: texto de reivindicação estruturada com metadados de reivindicação/evidência

Exemplos:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

A saída em texto inclui linhas `Claim:` e `Evidence:` quando um resultado corresponde a uma
reivindicação estruturada. A saída JSON também expõe `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` e
`evidenceSourceIds` para investigação pelo agente.

### `wiki get <lookup>`

Leia uma página da wiki por ID ou caminho relativo.

Exemplos:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Aplique mutações restritas sem intervenções livres na página.

Os fluxos compatíveis incluem:

- criar/atualizar uma página de síntese
- atualizar metadados da página
- anexar IDs de fonte
- adicionar perguntas
- adicionar contradições
- atualizar confiança/status
- gravar reivindicações estruturadas

Este comando existe para que a wiki possa evoluir com segurança sem editar manualmente
blocos gerenciados.

### `wiki bridge import`

Importe artefatos públicos de memória do plugin de memória ativa para páginas de fonte
baseadas em ponte.

Use isto no modo `bridge` quando quiser puxar os artefatos de memória exportados mais recentes
para o cofre da wiki.

Para leituras ativas de artefatos de ponte, a CLI encaminha a importação por RPC do Gateway
para que a importação use o contexto do plugin de memória em runtime. Se importações de ponte
estiverem desabilitadas ou leituras de artefatos estiverem desligadas, o comando mantém o
comportamento local/offline de importação zero.

### `wiki unsafe-local import`

Importe de caminhos locais configurados explicitamente no modo `unsafe-local`.

Isto é intencionalmente experimental e restrito à mesma máquina.

### `wiki obsidian ...`

Comandos auxiliares do Obsidian para cofres executados em modo compatível com Obsidian.

Subcomandos:

- `status`
- `search`
- `open`
- `command`
- `daily`

Eles exigem a CLI oficial `obsidian` no `PATH` quando
`obsidian.useOfficialCli` está habilitado.

## Orientações práticas de uso

- Use `wiki search` + `wiki get` quando proveniência e identidade da página importam.
- Use `wiki apply` em vez de editar manualmente seções geradas gerenciadas.
- Use `wiki lint` antes de confiar em conteúdo contraditório ou de baixa confiança.
- Use `wiki compile` após importações em massa ou alterações de fonte quando quiser painéis
  e resumos compilados atualizados imediatamente.
- Use `wiki okf import` quando um catálogo de dados, exportação de documentação ou pipeline
  de enriquecimento de agente já emitir pacotes markdown OKF.
- Use `wiki bridge import` quando o modo de ponte depender de artefatos de memória recém-exportados.

## Vínculos de configuração

O comportamento de `openclaw wiki` é moldado por:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consulte [plugin Memory Wiki](/pt-BR/plugins/memory-wiki) para ver o modelo completo de configuração.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Wiki de memória](/pt-BR/plugins/memory-wiki)
