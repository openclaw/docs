---
read_when:
    - Você quer que os agentes do OpenClaw em modo Codex usem plugins nativos do Codex
    - Você está migrando plugins do Codex selecionados pela OpenAI e instalados a partir do código-fonte
    - Você está solucionando problemas de codexPlugins, inventário de aplicativos, ações destrutivas ou diagnósticos de aplicativos de Plugin
summary: Configure os plugins nativos do Codex migrados para agentes OpenClaw no modo Codex
title: Plugins nativos do Codex
x-i18n:
    generated_at: "2026-05-12T00:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4cc1c7b6a97c6eb27eb10a7b14261ecfd398eff58fbd26cc2979a31e6f6a6c4
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

O suporte nativo a Plugin do Codex permite que um agente OpenClaw em modo Codex use os próprios recursos de app e Plugin do app-server do Codex dentro da mesma thread do Codex que processa a vez do OpenClaw.

O OpenClaw não traduz Plugins do Codex em ferramentas dinâmicas sintéticas `codex_plugin_*` do OpenClaw. As chamadas de Plugin permanecem na transcrição nativa do Codex, e o app-server do Codex é responsável pela execução MCP baseada em app.

Use esta página depois que o [Codex harness](/pt-BR/plugins/codex-harness) base estiver funcionando.

## Requisitos

- O runtime do agente OpenClaw selecionado deve ser o Codex harness nativo.
- `plugins.entries.codex.enabled` deve ser true.
- `plugins.entries.codex.config.codexPlugins.enabled` deve ser true.
- A V1 oferece suporte apenas a Plugins `openai-curated` que a migração observou como instalados a partir da origem no diretório inicial de origem do Codex.
- O app-server do Codex de destino deve conseguir ver o marketplace, o Plugin e o inventário de apps esperados.

`codexPlugins` não tem efeito em execuções PI, execuções normais do provedor OpenAI, associações de conversa ACP ou outros harnesses, porque esses caminhos não criam threads do app-server do Codex com configuração `apps` nativa.

## Início rápido

Pré-visualize a migração a partir do diretório inicial de origem do Codex:

```bash
openclaw migrate codex --dry-run
```

Aplique a migração quando o plano parecer correto:

```bash
openclaw migrate apply codex --yes
```

A migração grava entradas `codexPlugins` explícitas para Plugins elegíveis e chama `plugin/install` do app-server do Codex para os Plugins selecionados. Uma configuração migrada típica se parece com isto:

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

Depois de alterar `codexPlugins`, use `/new`, `/reset` ou reinicie o Gateway para que futuras sessões do Codex harness comecem com o conjunto de apps atualizado.

## Como a configuração nativa de Plugin funciona

A integração tem três estados separados:

- Instalado: o Codex tem o pacote local do Plugin no runtime do app-server de destino.
- Habilitado: a configuração do OpenClaw está disposta a disponibilizar o Plugin para as vezes do Codex harness.
- Acessível: o app-server do Codex confirma que as entradas de app do Plugin estão disponíveis para a conta ativa e podem ser mapeadas para a identidade do Plugin migrada.

A migração é a etapa durável de instalação/elegibilidade. O inventário de apps em runtime é a verificação de acessibilidade. Em seguida, a configuração da sessão do Codex harness calcula uma configuração restritiva de apps de thread para os apps de Plugin habilitados e acessíveis.

A configuração de apps de thread é calculada quando o OpenClaw estabelece uma sessão do Codex harness ou substitui uma associação de thread do Codex obsoleta. Ela não é recalculada a cada vez.

## Limite de suporte da V1

A V1 é intencionalmente restrita:

- Apenas Plugins `openai-curated` que já estavam instalados no inventário do app-server do Codex de origem são elegíveis para migração.
- A migração grava identidades explícitas de Plugin com `marketplaceName` e `pluginName`; ela não grava caminhos de cache locais `marketplacePath`.
- `codexPlugins.enabled` é o seletor de habilitação global.
- Não há curinga `plugins["*"]` nem chave de configuração que conceda autoridade arbitrária de instalação.
- Marketplaces sem suporte, pacotes de Plugin em cache, hooks e arquivos de configuração do Codex são preservados no relatório de migração para revisão manual.

## Inventário de apps e propriedade

O OpenClaw lê o inventário de apps do Codex por meio de `app/list` do app-server, armazena-o em cache por uma hora e atualiza entradas obsoletas ou ausentes de forma assíncrona.

Um app de Plugin é exposto apenas quando o OpenClaw consegue mapeá-lo de volta para o Plugin migrado por meio de propriedade estável:

- id exato do app a partir dos detalhes do Plugin
- nome de servidor MCP conhecido
- metadados estáveis únicos

Propriedade baseada apenas no nome de exibição ou ambígua é excluída até que a próxima atualização de inventário comprove a propriedade.

## Configuração de apps de thread

O OpenClaw injeta um patch restritivo `config.apps` para a thread do Codex: `_default` é desabilitado e apenas apps pertencentes a Plugins migrados habilitados são habilitados.

O OpenClaw define `destructive_enabled` no nível do app a partir da política efetiva global ou por Plugin `allow_destructive_actions` e deixa o Codex aplicar os metadados de ferramentas destrutivas a partir das anotações de ferramentas de app nativas. A configuração do app `_default` é desabilitada com `open_world_enabled: false`. Apps de Plugin habilitados são emitidos com `open_world_enabled: true`; o OpenClaw não expõe um controle separado de política open-world de Plugin e não mantém listas de negação de nomes de ferramentas destrutivas por Plugin.

O modo de aprovação de ferramentas é automático por padrão para apps de Plugin, para que ferramentas de leitura não destrutivas possam ser executadas sem uma UI de aprovação na mesma thread. Ferramentas destrutivas continuam controladas pela política `destructive_enabled` de cada app.

## Política de ação destrutiva

Elicitações destrutivas de Plugin são permitidas por padrão para Plugins do Codex migrados, enquanto schemas inseguros e propriedade ambígua ainda falham fechados:

- `allow_destructive_actions` global tem padrão `true`.
- `allow_destructive_actions` por Plugin substitui a política global para esse Plugin.
- Quando a política é `false`, o OpenClaw retorna uma recusa determinística.
- Quando a política é `true`, o OpenClaw aceita automaticamente apenas schemas seguros que ele consegue mapear para uma resposta de aprovação, como um campo booleano de aprovação.
- Identidade de Plugin ausente, propriedade ambígua, id de vez ausente, id de vez incorreto ou um schema de elicitação inseguro recusam em vez de solicitar confirmação.

## Solução de problemas

**`auth_required`:** a migração instalou o Plugin, mas um de seus apps ainda precisa de autenticação. A entrada explícita do Plugin é gravada como desabilitada até que você reautorize e a habilite.

**`marketplace_missing` ou `plugin_missing`:** o app-server do Codex de destino não consegue ver o marketplace ou Plugin `openai-curated` esperado. Execute novamente a migração contra o runtime de destino ou inspecione o status do Plugin no app-server do Codex.

**`app_inventory_missing` ou `app_inventory_stale`:** a prontidão do app veio de um cache vazio ou obsoleto. O OpenClaw agenda uma atualização assíncrona e exclui apps de Plugin até que a propriedade e a prontidão sejam conhecidas.

**`app_ownership_ambiguous`:** o inventário de apps correspondeu apenas pelo nome de exibição, portanto o app não é exposto à thread do Codex.

**A configuração mudou, mas o agente não consegue ver o Plugin:** use `/new`, `/reset` ou reinicie o Gateway. Associações existentes de thread do Codex mantêm a configuração de apps com a qual começaram até que o OpenClaw estabeleça uma nova sessão de harness ou substitua uma associação obsoleta.

**A ação destrutiva é recusada:** verifique os valores globais e por Plugin de `allow_destructive_actions`. Mesmo quando a política é true, schemas de elicitação inseguros e identidade de Plugin ambígua ainda falham fechados.

## Relacionados

- [Codex harness](/pt-BR/plugins/codex-harness)
- [Referência do Codex harness](/pt-BR/plugins/codex-harness-reference)
- [Runtime do Codex harness](/pt-BR/plugins/codex-harness-runtime)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migração](/pt-BR/cli/migrate)
