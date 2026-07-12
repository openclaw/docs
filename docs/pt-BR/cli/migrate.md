---
read_when:
    - Você quer migrar do Hermes ou de outro sistema de agentes para o OpenClaw
    - Você está adicionando um provedor de migração pertencente ao plugin
summary: Referência da CLI para `openclaw migrate` (importar o estado de outro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-07-12T15:01:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importe o estado de outro sistema de agentes por meio de um provedor de migração pertencente a um plugin. Os provedores incluídos abrangem Claude, Codex CLI e [Hermes](/pt-BR/install/migrating-hermes); plugins podem registrar provedores adicionais.

<Tip>
Para tutoriais voltados ao usuário, consulte [Migração do Claude](/pt-BR/install/migrating-claude) e [Migração do Hermes](/pt-BR/install/migrating-hermes). A [central de migração](/pt-BR/install/migrating) lista todos os caminhos.
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

Executar `openclaw migrate <provider>` sem outras opções planeja, exibe uma prévia e, em uma TTY, solicita confirmação antes da aplicação. `openclaw migrate plan <provider>` e `openclaw migrate apply <provider>` separam a prévia e a aplicação em subcomandos distintos com as mesmas opções.

<ParamField path="<provider>" type="string">
  Nome de um provedor de migração registrado, por exemplo, `hermes`. Execute `openclaw migrate list` para ver os provedores instalados.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Cria o plano e encerra sem alterar o estado.
</ParamField>
<ParamField path="--from <path>" type="string">
  Substitui o diretório de estado de origem. O padrão do Hermes é `~/.hermes`, o do Codex é `~/.codex` (ou `$CODEX_HOME`) e o do Claude é `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importa credenciais compatíveis sem solicitar confirmação. A aplicação interativa pergunta antes de importar credenciais de autenticação detectadas, com sim selecionado por padrão; a opção não interativa `--yes` exige `--include-secrets` para importá-las.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Ignora a importação de credenciais de autenticação, incluindo a solicitação interativa.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permite que a aplicação substitua destinos existentes quando o plano indicar conflitos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignora a solicitação de confirmação. Obrigatório no modo não interativo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Seleciona um item de cópia de skill pelo nome da skill ou pelo ID do item. Repita a opção para migrar várias skills. Quando omitida, as migrações interativas do Codex exibem um seletor com caixas de seleção, e as migrações não interativas mantêm todas as skills planejadas.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Seleciona um item de instalação de plugin do Codex pelo nome do plugin ou pelo ID do item. Repita a opção para migrar vários plugins do Codex. Quando omitida, as migrações interativas do Codex exibem um seletor nativo de plugins do Codex com caixas de seleção, e as migrações não interativas mantêm todos os plugins planejados. Aplica-se somente a plugins do Codex `openai-curated` instalados na origem e descobertos pelo inventário do app-server do Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Somente Codex. Força uma nova varredura `app/list` no app-server do Codex de origem antes de planejar a ativação nativa de plugins. Desativada por padrão para manter o planejamento da migração rápido.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Caminho ou diretório do arquivo de backup anterior à migração. Repassado para `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignora o backup anterior à aplicação. Exige `--force` quando existe estado local do OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Obrigatório junto com `--no-backup` quando, de outra forma, a aplicação se recusaria a ignorar o backup.
</ParamField>
<ParamField path="--json" type="boolean">
  Exibe o plano ou o resultado da aplicação como JSON. Com `--json` e sem `--yes`, a aplicação exibe o plano e não altera o estado.
</ParamField>

## Modelo de segurança

`openclaw migrate` prioriza a prévia.

<AccordionGroup>
  <Accordion title="Prévia antes da aplicação">
    O provedor retorna um plano detalhado por itens antes que qualquer alteração ocorra, incluindo conflitos, itens ignorados e itens confidenciais. Planos JSON, saída da aplicação e relatórios de migração ocultam chaves aninhadas que aparentam conter segredos, como chaves de API, tokens, cabeçalhos de autorização, cookies e senhas.

    `openclaw migrate apply <provider>` exibe a prévia do plano e solicita confirmação antes de alterar o estado, a menos que `--yes` esteja definido. No modo não interativo, a aplicação exige `--yes`.

  </Accordion>
  <Accordion title="Backups">
    A aplicação cria e verifica um backup do OpenClaw antes de aplicar a migração. Se ainda não existir estado local do OpenClaw, a etapa de backup será ignorada e a migração continuará. Para ignorar um backup quando houver estado, forneça `--no-backup` e `--force`.
  </Accordion>
  <Accordion title="Conflitos">
    A aplicação se recusa a continuar quando o plano apresenta conflitos. Revise o plano e execute novamente com `--overwrite` se a substituição dos destinos existentes for intencional. Os provedores ainda podem criar backups por item para arquivos substituídos no diretório do relatório de migração.
  </Accordion>
  <Accordion title="Segredos">
    A aplicação interativa pergunta se deve importar as credenciais de autenticação detectadas, com sim selecionado por padrão. Use `--no-auth-credentials` para ignorá-las ou `--include-secrets` para importar credenciais sem supervisão com `--yes`.
  </Accordion>
</AccordionGroup>

## Provedor Claude

O provedor Claude incluído detecta, por padrão, o estado do Claude Code em `~/.claude`. Use `--from <path>` para importar um diretório principal ou uma raiz de projeto específica do Claude Code.

<Tip>
Para um tutorial voltado ao usuário, consulte [Migração do Claude](/pt-BR/install/migrating-claude).
</Tip>

### O que o Claude importa

- O `CLAUDE.md` e o `.claude/CLAUDE.md` do projeto para o espaço de trabalho do agente OpenClaw (`AGENTS.md`).
- O `~/.claude/CLAUDE.md` do usuário anexado ao `USER.md` do espaço de trabalho.
- Definições de servidores MCP provenientes do `.mcp.json` do projeto, do `~/.claude.json` do Claude Code (incluindo suas entradas por projeto) e do `claude_desktop_config.json` do Claude Desktop.
- Diretórios de skills do Claude que incluem `SKILL.md` (`~/.claude/skills` do usuário e `.claude/skills` do projeto).
- Arquivos Markdown de comandos do Claude (`~/.claude/commands` do usuário e `.claude/commands` do projeto) convertidos em skills do OpenClaw somente com invocação manual.

### Estado de arquivamento e revisão manual

Hooks, permissões, padrões de ambiente, o `CLAUDE.local.md` do projeto, `.claude/rules`, diretórios `agents/` do usuário e do projeto e o histórico do projeto (`projects`, `cache`, `plans` em `~/.claude`) do Claude são preservados no relatório de migração ou indicados como itens para revisão manual. O OpenClaw não executa hooks, não copia listas de permissões abrangentes nem importa automaticamente o estado de credenciais do OAuth/Desktop.

## Provedor Codex

O provedor Codex incluído detecta, por padrão, o estado do Codex CLI em `~/.codex` ou em `CODEX_HOME` quando essa variável de ambiente está definida. Use `--from <path>` para inventariar um diretório principal específico do Codex.

Use este provedor ao migrar para o harness Codex do OpenClaw e quando quiser promover deliberadamente ativos pessoais úteis do Codex CLI. As inicializações locais do app-server do Codex usam um `CODEX_HOME` por agente, portanto, não leem seu `~/.codex` pessoal por padrão. O `HOME` normal do processo ainda é herdado, portanto, o Codex pode ver skills compartilhadas em `$HOME/.agents/*` e entradas do marketplace de plugins, e os subprocessos podem encontrar configurações e tokens no diretório principal do usuário.

Executar `openclaw migrate codex` em um terminal interativo exibe a prévia do plano completo e abre seletores com caixas de seleção antes da confirmação final da aplicação. Os itens de cópia de skills são solicitados primeiro. Use `Toggle all on` ou `Toggle all off` para seleção em massa. Pressione Espaço para alternar as linhas ou Enter para ativar a linha destacada e continuar. As skills planejadas começam marcadas, as skills com conflito começam desmarcadas e `Skip for now` ignora as cópias de skills nessa execução, mas continua para a seleção de plugins. Quando plugins selecionados do Codex instalados na origem podem ser migrados e `--plugin` não foi fornecido, a migração solicita em seguida a ativação nativa de plugins do Codex pelo nome do plugin. Os itens de plugin começam marcados, a menos que a configuração de plugins Codex do OpenClaw de destino já contenha esse plugin. Os plugins existentes no destino começam desmarcados e exibem uma indicação de conflito, como `conflict: plugin exists`; escolha `Toggle all off` para não migrar nenhum plugin nativo do Codex nessa execução ou `Skip for now` para interromper antes da aplicação.

Para execuções automatizadas ou exatas, selecione explicitamente uma ou mais skills ou plugins:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### O que o Codex importa

- Diretórios de skills do Codex CLI em `$CODEX_HOME/skills`, excluindo o cache `.system` do Codex.
- AgentSkills pessoais em `$HOME/.agents/skills`, copiadas para o espaço de trabalho atual do agente OpenClaw para propriedade por agente.
- Plugins do Codex `openai-curated` instalados na origem e descobertos por meio de `plugin/list` do app-server do Codex. O planejamento consulta `plugin/read` para cada plugin instalado e habilitado.

A migração de plugins vinculados a aplicativos tem verificações adicionais:

- Plugins vinculados a aplicativos exigem que a conta do app-server do Codex de origem seja uma conta com assinatura do ChatGPT. Respostas sem uma conta do ChatGPT ou sem uma conta são ignoradas com `codex_subscription_required`.
- Por padrão, a migração não chama `app/list` na origem; portanto, plugins vinculados a aplicativos que passam pela verificação da conta são planejados sem verificar a acessibilidade do aplicativo na origem, e falhas de transporte na consulta da conta são ignoradas com `codex_account_unavailable`.
- Forneça `--verify-plugin-apps` para forçar um novo snapshot de `app/list` na origem e exigir que todos os aplicativos pertencentes à conta estejam presentes, habilitados e acessíveis antes de planejar a ativação nativa. Nesse modo, falhas de transporte na consulta da conta passam para a verificação do inventário de aplicativos da origem. O snapshot é mantido na memória somente durante o processo atual; ele nunca é gravado na saída da migração nem na configuração de destino.

Plugins desabilitados, detalhes de plugins ilegíveis, contas de origem bloqueadas pela exigência de assinatura e, quando `--verify-plugin-apps` estiver definido, aplicativos ausentes, desabilitados ou inacessíveis tornam-se itens manuais ignorados com motivos tipados, em vez de entradas na configuração de destino. A aplicação chama `plugin/install` no app-server para cada plugin elegível selecionado, mesmo que o app-server de destino já informe que esse plugin está instalado e habilitado. Os plugins Codex migrados só podem ser usados em sessões que selecionam o harness Codex nativo; eles não são expostos a execuções de provedores do OpenClaw, associações de conversas ACP ou outros harnesses.

### Estado do Codex para revisão manual

O `config.toml` do Codex, os `hooks/hooks.json` nativos, marketplaces não selecionados, pacotes de plugins em cache que não sejam plugins selecionados instalados na origem e plugins instalados na origem que não passam pela verificação de assinatura da origem não são ativados automaticamente. Quando `--verify-plugin-apps` está definido, plugins que não passam pela verificação do inventário de aplicativos da origem também são ignorados. Todos esses itens são copiados ou informados no relatório de migração para revisão manual.

Para plugins selecionados instalados na origem que forem migrados, a aplicação grava:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- uma entrada explícita de plugin com `marketplaceName: "openai-curated"` e `pluginName` para cada plugin selecionado

A migração nunca grava `plugins["*"]` e nunca armazena caminhos locais do cache do marketplace.

Plugins ignorados não são gravados na configuração de destino. Falhas de assinatura no lado da origem são relatadas nos itens manuais com motivos tipados: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` ou `plugin_read_unavailable`. Com `--verify-plugin-apps`, falhas no inventário de aplicativos da origem também podem aparecer como `app_inaccessible`, `app_disabled`, `app_missing` ou `app_inventory_unavailable`. Instalações no lado do destino que exigem autenticação são relatadas no item do plugin afetado com `status: "skipped"`, `reason: "auth_required"` e identificadores de aplicativos higienizados; suas entradas explícitas de configuração são gravadas desabilitadas até que você as reautorize e habilite. Outras falhas de instalação são resultados `error` com escopo por item.

Se o inventário de plugins do servidor de aplicativos do Codex estiver indisponível durante o planejamento, a migração recorre a itens consultivos do pacote em cache, em vez de causar a falha de toda a migração.

## Provedor Hermes

O provedor Hermes incluído detecta o estado em `~/.hermes` por padrão. Use `--from <path>` quando o Hermes estiver em outro local.

### O que o Hermes importa

- Configuração do modelo padrão de `config.yaml`.
- Provedores de modelos configurados e endpoints personalizados compatíveis com OpenAI de `providers` e `custom_providers`.
- Definições de servidores MCP de `mcp_servers` ou `mcp.servers`.
- `SOUL.md` e `AGENTS.md` para o espaço de trabalho do agente OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` anexados aos arquivos de memória do espaço de trabalho.
- Padrões de configuração de memória para a memória de arquivos do OpenClaw, além de itens de arquivamento ou revisão manual para provedores externos de memória, como o Honcho.
- Skills que incluem um arquivo `SKILL.md` em `skills/<name>/`.
- Valores de configuração por Skill de `skills.config`.
- Credenciais OAuth do OpenAI no OpenCode provenientes do `auth.json` do OpenCode quando a migração interativa de credenciais é aceita ou quando `--include-secrets` é definido. As entradas OAuth do `auth.json` do Hermes são um estado legado relatado para reautenticação manual no OpenAI ou reparo pelo doctor.
- Chaves de API e tokens compatíveis do `.env` do Hermes e do `auth.json` do OpenCode quando a migração interativa de credenciais é aceita ou quando `--include-secrets` é definido.

### Chaves `.env` compatíveis

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Estado somente para arquivamento

O estado do Hermes que o OpenClaw não consegue interpretar com segurança é copiado para o relatório de migração para revisão manual, mas não é carregado na configuração ativa nem nas credenciais do OpenClaw. Isso preserva estados opacos ou inseguros sem fingir que o OpenClaw pode executá-los ou considerá-los confiáveis automaticamente: `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

### Após aplicar

```bash
openclaw doctor
```

## Contrato de Plugin

As fontes de migração são plugins. Um plugin declara seus IDs de provedor em `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Em tempo de execução, o plugin chama `api.registerMigrationProvider(...)`. O provedor implementa `detect`, `plan` e `apply`. O núcleo controla a orquestração da CLI, a política de backup, as solicitações interativas, a saída JSON e a verificação prévia de conflitos. O núcleo passa o plano revisado para `apply(ctx, plan)`, e os provedores podem reconstruir o plano somente quando esse argumento estiver ausente por motivos de compatibilidade.

Os plugins de provedor podem usar `openclaw/plugin-sdk/migration` para a construção de itens e contagens de resumo, além de `openclaw/plugin-sdk/migration-runtime` para cópias de arquivos com reconhecimento de conflitos, cópias de relatórios somente para arquivamento, wrappers do runtime de configuração em cache e relatórios de migração.

## Integração com a configuração inicial

A configuração inicial pode oferecer a migração quando um provedor detecta uma origem conhecida. Tanto `openclaw onboard --flow import` quanto `openclaw setup --wizard --import-from hermes` usam o mesmo provedor de migração do plugin e ainda exibem uma prévia antes da aplicação.

<Note>
As importações durante a configuração inicial exigem uma instalação nova do OpenClaw. Primeiro, redefina a configuração, as credenciais, as sessões e o espaço de trabalho caso já tenha um estado local. Importações com backup e substituição ou com mesclagem são controladas por funcionalidade para instalações existentes.
</Note>

## Relacionados

- [Migração do Hermes](/pt-BR/install/migrating-hermes): guia passo a passo para usuários.
- [Migração do Claude](/pt-BR/install/migrating-claude): guia passo a passo para usuários.
- [Migração](/pt-BR/install/migrating): mova o OpenClaw para uma nova máquina.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade após aplicar uma migração.
- [Plugins](/pt-BR/tools/plugin): instalação e registro de plugins.
