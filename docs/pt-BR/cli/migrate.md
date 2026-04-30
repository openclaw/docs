---
read_when:
    - Você deseja migrar do Hermes ou de outro sistema de agentes para o OpenClaw
    - Você está adicionando um provedor de migração pertencente ao Plugin
summary: Referência da CLI para `openclaw migrate` (importar estado de outro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-04-30T20:05:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importe o estado de outro sistema de agente por meio de um provedor de migração pertencente a um plugin. Os provedores incluídos cobrem o estado da CLI do Codex, [Claude](/pt-BR/install/migrating-claude) e [Hermes](/pt-BR/install/migrating-hermes); plugins de terceiros podem registrar provedores adicionais.

<Tip>
Para orientações voltadas ao usuário, consulte [Migrando do Claude](/pt-BR/install/migrating-claude) e [Migrando do Hermes](/pt-BR/install/migrating-hermes). O [hub de migração](/pt-BR/install/migrating) lista todos os caminhos.
</Tip>

## Comandos

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
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
  Permite que a aplicação substitua destinos existentes quando o plano relata conflitos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignora o prompt de confirmação. Obrigatório no modo não interativo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Seleciona um item de cópia de skill pelo nome da skill ou pelo id do item. Repita a flag para migrar várias skills. Quando omitido, migrações interativas do Codex mostram um seletor de caixas de seleção e migrações não interativas mantêm todas as skills planejadas.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignora o backup antes da aplicação. Requer `--force` quando há estado local do OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Obrigatório junto com `--no-backup` quando a aplicação recusaria ignorar o backup.
</ParamField>
<ParamField path="--json" type="boolean">
  Imprime o plano ou o resultado da aplicação como JSON. Com `--json` e sem `--yes`, a aplicação imprime o plano e não modifica o estado.
</ParamField>

## Modelo de segurança

`openclaw migrate` prioriza a pré-visualização.

<AccordionGroup>
  <Accordion title="Pré-visualizar antes de aplicar">
    O provedor retorna um plano itemizado antes de qualquer alteração, incluindo conflitos, itens ignorados e itens sensíveis. Planos JSON, saída de aplicação e relatórios de migração ocultam chaves aninhadas com aparência de segredo, como chaves de API, tokens, cabeçalhos de autorização, cookies e senhas.

    `openclaw migrate apply <provider>` pré-visualiza o plano e solicita confirmação antes de alterar o estado, a menos que `--yes` esteja definido. No modo não interativo, a aplicação requer `--yes`.

  </Accordion>
  <Accordion title="Backups">
    A aplicação cria e verifica um backup do OpenClaw antes de aplicar a migração. Se ainda não existir estado local do OpenClaw, a etapa de backup é ignorada e a migração pode continuar. Para ignorar um backup quando o estado existe, passe `--no-backup` e `--force`.
  </Accordion>
  <Accordion title="Conflitos">
    A aplicação se recusa a continuar quando o plano tem conflitos. Revise o plano e execute novamente com `--overwrite` se a substituição de destinos existentes for intencional. Provedores ainda podem gravar backups por item para arquivos sobrescritos no diretório de relatórios de migração.
  </Accordion>
  <Accordion title="Segredos">
    Segredos nunca são importados por padrão. Use `--include-secrets` para importar credenciais compatíveis.
  </Accordion>
</AccordionGroup>

## Provedor Claude

O provedor Claude incluído detecta o estado do Claude Code em `~/.claude` por padrão. Use `--from <path>` para importar uma home específica do Claude Code ou uma raiz de projeto.

<Tip>
Para uma orientação voltada ao usuário, consulte [Migrando do Claude](/pt-BR/install/migrating-claude).
</Tip>

### O que o Claude importa

- `CLAUDE.md` do projeto e `.claude/CLAUDE.md` para o workspace do agente OpenClaw.
- `~/.claude/CLAUDE.md` do usuário anexado ao `USER.md` do workspace.
- Definições de servidor MCP de `.mcp.json` do projeto, `~/.claude.json` do Claude Code e `claude_desktop_config.json` do Claude Desktop.
- Diretórios de skills do Claude que incluem `SKILL.md`.
- Arquivos Markdown de comando do Claude convertidos em skills do OpenClaw apenas com invocação manual.

### Estado de arquivo e revisão manual

Hooks, permissões, padrões de ambiente, memória local, regras com escopo de caminho, subagentes, caches, planos e histórico de projeto do Claude são preservados no relatório de migração ou relatados como itens de revisão manual. O OpenClaw não executa hooks, copia listas de permissões amplas nem importa estado de credenciais OAuth/Desktop automaticamente.

## Provedor Codex

O provedor Codex incluído detecta o estado da CLI do Codex em `~/.codex` por padrão, ou
em `CODEX_HOME` quando essa variável de ambiente está definida. Use `--from <path>` para
inventariar uma home específica do Codex.

Use este provedor ao migrar para o harness Codex do OpenClaw e quando quiser
promover deliberadamente ativos pessoais úteis da CLI do Codex. Inicializações locais do app-server do Codex
usam diretórios `CODEX_HOME` e `HOME` por agente, então não leem
seu estado pessoal da CLI do Codex por padrão.

Executar `openclaw migrate codex` em um terminal interativo pré-visualiza o plano
completo e abre um seletor de caixas de seleção para itens de cópia de skill antes da confirmação final de
aplicação. Todas as skills começam selecionadas; desmarque qualquer skill que você não queira
copiar para este agente. Para execuções com script ou exatas, passe `--skill <name>` uma vez
por skill, por exemplo:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### O que o Codex importa

- Diretórios de skills da CLI do Codex em `$CODEX_HOME/skills`, excluindo o cache
  `.system` do Codex.
- AgentSkills pessoais em `$HOME/.agents/skills`, copiadas para o workspace
  atual do agente OpenClaw quando você quiser propriedade por agente.

### Estado Codex de revisão manual

Plugins nativos do Codex, `config.toml` e `hooks/hooks.json` nativos não são
ativados automaticamente. Plugins podem expor servidores MCP, apps, hooks ou outro
comportamento executável, então o provedor os relata para revisão em vez de carregá-los
no OpenClaw. Arquivos de configuração e hooks são copiados para o relatório de migração
para revisão manual.

## Provedor Hermes

O provedor Hermes incluído detecta o estado em `~/.hermes` por padrão. Use `--from <path>` quando o Hermes estiver em outro lugar.

### O que o Hermes importa

- Configuração de modelo padrão de `config.yaml`.
- Provedores de modelo configurados e endpoints personalizados compatíveis com OpenAI de `providers` e `custom_providers`.
- Definições de servidor MCP de `mcp_servers` ou `mcp.servers`.
- `SOUL.md` e `AGENTS.md` para o workspace do agente OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` anexados aos arquivos de memória do workspace.
- Padrões de configuração de memória para memória em arquivo do OpenClaw, além de itens arquivados ou de revisão manual para provedores de memória externos, como Honcho.
- Skills que incluem um arquivo `SKILL.md` em `skills/<name>/`.
- Valores de configuração por skill de `skills.config`.
- Chaves de API compatíveis de `.env`, somente com `--include-secrets`.

### Chaves `.env` compatíveis

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Estado somente de arquivo

O estado do Hermes que o OpenClaw não consegue interpretar com segurança é copiado para o relatório de migração para revisão manual, mas não é carregado na configuração ou nas credenciais ativas do OpenClaw. Isso preserva estado opaco ou inseguro sem fingir que o OpenClaw pode executá-lo ou confiar nele automaticamente:

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

## Contrato de Plugin

As fontes de migração são plugins. Um plugin declara seus ids de provedor em `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Em tempo de execução, o plugin chama `api.registerMigrationProvider(...)`. O provedor implementa `detect`, `plan` e `apply`. O core é responsável pela orquestração da CLI, política de backup, prompts, saída JSON e pré-verificação de conflitos. O core passa o plano revisado para `apply(ctx, plan)`, e os provedores podem recriar o plano somente quando esse argumento estiver ausente por compatibilidade.

Plugins de provedor podem usar `openclaw/plugin-sdk/migration` para construção de itens e contagens de resumo, além de `openclaw/plugin-sdk/migration-runtime` para cópias de arquivos cientes de conflitos, cópias de relatório somente de arquivo, wrappers de config-runtime em cache e relatórios de migração.

## Integração de onboarding

O onboarding pode oferecer migração quando um provedor detecta uma origem conhecida. Tanto `openclaw onboard --flow import` quanto `openclaw setup --wizard --import-from hermes` usam o mesmo provedor de migração de plugin e ainda mostram uma pré-visualização antes de aplicar.

<Note>
Importações de onboarding exigem uma configuração nova do OpenClaw. Redefina configuração, credenciais, sessões e o workspace primeiro se você já tiver estado local. Importações com backup mais sobrescrita ou mesclagem estão protegidas por feature gate para configurações existentes.
</Note>

## Relacionado

- [Migrando do Hermes](/pt-BR/install/migrating-hermes): orientação voltada ao usuário.
- [Migrando do Claude](/pt-BR/install/migrating-claude): orientação voltada ao usuário.
- [Migrando](/pt-BR/install/migrating): mova o OpenClaw para uma nova máquina.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade depois de aplicar uma migração.
- [Plugins](/pt-BR/tools/plugin): instalação e registro de plugins.
