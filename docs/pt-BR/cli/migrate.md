---
read_when:
    - Você quer migrar do Hermes ou de outro sistema de agentes para o OpenClaw
    - Você está adicionando um provedor de migração de propriedade do Plugin
summary: Referência da CLI para `openclaw migrate` (importar estado de outro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-05-12T00:58:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importe estado de outro sistema de agente por meio de um provedor de migração pertencente a um plugin. Os provedores incluídos cobrem o estado da CLI do Codex, [Claude](/pt-BR/install/migrating-claude) e [Hermes](/pt-BR/install/migrating-hermes); plugins de terceiros podem registrar provedores adicionais.

<Tip>
Para orientações voltadas ao usuário, consulte [Migrando do Claude](/pt-BR/install/migrating-claude) e [Migrando do Hermes](/pt-BR/install/migrating-hermes). O [hub de migração](/pt-BR/install/migrating) lista todos os caminhos.
</Tip>

## Comandos

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
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
  Substitui o diretório de estado de origem. Hermes usa `~/.hermes` por padrão.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa credenciais compatíveis. Desativado por padrão.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permite que a aplicação substitua destinos existentes quando o plano relatar conflitos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignora a solicitação de confirmação. Obrigatório no modo não interativo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Seleciona um item de cópia de skill pelo nome da skill ou pelo id do item. Repita a flag para migrar várias skills. Quando omitido, migrações interativas do Codex mostram um seletor de caixas de seleção e migrações não interativas mantêm todas as skills planejadas.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Seleciona um item de instalação de plugin do Codex pelo nome do plugin ou pelo id do item. Repita a flag para migrar vários plugins do Codex. Quando omitido, migrações interativas do Codex mostram um seletor nativo de caixas de seleção de plugins do Codex e migrações não interativas mantêm todos os plugins planejados. Isso se aplica apenas a plugins do Codex `openai-curated` instalados na origem e descobertos pelo inventário do app-server do Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignora o backup pré-aplicação. Exige `--force` quando houver estado local do OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Obrigatório junto com `--no-backup` quando a aplicação recusaria ignorar o backup.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime o plano ou o resultado da aplicação como JSON. Com `--json` e sem `--yes`, apply imprime o plano e não altera o estado.
</ParamField>

## Modelo de segurança

`openclaw migrate` prioriza a pré-visualização.

<AccordionGroup>
  <Accordion title="Pré-visualizar antes de aplicar">
    O provedor retorna um plano itemizado antes que qualquer coisa mude, incluindo conflitos, itens ignorados e itens sensíveis. Planos JSON, saída de aplicação e relatórios de migração removem chaves aninhadas com aparência de segredo, como chaves de API, tokens, cabeçalhos de autorização, cookies e senhas.

    `openclaw migrate apply <provider>` pré-visualiza o plano e solicita confirmação antes de alterar o estado, a menos que `--yes` esteja definido. No modo não interativo, apply exige `--yes`.

  </Accordion>
  <Accordion title="Backups">
    Apply cria e verifica um backup do OpenClaw antes de aplicar a migração. Se ainda não houver estado local do OpenClaw, a etapa de backup é ignorada e a migração pode continuar. Para ignorar um backup quando houver estado, passe `--no-backup` e `--force`.
  </Accordion>
  <Accordion title="Conflitos">
    Apply se recusa a continuar quando o plano tem conflitos. Revise o plano e execute novamente com `--overwrite` se substituir destinos existentes for intencional. Provedores ainda podem gravar backups em nível de item para arquivos sobrescritos no diretório de relatórios de migração.
  </Accordion>
  <Accordion title="Segredos">
    Segredos nunca são importados por padrão. Use `--include-secrets` para importar credenciais compatíveis.
  </Accordion>
</AccordionGroup>

## Provedor Claude

O provedor Claude incluído detecta o estado do Claude Code em `~/.claude` por padrão. Use `--from <path>` para importar uma home ou raiz de projeto específica do Claude Code.

<Tip>
Para uma orientação voltada ao usuário, consulte [Migrando do Claude](/pt-BR/install/migrating-claude).
</Tip>

### O que o Claude importa

- `CLAUDE.md` do projeto e `.claude/CLAUDE.md` para o workspace do agente OpenClaw.
- `~/.claude/CLAUDE.md` do usuário anexado a `USER.md` do workspace.
- Definições de servidor MCP de `.mcp.json` do projeto, `~/.claude.json` do Claude Code e `claude_desktop_config.json` do Claude Desktop.
- Diretórios de skills do Claude que incluem `SKILL.md`.
- Arquivos Markdown de comandos do Claude convertidos em skills do OpenClaw somente com invocação manual.

### Estado de arquivamento e revisão manual

Hooks, permissões, padrões de ambiente, memória local, regras com escopo por caminho, subagentes, caches, planos e histórico do projeto do Claude são preservados no relatório de migração ou relatados como itens de revisão manual. O OpenClaw não executa hooks, copia allowlists amplas nem importa estado de credenciais OAuth/Desktop automaticamente.

## Provedor Codex

O provedor Codex incluído detecta o estado da CLI do Codex em `~/.codex` por padrão, ou
em `CODEX_HOME` quando essa variável de ambiente está definida. Use `--from <path>` para
inventariar uma home específica do Codex.

Use este provedor ao migrar para o harness Codex do OpenClaw e quando você quiser
promover deliberadamente ativos pessoais úteis da CLI do Codex. Inicializações locais do app-server
do Codex usam diretórios `CODEX_HOME` e `HOME` por agente, então eles não leem
seu estado pessoal da CLI do Codex por padrão.

Executar `openclaw migrate codex` em um terminal interativo pré-visualiza o plano
completo e, em seguida, abre seletores de caixas de seleção antes da confirmação final de aplicação. Itens de
cópia de skills são solicitados primeiro. Use `Toggle all on` ou `Toggle all off` para seleção em
massa; skills planejadas começam marcadas, skills em conflito começam desmarcadas, e
`Skip for now` ignora cópias de skills nesta execução enquanto ainda continua para a seleção de
plugins. Quando plugins curados do Codex instalados na origem são migráveis e
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

Use `--plugin <name>` para limitar a migração de plugins nativos do Codex de forma não interativa
a um ou mais plugins curados instalados na origem:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### O que o Codex importa

- Diretórios de skills da CLI do Codex em `$CODEX_HOME/skills`, excluindo o cache
  `.system` do Codex.
- AgentSkills pessoais em `$HOME/.agents/skills`, copiadas para o workspace atual
  do agente OpenClaw quando você quiser propriedade por agente.
- Plugins do Codex `openai-curated` instalados na origem e descobertos por meio de
  `plugin/list` do app-server do Codex. Apply chama `plugin/install` do app-server para cada
  plugin selecionado, mesmo se o app-server de destino já relatar esse plugin como
  instalado e ativado. Plugins do Codex migrados só podem ser usados em sessões que
  selecionam o harness Codex nativo; eles não são expostos ao Pi, a execuções normais do
  provedor OpenAI, a vínculos de conversa ACP ou a outros harnesses.

### Estado do Codex para revisão manual

`config.toml` do Codex, `hooks/hooks.json` nativo, marketplaces não curados e
bundles de plugins em cache que não são plugins curados instalados na origem não são
ativados automaticamente. Eles são copiados ou relatados no relatório de migração para
revisão manual.

Para plugins curados instalados na origem que foram migrados, apply grava:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- uma entrada explícita de plugin com `marketplaceName: "openai-curated"` e
  `pluginName` para cada plugin selecionado

A migração nunca grava `plugins["*"]` e nunca armazena caminhos de cache de marketplace
local. Instalações que exigem autenticação são relatadas no item de plugin afetado com
`status: "skipped"`, `reason: "auth_required"` e identificadores de app sanitizados.
Suas entradas explícitas de configuração são gravadas desativadas até que você reautorize e
as ative. Outras falhas de instalação são resultados `error` com escopo por item.

Se o inventário de plugins do app-server do Codex estiver indisponível durante o planejamento, a migração
recorre a itens consultivos de bundle em cache em vez de falhar a migração inteira.

## Provedor Hermes

O provedor Hermes incluído detecta estado em `~/.hermes` por padrão. Use `--from <path>` quando o Hermes estiver em outro lugar.

### O que o Hermes importa

- Configuração de modelo padrão de `config.yaml`.
- Provedores de modelo configurados e endpoints personalizados compatíveis com OpenAI de `providers` e `custom_providers`.
- Definições de servidor MCP de `mcp_servers` ou `mcp.servers`.
- `SOUL.md` e `AGENTS.md` para o workspace do agente OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` anexados aos arquivos de memória do workspace.
- Padrões de configuração de memória para memória de arquivo do OpenClaw, além de itens de arquivamento ou revisão manual para provedores de memória externos, como Honcho.
- Skills que incluem um arquivo `SKILL.md` em `skills/<name>/`.
- Valores de configuração por skill de `skills.config`.
- Chaves de API compatíveis de `.env`, somente com `--include-secrets`.

### Chaves `.env` compatíveis

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Estado somente de arquivamento

Estado do Hermes que o OpenClaw não consegue interpretar com segurança é copiado para o relatório de migração para revisão manual, mas não é carregado na configuração nem nas credenciais ativas do OpenClaw. Isso preserva estado opaco ou inseguro sem fingir que o OpenClaw pode executá-lo ou confiar nele automaticamente:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### Após aplicar

```bash
openclaw doctor
```

## Contrato de plugin

Fontes de migração são plugins. Um plugin declara seus ids de provedor em `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Em tempo de execução, o plugin chama `api.registerMigrationProvider(...)`. O provedor implementa `detect`, `plan` e `apply`. O core é responsável pela orquestração da CLI, política de backup, prompts, saída JSON e pré-verificação de conflitos. O core passa o plano revisado para `apply(ctx, plan)`, e provedores podem reconstruir o plano somente quando esse argumento estiver ausente por compatibilidade.

Plugins provedores podem usar `openclaw/plugin-sdk/migration` para construção de itens e contagens de resumo, além de `openclaw/plugin-sdk/migration-runtime` para cópias de arquivos sensíveis a conflitos, cópias de relatório somente de arquivamento, wrappers de config-runtime em cache e relatórios de migração.

## Integração de onboarding

O onboarding pode oferecer migração quando um provedor detecta uma origem conhecida. Tanto `openclaw onboard --flow import` quanto `openclaw setup --wizard --import-from hermes` usam o mesmo provedor de migração de plugin e ainda mostram uma pré-visualização antes de aplicar.

<Note>
As importações de integração exigem uma configuração nova do OpenClaw. Redefina a configuração, as credenciais, as sessões e o workspace primeiro se você já tiver estado local. Importações com backup e sobrescrita ou por mesclagem são restritas por sinalização de recurso para configurações existentes.
</Note>

## Relacionados

- [Migração a partir do Hermes](/pt-BR/install/migrating-hermes): passo a passo voltado ao usuário.
- [Migração a partir do Claude](/pt-BR/install/migrating-claude): passo a passo voltado ao usuário.
- [Migração](/pt-BR/install/migrating): mova o OpenClaw para uma nova máquina.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade após aplicar uma migração.
- [Plugins](/pt-BR/tools/plugin): instalação e registro de Plugin.
