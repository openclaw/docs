---
read_when:
    - Você quer usar a CLI do memory-wiki
    - Você está documentando ou alterando `openclaw wiki`
summary: Referência da CLI para `openclaw wiki` (status, search, compile, lint, apply e bridge do cofre memory-wiki, além de auxiliares do Obsidian)
title: wiki
x-i18n:
    generated_at: "2026-04-23T14:02:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e94908532c35da4edf488266ddc6eee06e8f7833eeba5f2b5c0c7d5d45b65eef
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

Inspecione e mantenha o cofre `memory-wiki`.

Fornecido pelo plugin integrado `memory-wiki`.

Relacionado:

- [Plugin Memory Wiki](/pt-BR/plugins/memory-wiki)
- [Visão geral da memória](/pt-BR/concepts/memory)
- [CLI: memory](/pt-BR/cli/memory)

## Para que serve

Use `openclaw wiki` quando quiser um cofre de conhecimento compilado com:

- pesquisa nativa da wiki e leitura de páginas
- sínteses ricas em procedência
- relatórios de contradição e atualização
- imports por bridge a partir do plugin de memória ativo
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

Inspeciona o modo atual do cofre, a integridade e a disponibilidade da CLI do Obsidian.

Use isto primeiro quando você não tiver certeza se o cofre foi inicializado, se o modo bridge
está íntegro ou se a integração com o Obsidian está disponível.

### `wiki doctor`

Executa verificações de integridade da wiki e mostra problemas de configuração ou do cofre.

Problemas típicos incluem:

- modo bridge habilitado sem artefatos públicos de memória
- layout do cofre inválido ou ausente
- CLI externa do Obsidian ausente quando o modo Obsidian é esperado

### `wiki init`

Cria o layout do cofre da wiki e as páginas iniciais.

Isso inicializa a estrutura raiz, incluindo índices de nível superior e
diretórios de cache.

### `wiki ingest <path-or-url>`

Importa conteúdo para a camada de fontes da wiki.

Observações:

- a ingestão por URL é controlada por `ingest.allowUrlIngest`
- páginas de fonte importadas mantêm a procedência no frontmatter
- a compilação automática pode ser executada após a ingestão quando habilitada

### `wiki compile`

Reconstrói índices, blocos relacionados, dashboards e resumos compilados.

Isso grava artefatos estáveis voltados para máquinas em:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

Se `render.createDashboards` estiver habilitado, `compile` também atualiza páginas de relatório.

### `wiki lint`

Executa lint no cofre e relata:

- problemas estruturais
- lacunas de procedência
- contradições
- questões em aberto
- páginas/afirmações com baixa confiança
- páginas/afirmações desatualizadas

Execute isto após atualizações relevantes na wiki.

### `wiki search <query>`

Pesquisa conteúdo da wiki.

O comportamento depende da configuração:

- `search.backend`: `shared` ou `local`
- `search.corpus`: `wiki`, `memory` ou `all`

Use `wiki search` quando quiser classificação específica da wiki ou detalhes de procedência.
Para uma única passagem ampla de recall compartilhado, prefira `openclaw memory search` quando o
plugin de memória ativo expuser pesquisa compartilhada.

### `wiki get <lookup>`

Lê uma página da wiki por ID ou caminho relativo.

Exemplos:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

Aplica mutações pontuais sem cirurgia manual livre em páginas.

Os fluxos compatíveis incluem:

- criar/atualizar uma página de síntese
- atualizar metadados de página
- anexar IDs de fonte
- adicionar questões
- adicionar contradições
- atualizar confiança/status
- gravar afirmações estruturadas

Esse comando existe para que a wiki possa evoluir com segurança sem editar manualmente
blocos gerenciados.

### `wiki bridge import`

Importa artefatos públicos de memória do plugin de memória ativo para páginas de fonte
baseadas em bridge.

Use isto no modo `bridge` quando quiser trazer para o cofre da wiki os artefatos de memória
exportados mais recentes.

### `wiki unsafe-local import`

Importa de caminhos locais configurados explicitamente no modo `unsafe-local`.

Isto é intencionalmente experimental e apenas para a mesma máquina.

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

- Use `wiki search` + `wiki get` quando procedência e identidade de página importarem.
- Use `wiki apply` em vez de editar manualmente seções geradas e gerenciadas.
- Use `wiki lint` antes de confiar em conteúdo contraditório ou com baixa confiança.
- Use `wiki compile` após imports em massa ou alterações em fontes quando quiser dashboards
  e resumos compilados atualizados imediatamente.
- Use `wiki bridge import` quando o modo bridge depender de artefatos de memória
  recém-exportados.

## Integrações com a configuração

O comportamento de `openclaw wiki` é moldado por:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

Veja [plugin Memory Wiki](/pt-BR/plugins/memory-wiki) para o modelo completo de configuração.
