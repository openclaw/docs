---
read_when:
    - Você quer que agentes OpenClaw em modo Codex usem plugins nativos do Codex
    - Você está migrando plugins Codex selecionados pela OpenAI instalados a partir do código-fonte
    - Você está solucionando problemas de codexPlugins, inventário de apps, ações destrutivas ou diagnósticos de apps de Plugin
summary: Configure Plugins nativos migrados do Codex para agentes OpenClaw em modo Codex
title: Plugins nativos do Codex
x-i18n:
    generated_at: "2026-06-27T17:46:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

O suporte nativo a Plugins do Codex permite que um agente OpenClaw em modo Codex use os recursos próprios de app e Plugin do app-server do Codex dentro da mesma thread do Codex que processa o turno do OpenClaw.

O OpenClaw não traduz Plugins do Codex em ferramentas dinâmicas sintéticas `codex_plugin_*` do OpenClaw. As chamadas de Plugin permanecem na transcrição nativa do Codex, e o app-server do Codex é responsável pela execução MCP baseada em app.

Use esta página depois que o [harness do Codex](/pt-BR/plugins/codex-harness) base estiver funcionando.

## Requisitos

- O runtime do agente OpenClaw selecionado deve ser o harness nativo do Codex.
- `plugins.entries.codex.enabled` deve ser true.
- `plugins.entries.codex.config.codexPlugins.enabled` deve ser true.
- A V1 oferece suporte apenas a Plugins `openai-curated` que a migração observou como instalados a partir da origem no diretório inicial de origem do Codex.
- O app-server do Codex de destino deve conseguir ver o marketplace, o Plugin e o inventário de apps esperados.

`codexPlugins` não tem efeito em execuções do OpenClaw, execuções normais do provedor OpenAI, vinculações de conversas ACP ou outros harnesses, porque esses caminhos não criam threads do app-server do Codex com configuração nativa de `apps`.

O acesso ao Codex pelo lado da OpenAI, a disponibilidade de apps e os controles de app/Plugin do workspace vêm da conta do Codex conectada. Para o modelo de conta e administração da OpenAI, veja [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Início rápido

Pré-visualize a migração a partir do diretório inicial de origem do Codex:

```bash
openclaw migrate codex --dry-run
```

Use verificação estrita do app de origem quando quiser que a migração verifique a acessibilidade do app de origem antes de planejar a ativação nativa do Plugin:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Aplique a migração quando o plano parecer correto:

```bash
openclaw migrate apply codex --yes
```

A migração grava entradas `codexPlugins` explícitas para Plugins elegíveis e chama `plugin/install` no app-server do Codex para os Plugins selecionados. Uma configuração migrada típica fica assim:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Depois de alterar `codexPlugins`, novas conversas do Codex captam automaticamente o conjunto de apps atualizado. Use `/new` ou `/reset` para atualizar a conversa atual. Reiniciar o gateway não é necessário para alterações de ativação ou desativação de Plugin.

## Gerenciar Plugins pelo chat

Use `/codex plugins` quando quiser inspecionar ou alterar Plugins nativos do Codex configurados no mesmo chat em que você opera o harness do Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` é um alias para `/codex plugins list`. A saída da lista mostra as chaves de Plugin configuradas, o estado ativado/desativado, o nome do Plugin do Codex e o marketplace de `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` e `disable` gravam apenas na configuração do OpenClaw em `~/.openclaw/openclaw.json`; eles não editam `~/.codex/config.toml` nem instalam novos Plugins do Codex. Somente o proprietário ou um cliente de Gateway com o escopo `operator.admin` pode alterar o estado do Plugin.

Ativar um Plugin configurado também liga a chave global `codexPlugins.enabled`. Se o Plugin foi gravado como desativado porque a migração retornou `auth_required`, reautorize o app no Codex antes de ativá-lo no OpenClaw.

## Como a configuração nativa de Plugins funciona

A integração tem três estados separados:

- Instalado: o Codex tem o pacote local do Plugin no runtime do app-server de destino.
- Ativado: a configuração do OpenClaw está disposta a disponibilizar o Plugin para turnos do harness do Codex.
- Acessível: o app-server do Codex confirma que as entradas de app do Plugin estão disponíveis para a conta ativa e podem ser mapeadas para a identidade de Plugin migrada.

A migração é a etapa durável de instalação/elegibilidade. Durante o planejamento, o OpenClaw lê detalhes `plugin/read` do Codex de origem e verifica se a resposta da conta do app-server do Codex de origem é uma conta de assinatura do ChatGPT. Respostas de conta ausentes ou que não sejam do ChatGPT ignoram Plugins baseados em app com `codex_subscription_required`. Por padrão, a migração não chama `app/list` de origem; Plugins de origem baseados em app que passam pelo gate de conta são planejados sem verificação de acessibilidade do app de origem, e falhas de transporte na consulta de conta são ignoradas com `codex_account_unavailable`. Com `--verify-plugin-apps`, a migração obtém um snapshot novo de `app/list` de origem e exige que todo app pertencente esteja presente, ativado e acessível antes de planejar a ativação nativa. Nesse modo, falhas de transporte na consulta de conta passam para o gate de inventário de apps de origem. O inventário de apps em runtime é a verificação de acessibilidade da sessão de destino após a migração. A configuração de sessão do harness do Codex então calcula uma configuração restritiva de apps da thread para os apps de Plugin ativados e acessíveis.

A configuração de apps da thread é calculada quando o OpenClaw estabelece uma sessão do harness do Codex ou substitui uma vinculação obsoleta de thread do Codex. Ela não é recalculada a cada turno, portanto `/codex plugins enable` e `/codex plugins disable` afetam novas conversas do Codex. Use `/new` ou `/reset` quando a conversa atual deve captar o conjunto de apps atualizado.

## Limite de suporte da V1

A V1 é intencionalmente restrita:

- Somente Plugins `openai-curated` que já estavam instalados no inventário do app-server do Codex de origem são elegíveis para migração.
- Plugins de origem baseados em app devem passar pelo gate de assinatura em tempo de migração. `--verify-plugin-apps` adiciona o gate de inventário de apps de origem. Contas bloqueadas por assinatura e, no modo de verificação, apps de origem inacessíveis, desativados ou ausentes, ou falhas de atualização do inventário de apps de origem, são relatados como itens manuais ignorados em vez de entradas de configuração ativadas. Detalhes de Plugin ilegíveis são ignorados antes do gate de inventário de apps de origem.
- A migração grava identidades explícitas de Plugin com `marketplaceName` e `pluginName`; ela não grava caminhos locais de cache `marketplacePath`.
- `codexPlugins.enabled` é a chave global de habilitação.
- Não há curinga `plugins["*"]` nem chave de configuração que conceda autoridade de instalação arbitrária.
- Marketplaces sem suporte, pacotes de Plugin em cache, hooks e arquivos de configuração do Codex são preservados no relatório de migração para revisão manual.

## Inventário e propriedade de apps

O OpenClaw lê o inventário de apps do Codex por meio de `app/list` do app-server, armazena-o em cache por uma hora e atualiza entradas obsoletas ou ausentes de forma assíncrona. O cache fica apenas em memória; reiniciar a CLI ou o Gateway o descarta, e o OpenClaw o reconstrói a partir da próxima leitura de `app/list`.

A migração e o runtime usam chaves de cache separadas:

- A verificação da migração de origem usa o diretório inicial de origem do Codex e as opções de inicialização do app-server de origem. Isso é executado apenas quando `--verify-plugin-apps` está definido, e força uma travessia nova de `app/list` de origem para essa execução de planejamento.
- A configuração de runtime de destino usa a identidade do app-server do Codex do agente de destino quando constrói a configuração de apps da thread do Codex. A ativação do Plugin invalida essa chave de cache de destino e então força sua atualização após `plugin/install`.

Um app de Plugin é exposto somente quando o OpenClaw consegue mapeá-lo de volta para o Plugin migrado por meio de propriedade estável:

- ID exato do app a partir dos detalhes do Plugin
- nome conhecido do servidor MCP
- metadados estáveis únicos

Propriedade apenas por nome de exibição ou ambígua é excluída até que a próxima atualização de inventário prove a propriedade.

## Configuração de apps da thread

O OpenClaw injeta um patch restritivo `config.apps` para a thread do Codex: `_default` é desativado e somente apps pertencentes a Plugins migrados ativados são ativados.

O OpenClaw define `destructive_enabled` no nível do app a partir da política efetiva global ou por Plugin `allow_destructive_actions` e deixa o Codex aplicar metadados de ferramentas destrutivas a partir das anotações nativas das ferramentas de app. `true`, `"auto"` e `"always"` definem `destructive_enabled: true`; `false` o define como false. A configuração do app `_default` é desativada com `open_world_enabled: false`. Apps de Plugin ativados são emitidos com `open_world_enabled: true`; o OpenClaw não expõe um controle separado de política open-world de Plugin e não mantém listas de bloqueio de nomes de ferramentas destrutivas por Plugin.

O modo de aprovação de ferramentas é automático por padrão para apps de Plugin, para que ferramentas de leitura não destrutivas possam executar sem uma UI de aprovação na mesma thread. Ferramentas destrutivas permanecem controladas pela política `destructive_enabled` de cada app.

## Política de ação destrutiva

Elicitações destrutivas de Plugin são permitidas por padrão para Plugins do Codex migrados, enquanto esquemas inseguros e propriedade ambígua ainda falham fechados:

- `allow_destructive_actions` global usa `true` por padrão.
- `allow_destructive_actions` por Plugin substitui a política global para esse Plugin.
- Quando a política é `false`, o OpenClaw retorna uma recusa determinística.
- Quando a política é `true`, o OpenClaw aceita automaticamente apenas esquemas seguros que consegue mapear para uma resposta de aprovação, como um campo booleano de aprovação.
- Quando a política é `"auto"`, o OpenClaw expõe ações destrutivas de Plugin ao Codex, mas transforma elicitações de aprovação MCP com propriedade comprovada em aprovações de Plugin do OpenClaw antes de retornar a resposta de aprovação do Codex.
- Quando a política é `"always"`, o OpenClaw usa o mesmo bloqueio de escrita/destrutivo do Codex que `"auto"`, limpa substituições duráveis de aprovação por ferramenta do Codex para o app antes de a thread iniciar e oferece apenas aprovação ou recusa de uso único, para que aprovações duráveis não possam suprimir prompts posteriores de ações de escrita.
- Identidade de Plugin ausente, propriedade ambígua, ID de turno ausente, ID de turno errado ou um esquema de elicitação inseguro recusam em vez de solicitar confirmação.

## Solução de problemas

**`auth_required`:** a migração instalou o Plugin, mas um de seus apps ainda precisa de autenticação. A entrada explícita do Plugin é gravada desativada até você reautorizar e ativá-la.

**`app_inaccessible`, `app_disabled` ou `app_missing`:** a migração não instalou o Plugin porque o inventário de apps do Codex de origem não mostrou todos os apps pertencentes como presentes, ativados e acessíveis enquanto `--verify-plugin-apps` estava definido. Reautorize ou ative o app no Codex e então execute novamente a migração com `--verify-plugin-apps`.

**`app_inventory_unavailable`:** a migração não instalou o Plugin porque a verificação estrita do app de origem foi solicitada e a atualização do inventário de apps do Codex de origem falhou. Corrija o acesso ao app-server do Codex de origem ou tente novamente sem `--verify-plugin-apps` se você aceitar o plano mais rápido com gate por conta.

**`codex_subscription_required`:** a migração não instalou o Plugin baseado em app porque a conta do app-server do Codex de origem não estava conectada com uma conta de assinatura do ChatGPT. Faça login no app do Codex com autenticação de assinatura e execute a migração novamente.

**`codex_account_unavailable`:** a migração não instalou o Plugin baseado em app porque a conta do app-server do Codex de origem não pôde ser lida. Corrija a autenticação do app-server do Codex de origem ou execute novamente com `--verify-plugin-apps` se quiser que o inventário de apps de origem decida a elegibilidade quando a consulta de conta falhar.

**`marketplace_missing` ou `plugin_missing`:** o app-server do Codex de destino não consegue ver o marketplace ou Plugin `openai-curated` esperado. Execute novamente a migração contra o runtime de destino ou inspecione o status do Plugin no app-server do Codex.

**`app_inventory_missing` ou `app_inventory_stale`:** a prontidão do app veio de um cache vazio ou obsoleto. O OpenClaw agenda uma atualização assíncrona e exclui apps de Plugin até que a propriedade e a prontidão sejam conhecidas.

**`app_ownership_ambiguous`:** o inventário de apps correspondeu apenas pelo nome de exibição, então o app não é exposto à thread do Codex.

**A configuração mudou, mas o agente não consegue ver o Plugin:** use `/codex plugins list` para confirmar o estado configurado e então use `/new` ou `/reset`. Vinculações existentes de thread do Codex mantêm a configuração de apps com que começaram até o OpenClaw estabelecer uma nova sessão de harness ou substituir uma vinculação obsoleta.

**Ação destrutiva recusada:** verifique os valores globais e por Plugin de
`allow_destructive_actions`. Mesmo quando a política é true, `"auto"` ou
`"always"`, esquemas de elicitação inseguros e identidade ambígua do Plugin ainda
falham fechados.

## Relacionado

- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Referência do harness Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrar CLI](/pt-BR/cli/migrate)
