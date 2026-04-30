---
read_when:
    - Você quer usar a CLI memory-wiki
    - Você está documentando ou alterando `openclaw wiki`
summary: Referência da CLI para `openclaw wiki` (status do cofre memory-wiki, search, compile, lint, apply, bridge e auxiliares do Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-30T09:43:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

Inspecione e mantenha o cofre `memory-wiki`.

Fornecido pelo Plugin `memory-wiki` incluído.

Relacionado:

- [Plugin Memory Wiki](/pt-BR/plugins/memory-wiki)
- [Visão geral de memória](/pt-BR/concepts/memory)
- [CLI: memory](/pt-BR/cli/memory)

## Para que serve

Use `openclaw wiki` quando quiser um cofre de conhecimento compilado com:

- busca nativa de wiki e leitura de páginas
- sínteses ricas em proveniência
- relatórios de contradição e atualização
- importações de ponte a partir do Plugin de memória ativa
- auxiliares opcionais da CLI do Obsidian

## Comandos comuns

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
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
está saudável ou se a integração com o Obsidian está disponível.

Quando o modo de ponte está ativo e configurado para ler artefatos de memória, este comando
consulta o Gateway em execução para que ele veja o mesmo contexto do Plugin de memória ativa que a
memória do agente/runtime.

### `wiki doctor`

Execute verificações de integridade da wiki e exponha problemas de configuração ou do cofre.

Quando o modo de ponte está ativo e configurado para ler artefatos de memória, este comando
consulta o Gateway em execução antes de criar o relatório. Importações de ponte desativadas
e configurações de ponte que não leem artefatos de memória permanecem locais/offline.

Problemas típicos incluem:

- modo de ponte habilitado sem artefatos públicos de memória
- layout do cofre inválido ou ausente
- CLI externa do Obsidian ausente quando o modo Obsidian é esperado

### `wiki init`

Crie o layout do cofre da wiki e páginas iniciais.

Isso inicializa a estrutura raiz, incluindo índices de nível superior e diretórios
de cache.

### `wiki ingest <path-or-url>`

Importe conteúdo para a camada de fontes da wiki.

Observações:

- a ingestão por URL é controlada por `ingest.allowUrlIngest`
- páginas de fonte importadas mantêm a proveniência no frontmatter
- a compilação automática pode ser executada após a ingestão quando habilitada

### `wiki compile`

Reconstrua índices, blocos relacionados, dashboards e resumos compilados.

Isso grava artefatos estáveis voltados para máquina em:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Se `render.createDashboards` estiver habilitado, a compilação também atualiza páginas de relatório.

### `wiki lint`

Faça lint do cofre e relate:

- problemas estruturais
- lacunas de proveniência
- contradições
- perguntas em aberto
- páginas/declarações de baixa confiança
- páginas/declarações desatualizadas

Execute isto após atualizações significativas da wiki.

### `wiki search <query>`

Pesquise conteúdo da wiki.

O comportamento depende da configuração:

- `search.backend`: `shared` ou `local`
- `search.corpus`: `wiki`, `memory` ou `all`
- `--mode`: `auto`, `find-person`, `route-question`, `source-evidence` ou
  `raw-claim`

Use `wiki search` quando quiser ranqueamento específico da wiki ou detalhes de proveniência.
Para uma única passagem ampla de recuperação compartilhada, prefira `openclaw memory search` quando o
Plugin de memória ativa expuser a busca compartilhada.

Os modos de busca ajudam o agente a escolher a superfície correta:

- `find-person`: aliases, handles, redes sociais, IDs canônicos e páginas de pessoas
- `route-question`: dicas de quem perguntar/melhor uso e contexto de relacionamento
- `source-evidence`: páginas de fonte e campos de evidência estruturada
- `raw-claim`: texto de declaração estruturado com metadados de declaração/evidência

Exemplos:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

A saída de texto inclui linhas `Claim:` e `Evidence:` quando um resultado corresponde a uma
declaração estruturada. A saída JSON também expõe `matchedClaimId`,
`matchedClaimStatus`, `matchedClaimConfidence`, `evidenceKinds` e
`evidenceSourceIds` para aprofundamento do lado do agente.

### `wiki get <lookup>`

Leia uma página da wiki por id ou caminho relativo.

Exemplos:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Aplique mutações estreitas sem cirurgia livre de páginas.

Fluxos compatíveis incluem:

- criar/atualizar uma página de síntese
- atualizar metadados de página
- anexar ids de fonte
- adicionar perguntas
- adicionar contradições
- atualizar confiança/status
- gravar declarações estruturadas

Este comando existe para que a wiki possa evoluir com segurança sem editar manualmente
blocos gerenciados.

### `wiki bridge import`

Importe artefatos públicos de memória do Plugin de memória ativa para páginas de fonte
com suporte por ponte.

Use isto no modo `bridge` quando quiser que os artefatos de memória exportados mais recentes
sejam trazidos para o cofre da wiki.

Para leituras ativas de artefatos de ponte, a CLI encaminha a importação por RPC do Gateway
para que a importação use o contexto do Plugin de memória em runtime. Se as importações de ponte estiverem
desativadas ou as leituras de artefatos estiverem desligadas, o comando mantém o comportamento local/offline
de importação zero.

### `wiki unsafe-local import`

Importe de caminhos locais configurados explicitamente no modo `unsafe-local`.

Isto é intencionalmente experimental e apenas para a mesma máquina.

### `wiki obsidian ...`

Comandos auxiliares do Obsidian para cofres executados em modo compatível com Obsidian.

Subcomandos:

- `status`
- `search`
- `open`
- `command`
- `daily`

Eles exigem a CLI oficial `obsidian` em `PATH` quando
`obsidian.useOfficialCli` está habilitado.

## Orientação prática de uso

- Use `wiki search` + `wiki get` quando proveniência e identidade de página importarem.
- Use `wiki apply` em vez de editar manualmente seções geradas gerenciadas.
- Use `wiki lint` antes de confiar em conteúdo contraditório ou de baixa confiança.
- Use `wiki compile` após importações em massa ou alterações de fonte quando quiser dashboards
  e resumos compilados atualizados imediatamente.
- Use `wiki bridge import` quando o modo de ponte depender de artefatos de memória
  recém-exportados.

## Vínculos de configuração

O comportamento de `openclaw wiki` é moldado por:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consulte [Plugin Memory Wiki](/pt-BR/plugins/memory-wiki) para ver o modelo de configuração completo.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Wiki de memória](/pt-BR/plugins/memory-wiki)
