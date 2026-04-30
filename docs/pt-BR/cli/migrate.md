---
read_when:
    - Você quer migrar do Hermes ou de outro sistema de agentes para o OpenClaw
    - Você está adicionando um provedor de migração pertencente ao plugin
summary: Referência da CLI para `openclaw migrate` (importar estado de outro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-04-30T09:42:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importe o estado de outro sistema de agentes por meio de um provedor de migração pertencente a um plugin. Os provedores integrados cobrem [Claude](/pt-BR/install/migrating-claude) e [Hermes](/pt-BR/install/migrating-hermes); plugins de terceiros podem registrar provedores adicionais.

<Tip>
Para orientações voltadas ao usuário, consulte [Migrando do Claude](/pt-BR/install/migrating-claude) e [Migrando do Hermes](/pt-BR/install/migrating-hermes). O [hub de migração](/pt-BR/install/migrating) lista todos os caminhos.
</Tip>

## Comandos

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
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
  Permite que a aplicação substitua destinos existentes quando o plano relatar conflitos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignora o prompt de confirmação. Obrigatório no modo não interativo.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignora o backup antes da aplicação. Exige `--force` quando há estado local do OpenClaw.
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
    O provedor retorna um plano itemizado antes que qualquer coisa mude, incluindo conflitos, itens ignorados e itens sensíveis. Planos JSON, saída de aplicação e relatórios de migração mascaram chaves aninhadas com aparência de segredo, como chaves de API, tokens, cabeçalhos de autorização, cookies e senhas.

    `openclaw migrate apply <provider>` pré-visualiza o plano e solicita confirmação antes de alterar o estado, a menos que `--yes` esteja definido. No modo não interativo, a aplicação exige `--yes`.

  </Accordion>
  <Accordion title="Backups">
    A aplicação cria e verifica um backup do OpenClaw antes de aplicar a migração. Se ainda não existir estado local do OpenClaw, a etapa de backup é ignorada e a migração pode continuar. Para ignorar um backup quando existe estado, passe `--no-backup` e `--force`.
  </Accordion>
  <Accordion title="Conflitos">
    A aplicação se recusa a continuar quando o plano tem conflitos. Revise o plano e execute novamente com `--overwrite` se substituir destinos existentes for intencional. Os provedores ainda podem gravar backups em nível de item para arquivos substituídos no diretório de relatórios de migração.
  </Accordion>
  <Accordion title="Segredos">
    Segredos nunca são importados por padrão. Use `--include-secrets` para importar credenciais compatíveis.
  </Accordion>
</AccordionGroup>

## Provedor Claude

O provedor Claude integrado detecta o estado do Claude Code em `~/.claude` por padrão. Use `--from <path>` para importar uma home específica do Claude Code ou uma raiz de projeto.

<Tip>
Para uma orientação voltada ao usuário, consulte [Migrando do Claude](/pt-BR/install/migrating-claude).
</Tip>

### O que o Claude importa

- `CLAUDE.md` do projeto e `.claude/CLAUDE.md` para o workspace do agente OpenClaw.
- `~/.claude/CLAUDE.md` do usuário anexado ao `USER.md` do workspace.
- Definições de servidor MCP de `.mcp.json` do projeto, `~/.claude.json` do Claude Code e `claude_desktop_config.json` do Claude Desktop.
- Diretórios de Skills do Claude que incluem `SKILL.md`.
- Arquivos Markdown de comandos do Claude convertidos em Skills do OpenClaw apenas com invocação manual.

### Estado de arquivo e revisão manual

Hooks, permissões, padrões de ambiente, memória local, regras com escopo por caminho, subagentes, caches, planos e histórico de projeto do Claude são preservados no relatório de migração ou relatados como itens de revisão manual. O OpenClaw não executa hooks, copia allowlists amplas nem importa automaticamente estado de credenciais OAuth/Desktop.

## Provedor Hermes

O provedor Hermes integrado detecta estado em `~/.hermes` por padrão. Use `--from <path>` quando o Hermes estiver em outro lugar.

### O que o Hermes importa

- Configuração de modelo padrão de `config.yaml`.
- Provedores de modelos configurados e endpoints personalizados compatíveis com OpenAI de `providers` e `custom_providers`.
- Definições de servidor MCP de `mcp_servers` ou `mcp.servers`.
- `SOUL.md` e `AGENTS.md` para o workspace do agente OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` anexados aos arquivos de memória do workspace.
- Padrões de configuração de memória para memória em arquivo do OpenClaw, além de itens de arquivo ou revisão manual para provedores de memória externos, como Honcho.
- Skills que incluem um arquivo `SKILL.md` em `skills/<name>/`.
- Valores de configuração por skill de `skills.config`.
- Chaves de API compatíveis de `.env`, somente com `--include-secrets`.

### Chaves `.env` compatíveis

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### Estado apenas para arquivamento

O estado do Hermes que o OpenClaw não consegue interpretar com segurança é copiado para o relatório de migração para revisão manual, mas não é carregado na configuração ativa nem nas credenciais do OpenClaw. Isso preserva estado opaco ou inseguro sem fingir que o OpenClaw pode executá-lo ou confiar nele automaticamente:

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

As origens de migração são plugins. Um plugin declara seus ids de provedor em `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Em tempo de execução, o plugin chama `api.registerMigrationProvider(...)`. O provedor implementa `detect`, `plan` e `apply`. O núcleo é dono da orquestração da CLI, da política de backup, dos prompts, da saída JSON e da verificação prévia de conflitos. O núcleo passa o plano revisado para `apply(ctx, plan)`, e os provedores podem reconstruir o plano apenas quando esse argumento estiver ausente por compatibilidade.

Plugins provedores podem usar `openclaw/plugin-sdk/migration` para construção de itens e contagens resumidas, além de `openclaw/plugin-sdk/migration-runtime` para cópias de arquivos cientes de conflitos, cópias de relatórios apenas para arquivo, wrappers de config-runtime em cache e relatórios de migração.

## Integração com onboarding

O onboarding pode oferecer migração quando um provedor detecta uma origem conhecida. Tanto `openclaw onboard --flow import` quanto `openclaw setup --wizard --import-from hermes` usam o mesmo provedor de migração de plugin e ainda mostram uma pré-visualização antes de aplicar.

<Note>
Importações de onboarding exigem uma configuração nova do OpenClaw. Redefina configuração, credenciais, sessões e o workspace primeiro se você já tiver estado local. Importações com backup mais substituição ou mesclagem são controladas por feature gate para configurações existentes.
</Note>

## Relacionado

- [Migrando do Hermes](/pt-BR/install/migrating-hermes): orientação voltada ao usuário.
- [Migrando do Claude](/pt-BR/install/migrating-claude): orientação voltada ao usuário.
- [Migrando](/pt-BR/install/migrating): mova o OpenClaw para uma nova máquina.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade após aplicar uma migração.
- [Plugins](/pt-BR/tools/plugin): instalação e registro de plugins.
