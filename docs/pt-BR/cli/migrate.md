---
read_when:
    - Você quer migrar do Hermes ou de outro sistema de agentes para o OpenClaw
    - Você está adicionando um provedor de migração pertencente ao plugin
summary: Referência da CLI para `openclaw migrate` (importar estado de outro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-06-27T17:20:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
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
  Substitui o diretório de estado de origem. O Hermes usa `~/.hermes` por padrão.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa credenciais compatíveis sem solicitar confirmação. A aplicação interativa pergunta antes de importar credenciais de autenticação detectadas, com sim selecionado por padrão; `--yes` não interativo exige `--include-secrets` para importá-las.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Ignora a importação de credenciais de autenticação, incluindo a solicitação interativa.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permite que a aplicação substitua destinos existentes quando o plano relata conflitos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignora a solicitação de confirmação. Obrigatório no modo não interativo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Seleciona um item de cópia de skill pelo nome da skill ou pelo id do item. Repita a flag para migrar várias skills. Quando omitida, migrações interativas do Codex mostram um seletor de caixas de seleção, e migrações não interativas mantêm todas as skills planejadas.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Seleciona um item de instalação de plugin do Codex pelo nome do plugin ou pelo id do item. Repita a flag para migrar vários plugins do Codex. Quando omitida, migrações interativas do Codex mostram um seletor nativo de caixas de seleção de plugins do Codex, e migrações não interativas mantêm todos os plugins planejados. Isso se aplica apenas a plugins `openai-curated` do Codex instalados na origem e descobertos pelo inventário do app-server do Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Somente Codex. Força uma nova travessia `app/list` do app-server do Codex de origem antes de planejar a ativação nativa de plugins. Desativado por padrão para manter o planejamento da migração rápido.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignora o backup antes da aplicação. Exige `--force` quando existe estado local do OpenClaw.
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
  <Accordion title="Preview before apply">
    O provedor retorna um plano detalhado por item antes que qualquer coisa mude, incluindo conflitos, itens ignorados e itens sensíveis. Planos JSON, saída de aplicação e relatórios de migração mascaram chaves aninhadas com aparência de segredo, como chaves de API, tokens, cabeçalhos de autorização, cookies e senhas.

    `openclaw migrate apply <provider>` pré-visualiza o plano e solicita confirmação antes de alterar o estado, a menos que `--yes` esteja definido. No modo não interativo, a aplicação exige `--yes`.

  </Accordion>
  <Accordion title="Backups">
    A aplicação cria e verifica um backup do OpenClaw antes de aplicar a migração. Se ainda não existir estado local do OpenClaw, a etapa de backup é ignorada e a migração pode continuar. Para ignorar um backup quando existe estado, passe `--no-backup` e `--force`.
  </Accordion>
  <Accordion title="Conflicts">
    A aplicação se recusa a continuar quando o plano tem conflitos. Revise o plano e execute novamente com `--overwrite` se a substituição de destinos existentes for intencional. Provedores ainda podem gravar backups em nível de item para arquivos substituídos no diretório de relatório da migração.
  </Accordion>
  <Accordion title="Secrets">
    A aplicação interativa pergunta se deve importar credenciais de autenticação detectadas, com sim selecionado por padrão. Use `--no-auth-credentials` para ignorá-las, ou use `--include-secrets` para importação autônoma de credenciais com `--yes`.
  </Accordion>
</AccordionGroup>

## Provedor Claude

O provedor Claude incluído detecta o estado do Claude Code em `~/.claude` por padrão. Use `--from <path>` para importar uma home específica do Claude Code ou uma raiz de projeto.

<Tip>
Para um guia passo a passo voltado ao usuário, consulte [Migrando do Claude](/pt-BR/install/migrating-claude).
</Tip>

### O que o Claude importa

- `CLAUDE.md` do projeto e `.claude/CLAUDE.md` para o espaço de trabalho do agente OpenClaw.
- `~/.claude/CLAUDE.md` do usuário anexado ao `USER.md` do espaço de trabalho.
- Definições de servidor MCP de `.mcp.json` do projeto, `~/.claude.json` do Claude Code e `claude_desktop_config.json` do Claude Desktop.
- Diretórios de skills do Claude que incluem `SKILL.md`.
- Arquivos Markdown de comando do Claude convertidos em Skills do OpenClaw apenas com invocação manual.

### Estado arquivado e de revisão manual

Hooks do Claude, permissões, padrões de ambiente, memória local, regras com escopo por caminho, subagentes, caches, planos e histórico do projeto são preservados no relatório de migração ou relatados como itens de revisão manual. O OpenClaw não executa hooks, não copia allowlists amplas nem importa automaticamente estado de credenciais OAuth/Desktop.

## Provedor Codex

O provedor Codex incluído detecta o estado da CLI do Codex em `~/.codex` por padrão, ou
em `CODEX_HOME` quando essa variável de ambiente está definida. Use `--from <path>` para
inventariar uma home específica do Codex.

Use este provedor ao migrar para o harness Codex do OpenClaw e quando quiser
promover deliberadamente ativos pessoais úteis da CLI do Codex. Inicializações locais do app-server
do Codex usam um `CODEX_HOME` por agente, portanto não leem seu
`~/.codex` pessoal por padrão. O `HOME` normal do processo ainda é herdado, então o Codex
pode ver skills/entradas de marketplace de plugins compartilhadas em `$HOME/.agents/*`, e
subprocessos podem encontrar configurações e tokens da home do usuário.

Executar `openclaw migrate codex` em um terminal interativo pré-visualiza o plano
completo e, em seguida, abre seletores de caixas de seleção antes da confirmação final de aplicação. Itens
de cópia de skills são solicitados primeiro. Use `Toggle all on` ou `Toggle all off` para seleção
em massa. Pressione Espaço para alternar linhas, ou pressione Enter para ativar a linha destacada
e continuar. Skills planejadas começam marcadas, skills em conflito começam desmarcadas, e
`Skip for now` ignora cópias de skills nesta execução enquanto ainda continua para a seleção
de plugins. Quando plugins curados do Codex instalados na origem são migráveis e
`--plugin` não foi fornecido, a migração então solicita a ativação nativa de plugins do Codex
por nome de plugin. Itens de plugin
começam marcados, a menos que a configuração de destino do plugin Codex do OpenClaw já tenha esse
plugin. Plugins de destino existentes começam desmarcados e mostram uma dica de conflito, como
`conflict: plugin exists`; escolha `Toggle all off` para não migrar nenhum plugin nativo do Codex
nessa execução, ou `Skip for now` para parar antes da aplicação. Para execuções roteirizadas ou
exatas, passe `--skill <name>` uma vez por skill, por exemplo:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

Use `--plugin <name>` para limitar a migração não interativa de plugins nativos do Codex
a um ou mais plugins curados instalados na origem:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### O que o Codex importa

- Diretórios de skills da CLI do Codex em `$CODEX_HOME/skills`, excluindo o cache
  `.system` do Codex.
- AgentSkills pessoais em `$HOME/.agents/skills`, copiadas para o espaço de trabalho atual
  do agente OpenClaw quando você quer propriedade por agente.
- Plugins `openai-curated` do Codex instalados na origem, descobertos por meio de
  `plugin/list` do app-server do Codex. O planejamento lê `plugin/read` para cada plugin
  instalado e habilitado. Plugins apoiados por app exigem que a resposta da conta do app-server
  do Codex de origem seja uma conta com assinatura do ChatGPT; respostas de conta ausentes
  ou que não sejam do ChatGPT são ignoradas com `codex_subscription_required`. Por padrão,
  a migração não chama `app/list` de origem, então plugins apoiados por app que passam pelo
  gate de conta são planejados sem verificação de acessibilidade do app de origem, e
  falhas de transporte na consulta da conta são ignoradas com `codex_account_unavailable`. Passe
  `--verify-plugin-apps` quando quiser que a migração force um snapshot novo de
  `app/list` de origem e exija que todo app pertencente esteja presente, habilitado e
  acessível antes de planejar a ativação nativa. Nesse modo, falhas de transporte
  na consulta da conta passam para a verificação de inventário de apps de origem. O
  snapshot de inventário de apps de origem é mantido em memória para o processo atual; ele
  não é gravado na saída da migração nem na configuração de destino. Plugins desabilitados,
  detalhes de plugin ilegíveis, contas de origem bloqueadas por assinatura e, quando
  a verificação é solicitada, apps ausentes, apps desabilitados, apps inacessíveis ou
  falhas de inventário de apps de origem se tornam itens manuais ignorados com motivos
  tipados, em vez de entradas de configuração de destino.
  A aplicação chama `plugin/install` do app-server para cada plugin qualificado selecionado,
  mesmo que o app-server de destino já informe esse plugin como instalado e
  habilitado. Plugins do Codex migrados são utilizáveis apenas em sessões que selecionam o
  harness nativo do Codex; eles não são expostos a execuções de provedor do OpenClaw,
  vínculos de conversa ACP nem outros harnesses.

### Estado do Codex para revisão manual

`config.toml` do Codex, `hooks/hooks.json` nativo, marketplaces não curados, bundles de
plugins em cache que não são plugins curados instalados na origem, e plugins instalados na origem
que falham no gate de assinatura de origem não são ativados automaticamente.
Quando `--verify-plugin-apps` está definido, plugins que falham no gate de inventário de apps
de origem também são ignorados. Eles são copiados ou relatados no relatório de migração para
revisão manual.

Para plugins curados instalados na origem migrados, a aplicação grava:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- uma entrada explícita de plugin com `marketplaceName: "openai-curated"` e
  `pluginName` para cada plugin selecionado

A migração nunca grava `plugins["*"]` e nunca armazena caminhos de cache de marketplace local. Falhas de assinatura no lado da origem são relatadas em itens manuais com motivos tipados, como `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` ou `plugin_read_unavailable`. Com `--verify-plugin-apps`, falhas de inventário de apps da origem também podem aparecer como `app_inaccessible`, `app_disabled`, `app_missing` ou `app_inventory_unavailable`. Plugins ignorados não são gravados na configuração de destino.
Instalações que exigem autenticação no lado do destino são relatadas no item de plugin afetado com `status: "skipped"`, `reason: "auth_required"` e identificadores de app sanitizados. Suas entradas explícitas de configuração são gravadas como desativadas até que você as reautorize e ative. Outras falhas de instalação são resultados `error` com escopo no item.

Se o inventário de plugins do servidor de apps do Codex estiver indisponível durante o planejamento, a migração recorre a itens consultivos de pacote em cache em vez de falhar a migração inteira.

## Provedor Hermes

O provedor Hermes incluído detecta o estado em `~/.hermes` por padrão. Use `--from <path>` quando o Hermes estiver em outro lugar.

### O que o Hermes importa

- Configuração padrão de modelo de `config.yaml`.
- Provedores de modelo configurados e endpoints personalizados compatíveis com OpenAI de `providers` e `custom_providers`.
- Definições de servidor MCP de `mcp_servers` ou `mcp.servers`.
- `SOUL.md` e `AGENTS.md` para o workspace do agente OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` anexados aos arquivos de memória do workspace.
- Padrões de configuração de memória para memória de arquivo do OpenClaw, além de itens de arquivamento ou revisão manual para provedores de memória externos, como Honcho.
- Skills que incluem um arquivo `SKILL.md` em `skills/<name>/`.
- Valores de configuração por Skill de `skills.config`.
- Credenciais OAuth do OpenAI do OpenCode de `auth.json` do OpenCode quando a migração interativa de credenciais é aceita, ou quando `--include-secrets` é definido. Entradas OAuth de `auth.json` do Hermes são estado legado relatado para reautenticação manual no OpenAI ou reparo pelo doctor.
- Chaves de API e tokens compatíveis de `.env` do Hermes e `auth.json` do OpenCode quando a migração interativa de credenciais é aceita, ou quando `--include-secrets` é definido.

### Chaves `.env` compatíveis

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### Estado somente para arquivamento

O estado do Hermes que o OpenClaw não consegue interpretar com segurança é copiado para o relatório de migração para revisão manual, mas não é carregado na configuração ou nas credenciais ativas do OpenClaw. Isso preserva estado opaco ou inseguro sem fingir que o OpenClaw pode executá-lo ou confiar nele automaticamente:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

### Depois de aplicar

```bash
openclaw doctor
```

## Contrato de plugin

As origens de migração são plugins. Um plugin declara seus ids de provedor em `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Em runtime, o plugin chama `api.registerMigrationProvider(...)`. O provedor implementa `detect`, `plan` e `apply`. O núcleo controla a orquestração da CLI, a política de backup, os prompts, a saída JSON e a pré-verificação de conflitos. O núcleo passa o plano revisado para `apply(ctx, plan)`, e provedores podem reconstruir o plano somente quando esse argumento estiver ausente por compatibilidade.

Plugins de provedor podem usar `openclaw/plugin-sdk/migration` para construção de itens e contagens de resumo, além de `openclaw/plugin-sdk/migration-runtime` para cópias de arquivos cientes de conflitos, cópias de relatório somente para arquivamento, wrappers de config-runtime em cache e relatórios de migração.

## Integração com onboarding

O onboarding pode oferecer migração quando um provedor detecta uma origem conhecida. Tanto `openclaw onboard --flow import` quanto `openclaw setup --wizard --import-from hermes` usam o mesmo provedor de migração de plugin e ainda mostram uma prévia antes de aplicar.

<Note>
Importações de onboarding exigem uma instalação nova do OpenClaw. Redefina a configuração, as credenciais, as sessões e o workspace primeiro se você já tiver estado local. Importações com backup mais sobrescrita ou mesclagem estão protegidas por feature gate para instalações existentes.
</Note>

## Relacionado

- [Migrando do Hermes](/pt-BR/install/migrating-hermes): passo a passo voltado ao usuário.
- [Migrando do Claude](/pt-BR/install/migrating-claude): passo a passo voltado ao usuário.
- [Migrando](/pt-BR/install/migrating): mova o OpenClaw para uma nova máquina.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade após aplicar uma migração.
- [Plugins](/pt-BR/tools/plugin): instalação e registro de plugins.
