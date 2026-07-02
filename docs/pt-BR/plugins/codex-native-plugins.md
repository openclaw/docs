---
read_when:
    - Você quer que agentes OpenClaw no modo Codex usem plugins nativos do Codex
    - Você está migrando plugins do Codex com curadoria da OpenAI instalados a partir do código-fonte
    - Você está solucionando problemas de codexPlugins, inventário de apps, ações destrutivas ou diagnósticos de apps de plugin
summary: Configurar Plugins Codex nativos migrados para agentes OpenClaw em modo Codex
title: Plugins nativos do Codex
x-i18n:
    generated_at: "2026-07-02T00:48:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

O suporte nativo a plugins do Codex permite que um agente OpenClaw em modo Codex use os recursos próprios de app e plugin do app-server do Codex dentro da mesma thread do Codex que processa o turno do OpenClaw.

O OpenClaw não traduz plugins do Codex para ferramentas dinâmicas sintéticas `codex_plugin_*` do OpenClaw. As chamadas de Plugin permanecem na transcrição nativa do Codex, e o app-server do Codex controla a execução MCP apoiada por app.

Use esta página depois que o [Codex harness](/pt-BR/plugins/codex-harness) base estiver funcionando.

## Requisitos

- O runtime de agente OpenClaw selecionado deve ser o harness nativo do Codex.
- `plugins.entries.codex.enabled` deve ser true.
- `plugins.entries.codex.config.codexPlugins.enabled` deve ser true.
- A V1 oferece suporte apenas a plugins `openai-curated` que a migração observou como instalados a partir da origem no home Codex de origem.
- O app-server Codex de destino deve conseguir ver o marketplace, o Plugin e o inventário de apps esperados.

`codexPlugins` não tem efeito em execuções do OpenClaw, execuções normais do provedor OpenAI, vinculações de conversas ACP ou outros harnesses, porque esses caminhos não criam threads do app-server Codex com configuração nativa de `apps`.

O acesso ao Codex no lado da OpenAI, a disponibilidade de apps e os controles de apps/plugins do workspace vêm da conta Codex conectada. Para o modelo de conta e administração da OpenAI, consulte [Usar o Codex com seu plano ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan).

## Início rápido

Pré-visualize a migração a partir do home Codex de origem:

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

A migração grava entradas explícitas de `codexPlugins` para plugins elegíveis e chama `plugin/install` do app-server Codex para os plugins selecionados. Uma configuração migrada típica se parece com isto:

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

Depois de alterar `codexPlugins`, novas conversas do Codex recebem automaticamente o conjunto de apps atualizado. Use `/new` ou `/reset` para atualizar a conversa atual. Não é necessário reiniciar o Gateway para alterações de ativação ou desativação de plugins.

## Gerenciar plugins pelo chat

Use `/codex plugins` quando quiser inspecionar ou alterar plugins nativos do Codex configurados a partir do mesmo chat em que você opera o harness do Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` é um alias para `/codex plugins list`. A saída da lista mostra as chaves de Plugin configuradas, o estado ligado/desligado, o nome do Plugin do Codex e o marketplace de `plugins.entries.codex.config.codexPlugins.plugins`.

`enable` e `disable` gravam apenas na configuração do OpenClaw em `~/.openclaw/openclaw.json`; eles não editam `~/.codex/config.toml` nem instalam novos plugins do Codex. Apenas o proprietário ou um cliente do Gateway com o escopo `operator.admin` pode alterar o estado de Plugin.

Ativar um Plugin configurado também liga a chave global `codexPlugins.enabled`. Se o Plugin foi gravado como desativado porque a migração retornou `auth_required`, reautorize o app no Codex antes de ativá-lo no OpenClaw.

## Como a configuração nativa de Plugin funciona

A integração tem três estados separados:

- Instalado: o Codex tem o pacote local do Plugin no runtime do app-server de destino.
- Ativado: a configuração do OpenClaw permite disponibilizar o Plugin para turnos do harness do Codex.
- Acessível: o app-server Codex confirma que as entradas de app do Plugin estão disponíveis para a conta ativa e podem ser mapeadas para a identidade de Plugin migrada.

A migração é a etapa durável de instalação/elegibilidade. Durante o planejamento, o OpenClaw lê detalhes de `plugin/read` do Codex de origem e verifica se a resposta da conta do app-server Codex de origem é de uma conta de assinatura ChatGPT. Respostas de conta ausentes ou que não sejam ChatGPT ignoram plugins apoiados por app com `codex_subscription_required`. Por padrão, a migração não chama `app/list` de origem; plugins de origem apoiados por app que passam pelo portão da conta são planejados sem verificação de acessibilidade do app de origem, e falhas de transporte na consulta de conta são ignoradas com `codex_account_unavailable`. Com `--verify-plugin-apps`, a migração tira um snapshot novo de `app/list` de origem e exige que todos os apps pertencentes estejam presentes, ativados e acessíveis antes de planejar a ativação nativa. Nesse modo, falhas de transporte na consulta de conta passam para o portão de inventário de apps de origem. O inventário de apps em runtime é a verificação de acessibilidade da sessão de destino após a migração. A configuração de sessão do harness do Codex então calcula uma configuração restritiva de apps da thread para os apps de Plugin ativados e acessíveis.

A configuração de apps da thread é calculada quando o OpenClaw estabelece uma sessão do harness do Codex ou substitui uma vinculação obsoleta de thread do Codex. Ela não é recalculada a cada turno; portanto, `/codex plugins enable` e `/codex plugins disable` afetam novas conversas do Codex. Use `/new` ou `/reset` quando a conversa atual precisar receber o conjunto de apps atualizado.

## Limite de suporte da V1

A V1 é intencionalmente restrita:

- Apenas plugins `openai-curated` que já estavam instalados no inventário do app-server Codex de origem são elegíveis para migração.
- Plugins de origem apoiados por app devem passar pelo portão de assinatura no momento da migração. `--verify-plugin-apps` adiciona o portão de inventário de apps de origem. Contas bloqueadas por assinatura e, no modo de verificação, apps de origem inacessíveis, desativados, ausentes ou falhas de atualização do inventário de apps de origem são relatados como itens manuais ignorados em vez de entradas de configuração ativadas. Detalhes de Plugin ilegíveis são ignorados antes do portão de inventário de apps de origem.
- A migração grava identidades explícitas de Plugin com `marketplaceName` e `pluginName`; ela não grava caminhos locais de cache `marketplacePath`.
- `codexPlugins.enabled` é a chave global de ativação.
- Não há curinga `plugins["*"]` nem chave de configuração que conceda autoridade arbitrária de instalação.
- Marketplaces sem suporte, pacotes de Plugin em cache, hooks e arquivos de configuração do Codex são preservados no relatório de migração para revisão manual.

## Inventário de apps e propriedade

O OpenClaw lê o inventário de apps do Codex por meio de `app/list` do app-server, armazena-o em cache por uma hora e atualiza entradas obsoletas ou ausentes de forma assíncrona. O cache fica apenas na memória; reiniciar a CLI ou o Gateway o descarta, e o OpenClaw o reconstrói a partir da próxima leitura de `app/list`.

Migração e runtime usam chaves de cache separadas:

- A verificação de migração de origem usa o home Codex de origem e as opções de inicialização do app-server de origem. Isso é executado apenas quando `--verify-plugin-apps` é definido, e força uma travessia nova de `app/list` de origem para aquela execução de planejamento.
- A configuração de runtime de destino usa a identidade do app-server Codex do agente de destino quando cria a configuração de apps da thread do Codex. A ativação de Plugin invalida essa chave de cache de destino e depois força sua atualização após `plugin/install`.

Um app de Plugin só é exposto quando o OpenClaw consegue mapeá-lo de volta para o Plugin migrado por meio de propriedade estável:

- id exato do app a partir do detalhe do Plugin
- nome conhecido do servidor MCP
- metadados estáveis exclusivos

Propriedade baseada apenas no nome de exibição ou ambígua é excluída até que a próxima atualização de inventário comprove a propriedade.

## Configuração de apps da thread

O OpenClaw injeta um patch restritivo de `config.apps` para a thread do Codex: `_default` é desativado, e apenas apps pertencentes a plugins migrados ativados são ativados.

O OpenClaw define `destructive_enabled` no nível do app a partir da política efetiva global ou por Plugin `allow_destructive_actions` e deixa o Codex impor metadados de ferramentas destrutivas a partir das anotações nativas de ferramentas do app. `true`, `"auto"` e `"ask"` definem `destructive_enabled: true`; `false` o define como false. A configuração do app `_default` é desativada com `open_world_enabled: false`. Apps de Plugin ativados são emitidos com `open_world_enabled: true`; o OpenClaw não expõe um controle separado de política open-world de Plugin e não mantém listas de negação por nome de ferramenta destrutiva por Plugin.

O modo de aprovação de ferramentas é automático por padrão para apps de Plugin, para que ferramentas de leitura não destrutivas possam ser executadas sem uma UI de aprovação na mesma thread. Ferramentas destrutivas continuam controladas pela política `destructive_enabled` de cada app.

## Política de ações destrutivas

Solicitações destrutivas de Plugin são permitidas por padrão para plugins Codex migrados, enquanto esquemas inseguros e propriedade ambígua ainda falham em modo fechado:

- `allow_destructive_actions` global tem padrão `true`.
- `allow_destructive_actions` por Plugin substitui a política global para esse Plugin.
- Quando a política é `false`, o OpenClaw retorna uma recusa determinística.
- Quando a política é `true`, o OpenClaw aceita automaticamente apenas esquemas seguros que consegue mapear para uma resposta de aprovação, como um campo booleano de aprovação.
- Quando a política é `"auto"`, o OpenClaw expõe ações destrutivas de Plugin ao Codex, mas transforma solicitações de aprovação MCP com propriedade comprovada em aprovações de Plugin do OpenClaw antes de retornar a resposta de aprovação do Codex.
- Quando a política é `"ask"`, o OpenClaw usa o mesmo bloqueio de escrita/destrutivo do Codex que `"auto"`, limpa substituições duráveis de aprovação por ferramenta do Codex para o app antes de a thread iniciar, e oferece apenas aprovação ou negação de uso único para que aprovações duráveis não possam suprimir prompts posteriores de ações de escrita.
- Para cada app admitido que usa `"ask"`, o OpenClaw seleciona o revisor de aprovações humanas do Codex para esse app, para que o Codex envie suas solicitações de aprovação ao OpenClaw. Outros apps e aprovações de thread que não sejam de app mantêm seu revisor e sua política configurados.
- Identidade de Plugin ausente, propriedade ambígua, id de turno ausente, id de turno incorreto ou esquema de solicitação inseguro recusam em vez de solicitar.

## Solução de problemas

**`auth_required`:** a migração instalou o Plugin, mas um de seus apps ainda precisa de autenticação. A entrada explícita do Plugin é gravada desativada até que você reautorize e ative-a.

**`app_inaccessible`, `app_disabled` ou `app_missing`:**
a migração não instalou o Plugin porque o inventário de apps do Codex de origem não mostrou todos os apps pertencentes como presentes, ativados e acessíveis enquanto `--verify-plugin-apps` estava definido. Reautorize ou ative o app no Codex e então execute novamente a migração com `--verify-plugin-apps`.

**`app_inventory_unavailable`:** a migração não instalou o Plugin porque a verificação estrita de apps de origem foi solicitada e a atualização do inventário de apps do Codex de origem falhou. Corrija o acesso ao app-server Codex de origem ou tente novamente sem `--verify-plugin-apps` se aceitar o plano mais rápido bloqueado apenas por conta.

**`codex_subscription_required`:** a migração não instalou o Plugin apoiado por app porque a conta do app-server Codex de origem não estava conectada com uma conta de assinatura ChatGPT. Entre no app Codex com autenticação de assinatura e então execute novamente a migração.

**`codex_account_unavailable`:** a migração não instalou o Plugin apoiado por app porque a conta do app-server Codex de origem não pôde ser lida. Corrija a autenticação do app-server Codex de origem ou execute novamente com `--verify-plugin-apps` se quiser que o inventário de apps de origem decida a elegibilidade quando a consulta de conta falhar.

**`marketplace_missing` ou `plugin_missing`:** o app-server Codex de destino não consegue ver o marketplace ou Plugin `openai-curated` esperado. Execute novamente a migração contra o runtime de destino ou inspecione o status de Plugin do app-server Codex.

**`app_inventory_missing` ou `app_inventory_stale`:** a prontidão do app veio de um cache vazio ou obsoleto. O OpenClaw agenda uma atualização assíncrona e exclui apps de Plugin até que propriedade e prontidão sejam conhecidas.

**`app_ownership_ambiguous`:** o inventário de apps correspondeu apenas por nome de exibição, então o app não é exposto à thread do Codex.

**A configuração mudou, mas o agente não consegue ver o Plugin:** use `/codex plugins
list` para confirmar o estado configurado e, em seguida, use `/new` ou `/reset`. As vinculações de threads
existentes do Codex mantêm a configuração do app com a qual começaram até que o OpenClaw
estabeleça uma nova sessão de harness ou substitua uma vinculação obsoleta.

**A ação destrutiva é recusada:** verifique os valores globais e por Plugin de
`allow_destructive_actions`. Mesmo quando a política é true, `"auto"` ou
`"ask"`, esquemas de elicitação inseguros e identidade ambígua de Plugin ainda falham
fechados.

## Relacionado

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#codex-harness-plugin-config)
- [Migrar CLI](/pt-BR/cli/migrate)
