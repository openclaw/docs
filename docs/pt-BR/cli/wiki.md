---
read_when:
    - Você quer usar a CLI do memory-wiki
    - Você está documentando ou alterando `openclaw wiki`
summary: Referência da CLI para `openclaw wiki` (status do cofre do memory-wiki, pesquisar, compilar, lint, aplicar, bridge e helpers do Obsidian)
title: Wiki
x-i18n:
    generated_at: "2026-04-24T05:47:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: c25f7046ef0c29ed74204a5349edc2aa20ce79a355f49211a0ba0df4a5e4db3a
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Inspecione e mantenha o cofre `memory-wiki`.

Fornecido pelo Plugin empacotado `memory-wiki`.

Relacionado:

- [Plugin Memory Wiki](/pt-BR/plugins/memory-wiki)
- [Visão geral da memória](/pt-BR/concepts/memory)
- [CLI: memory](/pt-BR/cli/memory)

## Para que serve

Use `openclaw wiki` quando quiser um cofre de conhecimento compilado com:

- pesquisa nativa de wiki e leitura de páginas
- sínteses ricas em proveniência
- relatórios de contradição e atualidade
- importações por bridge a partir do Plugin de memória ativo
- helpers opcionais da CLI do Obsidian

## Comandos comuns

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
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

Inspecione o modo atual do cofre, a integridade e a disponibilidade da CLI do Obsidian.

Use isto primeiro quando não tiver certeza se o cofre está inicializado, se o modo bridge
está íntegro ou se a integração com Obsidian está disponível.

### `wiki doctor`

Execute verificações de integridade da wiki e exponha problemas de configuração ou do cofre.

Problemas típicos incluem:

- modo bridge ativado sem artefatos públicos de memória
- layout de cofre inválido ou ausente
- CLI externa do Obsidian ausente quando o modo Obsidian é esperado

### `wiki init`

Crie o layout do cofre da wiki e páginas iniciais.

Isso inicializa a estrutura raiz, incluindo índices de nível superior e diretórios
de cache.

### `wiki ingest <path-or-url>`

Importe conteúdo para a camada de origem da wiki.

Observações:

- a importação por URL é controlada por `ingest.allowUrlIngest`
- páginas de origem importadas mantêm a proveniência no frontmatter
- a compilação automática pode ser executada após a importação, quando ativada

### `wiki compile`

Reconstrua índices, blocos relacionados, painéis e resumos compilados.

Isso grava artefatos estáveis voltados para máquina em:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Se `render.createDashboards` estiver ativado, a compilação também atualiza páginas de relatório.

### `wiki lint`

Valide o cofre e relate:

- problemas estruturais
- lacunas de proveniência
- contradições
- questões em aberto
- páginas/alegações de baixa confiança
- páginas/alegações desatualizadas

Execute isso após atualizações significativas da wiki.

### `wiki search <query>`

Pesquise conteúdo da wiki.

O comportamento depende da configuração:

- `search.backend`: `shared` ou `local`
- `search.corpus`: `wiki`, `memory` ou `all`

Use `wiki search` quando quiser classificação específica da wiki ou detalhes de proveniência.
Para uma única passada ampla de recuperação compartilhada, prefira `openclaw memory search` quando o
Plugin de memória ativo expuser pesquisa compartilhada.

### `wiki get <lookup>`

Leia uma página da wiki por id ou caminho relativo.

Exemplos:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Aplique mutações restritas sem cirurgia livre na página.

Os fluxos compatíveis incluem:

- criar/atualizar uma página de síntese
- atualizar metadados da página
- anexar ids de origem
- adicionar perguntas
- adicionar contradições
- atualizar confiança/status
- gravar alegações estruturadas

Esse comando existe para que a wiki possa evoluir com segurança sem editar manualmente
blocos gerenciados.

### `wiki bridge import`

Importe artefatos públicos de memória do Plugin de memória ativo para páginas de
origem com suporte a bridge.

Use isso no modo `bridge` quando quiser que os artefatos de memória exportados mais recentes
sejam trazidos para o cofre da wiki.

### `wiki unsafe-local import`

Importe de caminhos locais explicitamente configurados no modo `unsafe-local`.

Isso é intencionalmente experimental e apenas para a mesma máquina.

### `wiki obsidian ...`

Comandos helper do Obsidian para cofres executados em modo compatível com Obsidian.

Subcomandos:

- `status`
- `search`
- `open`
- `command`
- `daily`

Eles exigem a CLI oficial `obsidian` no `PATH` quando
`obsidian.useOfficialCli` está ativado.

## Orientações práticas de uso

- Use `wiki search` + `wiki get` quando proveniência e identidade da página importarem.
- Use `wiki apply` em vez de editar manualmente seções geradas gerenciadas.
- Use `wiki lint` antes de confiar em conteúdo contraditório ou de baixa confiança.
- Use `wiki compile` após importações em massa ou alterações de origem quando quiser
  painéis e resumos compilados atualizados imediatamente.
- Use `wiki bridge import` quando o modo bridge depender de artefatos de memória
  exportados recentemente.

## Relação com a configuração

O comportamento de `openclaw wiki` é moldado por:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Consulte [Plugin Memory Wiki](/pt-BR/plugins/memory-wiki) para o modelo completo de configuração.

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Memory wiki](/pt-BR/plugins/memory-wiki)
