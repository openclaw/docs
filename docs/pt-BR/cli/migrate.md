---
read_when:
    - Você quer migrar do Hermes ou de outro sistema de agentes para o OpenClaw
    - Você está adicionando um provedor de migração pertencente ao Plugin
summary: Referência da CLI para `openclaw migrate` (importar estado de outro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-05-12T23:30:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importe estado de outro sistema de agentes por meio de um provedor de migração pertencente a um plugin. Os provedores incluídos cobrem o estado da CLI do Codex, [Claude](/pt-BR/install/migrating-claude) e [Hermes](/pt-BR/install/migrating-hermes); plugins de terceiros podem registrar provedores adicionais.

<Tip>
Para guias passo a passo voltados ao usuário, consulte [Migrando do Claude](/pt-BR/install/migrating-claude) e [Migrando do Hermes](/pt-BR/install/migrating-hermes). O [hub de migração](/pt-BR/install/migrating) lista todos os caminhos.
</Tip>

## Comandos

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  Nome de um provedor de migração registrado, por exemplo `hermes`. Execute `openclaw migrate list` para ver os provedores instalados.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Cria o plano e sai sem alterar o estado.
</ParamField>
<ParamField path="--from <path>" type="string">
  Substitui o diretório de estado de origem. O padrão do Hermes é `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa credenciais compatíveis. Desativado por padrão.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permite que a aplicação substitua destinos existentes quando o plano reporta conflitos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignora a solicitação de confirmação. Obrigatório no modo não interativo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Seleciona um item de cópia de skill pelo nome da skill ou pelo id do item. Repita a flag para migrar várias skills. Quando omitida, migrações interativas do Codex mostram um seletor de caixas de seleção, e migrações não interativas mantêm todas as skills planejadas.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Seleciona um item de instalação de plugin do Codex pelo nome do plugin ou pelo id do item. Repita a flag para migrar vários plugins do Codex. Quando omitida, migrações interativas do Codex mostram um seletor nativo de caixas de seleção de plugins do Codex, e migrações não interativas mantêm todos os plugins planejados. Isso se aplica apenas a plugins do Codex `openai-curated` instalados na origem e descobertos pelo inventário do app-server do Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Somente Codex. Força uma nova travessia `app/list` do app-server do Codex de origem antes de planejar a ativação de plugin nativo. Desativado por padrão para manter o planejamento da migração rápido.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignora o backup pré-aplicação. Requer `--force` quando existe estado local do OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Obrigatório junto com `--no-backup` quando a aplicação recusaria ignorar o backup.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime o plano ou o resultado da aplicação como JSON. Com `--json` e sem `--yes`, a aplicação imprime o plano e não altera o estado.
</ParamField>

## Modelo de segurança

`openclaw migrate` prioriza a pré-visualização.

<AccordionGroup>
  <Accordion title="Pré-visualizar antes de aplicar">
    O provedor retorna um plano itemizado antes de qualquer alteração, incluindo conflitos, itens ignorados e itens sensíveis. Planos JSON, saída de aplicação e relatórios de migração redigem chaves aninhadas com aparência de segredo, como chaves de API, tokens, cabeçalhos de autorização, cookies e senhas.

    `openclaw migrate apply <provider>` pré-visualiza o plano e solicita confirmação antes de alterar o estado, a menos que `--yes` esteja definido. No modo não interativo, a aplicação requer `--yes`.

  </Accordion>
  <Accordion title="Backups">
    A aplicação cria e verifica um backup do OpenClaw antes de aplicar a migração. Se ainda não existir estado local do OpenClaw, a etapa de backup é ignorada e a migração pode continuar. Para ignorar um backup quando existe estado, passe `--no-backup` e `--force`.
  </Accordion>
  <Accordion title="Conflitos">
    A aplicação se recusa a continuar quando o plano tem conflitos. Revise o plano e execute novamente com `--overwrite` se substituir destinos existentes for intencional. Os provedores ainda podem gravar backups em nível de item para arquivos sobrescritos no diretório do relatório de migração.
  </Accordion>
  <Accordion title="Segredos">
    Segredos nunca são importados por padrão. Use `--include-secrets` para importar credenciais compatíveis.
  </Accordion>
</AccordionGroup>

## Provedor Claude

O provedor Claude incluído detecta o estado do Claude Code em `~/.claude` por padrão. Use `--from <path>` para importar um diretório inicial ou raiz de projeto específico do Claude Code.

<Tip>
Para um guia passo a passo voltado ao usuário, consulte [Migrando do Claude](/pt-BR/install/migrating-claude).
</Tip>

### O que o Claude importa

- `CLAUDE.md` do projeto e `.claude/CLAUDE.md` para o workspace do agente OpenClaw.
- `~/.claude/CLAUDE.md` do usuário anexado ao `USER.md` do workspace.
- Definições de servidor MCP de `.mcp.json` do projeto, Claude Code `~/.claude.json` e Claude Desktop `claude_desktop_config.json`.
- Diretórios de skills do Claude que incluem `SKILL.md`.
- Arquivos Markdown de comandos do Claude convertidos em skills do OpenClaw apenas com invocação manual.

### Estado de arquivo e revisão manual

Hooks, permissões, padrões de ambiente, memória local, regras com escopo de caminho, subagentes, caches, planos e histórico de projeto do Claude são preservados no relatório de migração ou reportados como itens de revisão manual. O OpenClaw não executa hooks, não copia allowlists amplas nem importa automaticamente o estado de credenciais OAuth/Desktop.

## Provedor Codex

O provedor Codex incluído detecta o estado da CLI do Codex em `~/.codex` por padrão, ou
em `CODEX_HOME` quando essa variável de ambiente está definida. Use `--from <path>` para
inventariar um diretório inicial específico do Codex.

Use este provedor ao migrar para o harness Codex do OpenClaw e quando quiser
promover ativos pessoais úteis da CLI do Codex deliberadamente. Inicializações locais do app-server do Codex
usam diretórios `CODEX_HOME` e `HOME` por agente, então não leem
seu estado pessoal da CLI do Codex por padrão.

Executar `openclaw migrate codex` em um terminal interativo pré-visualiza o plano
completo e, em seguida, abre seletores de caixas de seleção antes da confirmação final de aplicação. Itens de cópia de skill
são solicitados primeiro. Use `Toggle all on` ou `Toggle all off` para seleção
em massa. Pressione Espaço para alternar linhas, ou pressione Enter para ativar a linha
destacada e continuar. Skills planejadas começam marcadas, skills em conflito começam desmarcadas, e
`Skip for now` ignora cópias de skills nesta execução enquanto ainda continua para a seleção
de plugins. Quando plugins do Codex selecionados e instalados na origem são migráveis e
`--plugin` não foi fornecido, a migração então solicita a ativação de plugin nativo do Codex
pelo nome do plugin. Itens de plugin
começam marcados, a menos que a configuração do plugin Codex de destino do OpenClaw já tenha esse
plugin. Plugins de destino existentes começam desmarcados e mostram uma dica de conflito, como
`conflict: plugin exists`; escolha `Toggle all off` para não migrar nenhum plugin nativo do Codex
nessa execução, ou `Skip for now` para parar antes de aplicar. Para execuções roteirizadas ou
exatas, passe `--skill <name>` uma vez por skill, por exemplo:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Use `--plugin <name>` para limitar a migração não interativa de plugin nativo do Codex
a um ou mais plugins selecionados instalados na origem:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### O que o Codex importa

- Diretórios de skills da CLI do Codex em `$CODEX_HOME/skills`, excluindo o cache
  `.system` do Codex.
- AgentSkills pessoais em `$HOME/.agents/skills`, copiadas para o workspace do agente
  OpenClaw atual quando você deseja propriedade por agente.
- Plugins do Codex `openai-curated` instalados na origem, descobertos por meio de
  `plugin/list` do app-server do Codex. O planejamento lê `plugin/read` para cada plugin instalado
  habilitado. Plugins respaldados por apps exigem que a resposta da conta do app-server do Codex de origem
  seja uma conta de assinatura do ChatGPT; respostas de conta não ChatGPT ou ausentes
  são ignoradas com `codex_subscription_required`. Por padrão,
  a migração não chama `app/list` de origem, então plugins respaldados por apps que passam pelo
  gate de conta são planejados sem verificação de acessibilidade do app de origem, e
  falhas de transporte na busca de conta são ignoradas com `codex_account_unavailable`. Passe
  `--verify-plugin-apps` quando quiser que a migração force um novo snapshot
  de `app/list` de origem e exija que todos os apps pertencentes estejam presentes, habilitados e
  acessíveis antes de planejar a ativação nativa. Nesse modo, falhas de transporte na busca de conta
  seguem para a verificação do inventário de apps de origem. O snapshot do inventário de apps
  de origem é mantido em memória para o processo atual; ele
  não é gravado na saída de migração nem na configuração de destino. Plugins desabilitados,
  detalhes de plugin ilegíveis, contas de origem bloqueadas por assinatura e, quando
  a verificação é solicitada, apps ausentes, apps desabilitados, apps inacessíveis ou
  falhas do inventário de apps de origem se tornam itens manuais ignorados com motivos tipados
  em vez de entradas de configuração de destino.
  A aplicação chama `plugin/install` do app-server para cada plugin elegível selecionado,
  mesmo que o app-server de destino já reporte esse plugin como instalado e
  habilitado. Plugins Codex migrados são utilizáveis apenas em sessões que selecionam o
  harness Codex nativo; eles não são expostos ao Pi, a execuções normais do provedor OpenAI,
  vínculos de conversa ACP ou outros harnesses.

### Estado do Codex para revisão manual

`config.toml` do Codex, `hooks/hooks.json` nativo, marketplaces não selecionados, bundles de
plugin em cache que não são plugins selecionados instalados na origem, e plugins instalados na origem
que falham no gate de assinatura da origem não são ativados automaticamente.
Quando `--verify-plugin-apps` está definido, plugins que falham no gate de inventário de apps
de origem também são ignorados. Eles são copiados ou reportados no relatório de migração para
revisão manual.

Para plugins selecionados instalados na origem e migrados, a aplicação grava:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- uma entrada explícita de plugin com `marketplaceName: "openai-curated"` e
  `pluginName` para cada plugin selecionado

A migração nunca grava `plugins["*"]` e nunca armazena caminhos locais de cache de marketplace.
Falhas de assinatura do lado da origem são reportadas em itens manuais com motivos tipados,
como `codex_subscription_required`, `codex_account_unavailable`,
`plugin_disabled` ou `plugin_read_unavailable`. Com `--verify-plugin-apps`,
falhas de inventário de apps da origem também podem aparecer como `app_inaccessible`,
`app_disabled`, `app_missing` ou `app_inventory_unavailable`. Plugins ignorados
não são gravados na configuração de destino.
Instalações que exigem autenticação no lado do destino são reportadas no item de plugin afetado com
`status: "skipped"`, `reason: "auth_required"` e identificadores de app sanitizados.
Suas entradas explícitas de configuração são gravadas desabilitadas até que você reautorize e
as habilite. Outras falhas de instalação são resultados `error` com escopo de item.

Se o inventário de plugins do app-server do Codex estiver indisponível durante o planejamento, a migração
recorre a itens consultivos de bundle em cache em vez de falhar toda a
migração.

## Provedor Hermes

O provedor Hermes incluído detecta o estado em `~/.hermes` por padrão. Use `--from <path>` quando o Hermes estiver em outro lugar.

### O que o Hermes importa

- Configuração de modelo padrão de `config.yaml`.
- Provedores de modelo configurados e endpoints personalizados compatíveis com OpenAI de `providers` e `custom_providers`.
- Definições de servidor MCP de `mcp_servers` ou `mcp.servers`.
- `SOUL.md` e `AGENTS.md` para o workspace do agente OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` anexados aos arquivos de memória do workspace.
- Padrões de configuração de memória para a memória em arquivo do OpenClaw, além de itens de arquivo ou revisão manual para provedores de memória externos, como Honcho.
- Skills que incluem um arquivo `SKILL.md` em `skills/<name>/`.
- Valores de configuração por Skills de `skills.config`.
- Chaves de API compatíveis de `.env`, somente com `--include-secrets`.

### Chaves `.env` compatíveis

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Estado somente para arquivamento

O estado do Hermes que o OpenClaw não consegue interpretar com segurança é copiado para o relatório de migração para revisão manual, mas não é carregado na configuração ativa nem nas credenciais do OpenClaw. Isso preserva estados opacos ou inseguros sem fingir que o OpenClaw pode executá-los ou confiar neles automaticamente:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Depois de aplicar

```bash
openclaw doctor
```

## Contrato do Plugin

As fontes de migração são plugins. Um Plugin declara seus IDs de provedor em `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Em tempo de execução, o Plugin chama `api.registerMigrationProvider(...)`. O provedor implementa `detect`, `plan` e `apply`. O núcleo controla a orquestração da CLI, a política de backup, os prompts, a saída JSON e a verificação prévia de conflitos. O núcleo passa o plano revisado para `apply(ctx, plan)`, e os provedores podem reconstruir o plano somente quando esse argumento estiver ausente por compatibilidade.

Plugins de provedor podem usar `openclaw/plugin-sdk/migration` para construção de itens e contagens de resumo, além de `openclaw/plugin-sdk/migration-runtime` para cópias de arquivos conscientes de conflitos, cópias de relatório somente para arquivamento, wrappers de config-runtime em cache e relatórios de migração.

## Integração inicial

A integração inicial pode oferecer migração quando um provedor detecta uma origem conhecida. Tanto `openclaw onboard --flow import` quanto `openclaw setup --wizard --import-from hermes` usam o mesmo provedor de migração do Plugin e ainda mostram uma prévia antes de aplicar.

<Note>
Importações durante a integração inicial exigem uma configuração nova do OpenClaw. Redefina primeiro a configuração, as credenciais, as sessões e o workspace se você já tiver estado local. Importações com backup mais sobrescrita ou mesclagem são protegidas por sinalizadores de recurso para configurações existentes.
</Note>

## Relacionados

- [Migração do Hermes](/pt-BR/install/migrating-hermes): passo a passo voltado ao usuário.
- [Migração do Claude](/pt-BR/install/migrating-claude): passo a passo voltado ao usuário.
- [Migração](/pt-BR/install/migrating): mover o OpenClaw para uma nova máquina.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade depois de aplicar uma migração.
- [Plugins](/pt-BR/tools/plugin): instalação e registro de Plugin.
