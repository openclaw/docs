---
read_when:
    - Você quer migrar do Hermes ou de outro sistema de agentes para o OpenClaw
    - Você está adicionando um provedor de migração pertencente a um plugin
summary: Referência da CLI para `openclaw migrate` (importar o estado de outro sistema de agentes)
title: Migrar
x-i18n:
    generated_at: "2026-07-11T23:51:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

Importe o estado de outro sistema de agentes por meio de um provedor de migração pertencente a um Plugin. Os provedores incluídos abrangem Claude, Codex CLI e [Hermes](/pt-BR/install/migrating-hermes); plugins podem registrar provedores adicionais.

<Tip>
Para obter guias passo a passo voltados ao usuário, consulte [Migrando do Claude](/pt-BR/install/migrating-claude) e [Migrando do Hermes](/pt-BR/install/migrating-hermes). A [central de migração](/pt-BR/install/migrating) lista todos os caminhos.
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

Executar `openclaw migrate <provider>` sem outras opções planeja, exibe uma prévia e, em uma TTY, solicita confirmação antes de aplicar. `openclaw migrate plan <provider>` e `openclaw migrate apply <provider>` separam a prévia e a aplicação em subcomandos distintos com as mesmas opções.

<ParamField path="<provider>" type="string">
  Nome de um provedor de migração registrado, por exemplo, `hermes`. Execute `openclaw migrate list` para ver os provedores instalados.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  Gere o plano e encerre sem alterar o estado.
</ParamField>
<ParamField path="--from <path>" type="string">
  Substitua o diretório de estado de origem. O padrão do Hermes é `~/.hermes`, o do Codex é `~/.codex` (ou `$CODEX_HOME`) e o do Claude é `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  Importe credenciais compatíveis sem solicitar confirmação. A aplicação interativa pergunta antes de importar credenciais de autenticação detectadas, com sim selecionado por padrão; o uso não interativo de `--yes` exige `--include-secrets` para importá-las.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  Ignore a importação de credenciais de autenticação, incluindo a solicitação interativa.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  Permita que a aplicação substitua destinos existentes quando o plano relatar conflitos.
</ParamField>
<ParamField path="--yes" type="boolean">
  Ignore a solicitação de confirmação. Obrigatório no modo não interativo.
</ParamField>
<ParamField path="--skill <name>" type="string">
  Selecione um item de cópia de skill pelo nome da skill ou pelo ID do item. Repita a opção para migrar várias skills. Quando omitida, as migrações interativas do Codex exibem um seletor de caixas de seleção, e as migrações não interativas mantêm todas as skills planejadas.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  Selecione um item de instalação de Plugin do Codex pelo nome do Plugin ou pelo ID do item. Repita a opção para migrar vários plugins do Codex. Quando omitida, as migrações interativas do Codex exibem um seletor nativo de caixas de seleção de plugins do Codex, e as migrações não interativas mantêm todos os plugins planejados. Aplica-se somente a plugins `openai-curated` do Codex instalados a partir da origem e descobertos pelo inventário do servidor de aplicativos do Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  Somente para Codex. Força uma nova varredura de `app/list` no servidor de aplicativos Codex de origem antes de planejar a ativação nativa de plugins. Desativado por padrão para manter rápido o planejamento da migração.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  Caminho ou diretório do arquivo de backup anterior à migração. Repassado para `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  Ignore o backup anterior à aplicação. Exige `--force` quando existe um estado local do OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  Obrigatório junto com `--no-backup` quando, de outra forma, a aplicação se recusaria a ignorar o backup.
</ParamField>
<ParamField path="--json" type="boolean">
  Exiba o plano ou o resultado da aplicação como JSON. Com `--json` e sem `--yes`, a aplicação exibe o plano e não altera o estado.
</ParamField>

## Modelo de segurança

`openclaw migrate` prioriza a prévia.

<AccordionGroup>
  <Accordion title="Prévia antes da aplicação">
    O provedor retorna um plano detalhado por item antes de qualquer alteração, incluindo conflitos, itens ignorados e itens confidenciais. Planos JSON, saídas da aplicação e relatórios de migração ocultam chaves aninhadas que aparentam conter segredos, como chaves de API, tokens, cabeçalhos de autorização, cookies e senhas.

    `openclaw migrate apply <provider>` exibe uma prévia do plano e solicita confirmação antes de alterar o estado, a menos que `--yes` esteja definido. No modo não interativo, a aplicação exige `--yes`.

  </Accordion>
  <Accordion title="Backups">
    A aplicação cria e verifica um backup do OpenClaw antes de aplicar a migração. Se ainda não existir um estado local do OpenClaw, a etapa de backup será ignorada e a migração continuará. Para ignorar um backup quando o estado existir, forneça `--no-backup` e `--force`.
  </Accordion>
  <Accordion title="Conflitos">
    A aplicação se recusa a continuar quando o plano contém conflitos. Revise o plano e execute novamente com `--overwrite` se a substituição dos destinos existentes for intencional. Os provedores ainda podem gravar backups por item dos arquivos substituídos no diretório do relatório de migração.
  </Accordion>
  <Accordion title="Segredos">
    A aplicação interativa pergunta se deve importar as credenciais de autenticação detectadas, com sim selecionado por padrão. Use `--no-auth-credentials` para ignorá-las ou `--include-secrets` para importar credenciais sem supervisão com `--yes`.
  </Accordion>
</AccordionGroup>

## Provedor do Claude

O provedor incluído do Claude detecta, por padrão, o estado do Claude Code em `~/.claude`. Use `--from <path>` para importar um diretório inicial ou uma raiz de projeto específicos do Claude Code.

<Tip>
Para obter um guia passo a passo voltado ao usuário, consulte [Migrando do Claude](/pt-BR/install/migrating-claude).
</Tip>

### O que o Claude importa

- `CLAUDE.md` e `.claude/CLAUDE.md` do projeto para o espaço de trabalho do agente OpenClaw (`AGENTS.md`).
- O `~/.claude/CLAUDE.md` do usuário, anexado ao `USER.md` do espaço de trabalho.
- Definições de servidores MCP provenientes de `.mcp.json` do projeto, `~/.claude.json` do Claude Code (incluindo suas entradas por projeto) e `claude_desktop_config.json` do Claude Desktop.
- Diretórios de skills do Claude que incluem `SKILL.md` (`~/.claude/skills` do usuário e `.claude/skills` do projeto).
- Arquivos Markdown de comandos do Claude (`~/.claude/commands` do usuário e `.claude/commands` do projeto), convertidos em skills do OpenClaw somente com invocação manual.

### Estado arquivado e para revisão manual

Hooks, permissões, padrões de ambiente, o `CLAUDE.local.md` do projeto, `.claude/rules`, diretórios `agents/` do usuário e do projeto e o histórico do projeto (`projects`, `cache` e `plans` em `~/.claude`) são preservados no relatório de migração ou relatados como itens para revisão manual. O OpenClaw não executa hooks, não copia listas amplas de permissões nem importa automaticamente o estado de credenciais do OAuth/Desktop.

## Provedor do Codex

O provedor incluído do Codex detecta, por padrão, o estado do Codex CLI em `~/.codex` ou em `CODEX_HOME` quando essa variável de ambiente está definida. Use `--from <path>` para inventariar um diretório inicial específico do Codex.

Use este provedor ao migrar para o ambiente de execução Codex do OpenClaw e quiser promover deliberadamente recursos pessoais úteis do Codex CLI. As inicializações locais do servidor de aplicativos Codex usam um `CODEX_HOME` por agente, portanto, por padrão, não leem seu `~/.codex` pessoal. O `HOME` normal do processo ainda é herdado, de modo que o Codex possa acessar skills compartilhadas e entradas do marketplace de plugins em `$HOME/.agents/*`, e os subprocessos possam encontrar configurações e tokens no diretório inicial do usuário.

Executar `openclaw migrate codex` em um terminal interativo exibe a prévia do plano completo e abre seletores de caixas de seleção antes da confirmação final da aplicação. Os itens de cópia de skills são solicitados primeiro. Use `Toggle all on` ou `Toggle all off` para seleção em massa. Pressione Espaço para alternar as linhas ou Enter para ativar a linha destacada e continuar. As skills planejadas começam marcadas, as skills em conflito começam desmarcadas, e `Skip for now` ignora as cópias de skills nesta execução, mas ainda continua para a seleção de plugins. Quando plugins selecionados do Codex instalados a partir da origem puderem ser migrados e `--plugin` não tiver sido fornecido, a migração solicitará a ativação nativa dos plugins do Codex pelo nome do Plugin. Os itens de plugins começam marcados, a menos que a configuração de plugins do Codex no OpenClaw de destino já contenha esse Plugin. Os plugins existentes no destino começam desmarcados e exibem uma indicação de conflito, como `conflict: plugin exists`; escolha `Toggle all off` para não migrar nenhum Plugin nativo do Codex nessa execução ou `Skip for now` para interromper antes da aplicação.

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
- Plugins `openai-curated` do Codex instalados a partir da origem e descobertos por meio de `plugin/list` do servidor de aplicativos Codex. O planejamento consulta `plugin/read` para cada Plugin instalado e habilitado.

A migração de plugins apoiados por aplicativos tem verificações adicionais:

- Plugins apoiados por aplicativos exigem que a conta do servidor de aplicativos Codex de origem seja uma conta com assinatura do ChatGPT. Respostas de contas que não sejam do ChatGPT ou respostas sem conta são ignoradas com `codex_subscription_required`.
- Por padrão, a migração não chama `app/list` na origem; assim, plugins apoiados por aplicativos que passam pela verificação da conta são planejados sem verificar a acessibilidade do aplicativo na origem, e falhas de transporte na consulta da conta são ignoradas com `codex_account_unavailable`.
- Forneça `--verify-plugin-apps` para forçar um novo instantâneo de `app/list` na origem e exigir que cada aplicativo pertencente à conta esteja presente, habilitado e acessível antes de planejar a ativação nativa. Nesse modo, falhas de transporte na consulta da conta prosseguem para a verificação do inventário de aplicativos da origem. O instantâneo é mantido na memória somente durante o processo atual; nunca é gravado na saída da migração nem na configuração de destino.

Plugins desabilitados, detalhes de plugins ilegíveis, contas de origem restritas por assinatura e, quando `--verify-plugin-apps` estiver definido, aplicativos ausentes, desabilitados ou inacessíveis tornam-se itens manuais ignorados, com motivos tipados, em vez de entradas na configuração de destino. A aplicação chama `plugin/install` no servidor de aplicativos para cada Plugin elegível selecionado, mesmo que o servidor de aplicativos de destino já informe que esse Plugin está instalado e habilitado. Os plugins migrados do Codex podem ser usados somente em sessões que selecionem o ambiente de execução nativo do Codex; eles não são expostos a execuções de provedores do OpenClaw, associações de conversas ACP nem outros ambientes de execução.

### Estado do Codex para revisão manual

O `config.toml` do Codex, os `hooks/hooks.json` nativos, marketplaces não selecionados, pacotes de plugins armazenados em cache que não sejam plugins selecionados instalados a partir da origem e plugins instalados a partir da origem que não passarem pela verificação de assinatura da origem não são ativados automaticamente. Quando `--verify-plugin-apps` está definido, plugins que não passam pela verificação do inventário de aplicativos da origem também são ignorados. Todos esses itens são copiados ou relatados no relatório de migração para revisão manual.

Para plugins selecionados migrados e instalados a partir da origem, a aplicação grava:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- uma entrada explícita de Plugin com `marketplaceName: "openai-curated"` e `pluginName` para cada Plugin selecionado

A migração nunca grava `plugins["*"]` nem armazena caminhos locais do cache do marketplace.

Os plugins ignorados não são gravados na configuração de destino. Falhas de assinatura no lado da origem são relatadas nos itens manuais com motivos tipados: `codex_subscription_required`, `codex_account_unavailable`, `plugin_disabled` ou `plugin_read_unavailable`. Com `--verify-plugin-apps`, falhas no inventário de aplicativos da origem também podem aparecer como `app_inaccessible`, `app_disabled`, `app_missing` ou `app_inventory_unavailable`. Instalações no lado do destino que exigem autenticação são relatadas no item do plugin afetado com `status: "skipped"`, `reason: "auth_required"` e identificadores de aplicativo sanitizados; as entradas de configuração explícitas correspondentes são gravadas como desabilitadas até que você as reautorize e habilite. Outras falhas de instalação são resultados `error` associados ao item.

Se o inventário de plugins do servidor de aplicativos do Codex estiver indisponível durante o planejamento, a migração recorrerá a itens de aviso do pacote armazenados em cache, em vez de fazer toda a migração falhar.

## Provedor Hermes

O provedor Hermes incluído detecta o estado em `~/.hermes` por padrão. Use `--from <path>` quando o Hermes estiver em outro local.

### O que o Hermes importa

- Configuração do modelo padrão de `config.yaml`.
- Provedores de modelos configurados e endpoints personalizados compatíveis com OpenAI de `providers` e `custom_providers`.
- Definições de servidores MCP de `mcp_servers` ou `mcp.servers`.
- `SOUL.md` e `AGENTS.md` para o espaço de trabalho do agente do OpenClaw.
- `memories/MEMORY.md` e `memories/USER.md` anexados aos arquivos de memória do espaço de trabalho.
- Padrões de configuração de memória para a memória em arquivos do OpenClaw, além de itens de arquivamento ou revisão manual para provedores externos de memória, como o Honcho.
- Skills que incluem um arquivo `SKILL.md` em `skills/<name>/`.
- Valores de configuração por Skill de `skills.config`.
- Credenciais OAuth do OpenAI no OpenCode provenientes do `auth.json` do OpenCode quando a migração interativa de credenciais é aceita ou quando `--include-secrets` está definido. As entradas OAuth do `auth.json` do Hermes são um estado legado relatado para reautenticação manual no OpenAI ou reparo pelo doctor.
- Chaves de API e tokens compatíveis provenientes do `.env` do Hermes e do `auth.json` do OpenCode quando a migração interativa de credenciais é aceita ou quando `--include-secrets` está definido.

### Chaves de `.env` compatíveis

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### Estado somente para arquivamento

O estado do Hermes que o OpenClaw não consegue interpretar com segurança é copiado para o relatório de migração para revisão manual, mas não é carregado na configuração nem nas credenciais ativas do OpenClaw. Isso preserva estados opacos ou inseguros sem fingir que o OpenClaw pode executá-los ou considerá-los confiáveis automaticamente: `plugins/`, `sessions/`, `logs/`, `cron/`, `mcp-tokens/`, `state.db`.

### Após aplicar

```bash
openclaw doctor
```

## Contrato de Plugin

As fontes de migração são plugins. Um plugin declara os IDs dos seus provedores em `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

Em tempo de execução, o plugin chama `api.registerMigrationProvider(...)`. O provedor implementa `detect`, `plan` e `apply`. O núcleo é responsável pela orquestração da CLI, pela política de backup, pelos prompts, pela saída JSON e pela verificação prévia de conflitos. O núcleo passa o plano revisado para `apply(ctx, plan)`, e os provedores só podem reconstruir o plano quando esse argumento estiver ausente por motivos de compatibilidade.

Os plugins de provedor podem usar `openclaw/plugin-sdk/migration` para a construção de itens e contagens do resumo, além de `openclaw/plugin-sdk/migration-runtime` para cópias de arquivos com reconhecimento de conflitos, cópias de relatórios somente para arquivamento, wrappers do tempo de execução de configuração armazenados em cache e relatórios de migração.

## Integração com a configuração inicial

A configuração inicial pode oferecer a migração quando um provedor detecta uma origem conhecida. Tanto `openclaw onboard --flow import` quanto `openclaw setup --wizard --import-from hermes` usam o mesmo provedor de migração do plugin e continuam exibindo uma prévia antes da aplicação.

<Note>
As importações durante a configuração inicial exigem uma instalação nova do OpenClaw. Redefina primeiro a configuração, as credenciais, as sessões e o espaço de trabalho se você já tiver um estado local. Importações com backup e substituição ou mesclagem são controladas por um sinalizador de recurso em instalações existentes.
</Note>

## Conteúdo relacionado

- [Migração do Hermes](/pt-BR/install/migrating-hermes): guia passo a passo voltado ao usuário.
- [Migração do Claude](/pt-BR/install/migrating-claude): guia passo a passo voltado ao usuário.
- [Migração](/pt-BR/install/migrating): transfira o OpenClaw para uma nova máquina.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade após aplicar uma migração.
- [Plugins](/pt-BR/tools/plugin): instalação e registro de plugins.
