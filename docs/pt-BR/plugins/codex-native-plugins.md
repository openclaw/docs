---
read_when:
    - Você quer que agentes OpenClaw em modo Codex usem plugins nativos do Codex
    - Você está migrando plugins do Codex selecionados pela OpenAI instalados a partir do código-fonte
    - Você está solucionando problemas de codexPlugins, inventário de aplicativos, ações destrutivas ou diagnósticos de aplicativos de Plugin
summary: Configure plugins nativos do Codex migrados para agentes OpenClaw em modo Codex
title: Plugins nativos do Codex
x-i18n:
    generated_at: "2026-05-11T20:33:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

O suporte nativo a plugins do Codex permite que um agente OpenClaw em modo Codex use os recursos de app e Plugin próprios do app-server do Codex dentro da mesma thread do Codex que processa o turno do OpenClaw.

O OpenClaw não traduz plugins do Codex para ferramentas dinâmicas sintéticas `codex_plugin_*` do OpenClaw. As chamadas de Plugin permanecem na transcrição nativa do Codex, e o app-server do Codex é responsável pela execução de MCP baseada em app.

Use esta página depois que o [harness do Codex](/pt-BR/plugins/codex-harness) base estiver funcionando.

## Requisitos

- O runtime do agente OpenClaw selecionado deve ser o harness nativo do Codex.
- `plugins.entries.codex.enabled` deve ser true.
- `plugins.entries.codex.config.codexPlugins.enabled` deve ser true.
- A V1 oferece suporte apenas a plugins `openai-curated` que a migração observou como instalados a partir do código-fonte no diretório home do Codex de origem.
- O app-server do Codex de destino deve conseguir ver o marketplace, o Plugin e o inventário de apps esperados.

`codexPlugins` não tem efeito em execuções PI, execuções normais do provedor OpenAI, vinculações de conversa ACP ou outros harnesses, porque esses caminhos não criam threads do app-server do Codex com configuração `apps` nativa.

## Início rápido

Pré-visualize a migração a partir do diretório home do Codex de origem:

```bash
openclaw migrate codex --dry-run
```

Aplique a migração quando o plano parecer correto:

```bash
openclaw migrate apply codex --yes
```

A migração grava entradas `codexPlugins` explícitas para plugins qualificados e chama `plugin/install` no app-server do Codex para os plugins selecionados. Uma configuração migrada típica se parece com isto:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

Depois de alterar `codexPlugins`, use `/new`, `/reset` ou reinicie o gateway para que sessões futuras do harness do Codex comecem com o conjunto de apps atualizado.

## Como a configuração nativa de Plugin funciona

A integração tem três estados separados:

- Instalado: o Codex tem o pacote de Plugin local no runtime do app-server de destino.
- Habilitado: a configuração do OpenClaw está disposta a disponibilizar o Plugin para turnos do harness do Codex.
- Acessível: o app-server do Codex confirma que as entradas de app do Plugin estão disponíveis para a conta ativa e podem ser mapeadas para a identidade do Plugin migrado.

A migração é a etapa durável de instalação/qualificação. O inventário de apps em runtime é a verificação de acessibilidade. A configuração de sessão do harness do Codex então calcula uma configuração restritiva de apps da thread para os apps de Plugin habilitados e acessíveis.

A configuração de apps da thread é calculada quando o OpenClaw estabelece uma sessão do harness do Codex ou substitui uma vinculação obsoleta de thread do Codex. Ela não é recalculada a cada turno.

## Limite de suporte da V1

A V1 é intencionalmente restrita:

- Apenas plugins `openai-curated` que já estavam instalados no inventário do app-server do Codex de origem são qualificados para migração.
- A migração grava identidades explícitas de Plugin com `marketplaceName` e `pluginName`; ela não grava caminhos de cache locais `marketplacePath`.
- `codexPlugins.enabled` é o interruptor global de habilitação.
- Não há curinga `plugins["*"]` nem chave de configuração que conceda autoridade de instalação arbitrária.
- Marketplaces sem suporte, pacotes de Plugin em cache, hooks e arquivos de configuração do Codex são preservados no relatório de migração para revisão manual.

## Inventário de apps e propriedade

O OpenClaw lê o inventário de apps do Codex por meio de `app/list` do app-server, armazena-o em cache por uma hora e atualiza entradas obsoletas ou ausentes de forma assíncrona.

Um app de Plugin só é exposto quando o OpenClaw consegue mapeá-lo de volta ao Plugin migrado por meio de propriedade estável:

- id exato do app a partir dos detalhes do Plugin
- nome conhecido do servidor MCP
- metadados estáveis exclusivos

Propriedade apenas por nome de exibição ou ambígua é excluída até que a próxima atualização de inventário comprove a propriedade.

## Configuração de apps da thread

O OpenClaw injeta um patch restritivo `config.apps` para a thread do Codex: `_default` é desabilitado e apenas apps pertencentes a plugins migrados habilitados são habilitados.

O OpenClaw define `destructive_enabled` no nível do app a partir da política global efetiva ou por Plugin de `allow_destructive_actions` e deixa o Codex aplicar os metadados de ferramentas destrutivas a partir de suas anotações nativas de ferramenta de app. A configuração do app `_default` é desabilitada com `open_world_enabled: false`. Apps de Plugin habilitados são emitidos com `open_world_enabled: true`; o OpenClaw não expõe um controle separado de política open-world de Plugin e não mantém listas de negação por Plugin para nomes de ferramentas destrutivas.

O modo de aprovação de ferramentas é automático por padrão para apps de Plugin, para que ferramentas de leitura não destrutivas possam ser executadas sem uma UI de aprovação na mesma thread. Ferramentas destrutivas continuam controladas pela política `destructive_enabled` de cada app.

## Política de ações destrutivas

Elicitações destrutivas de Plugin falham fechadas por padrão:

- O padrão global de `allow_destructive_actions` é `false`.
- `allow_destructive_actions` por Plugin substitui a política global para esse Plugin.
- Quando a política é `false`, o OpenClaw retorna uma recusa determinística.
- Quando a política é `true`, o OpenClaw aceita automaticamente apenas esquemas seguros que ele consegue mapear para uma resposta de aprovação, como um campo booleano de aprovação.
- Identidade de Plugin ausente, propriedade ambígua, id de turno ausente, id de turno incorreto ou um esquema de elicitação inseguro resultam em recusa em vez de solicitação.

## Solução de problemas

**`auth_required`:** a migração instalou o Plugin, mas um de seus apps ainda precisa de autenticação. A entrada explícita do Plugin é gravada como desabilitada até você reautorizar e habilitá-la.

**`marketplace_missing` ou `plugin_missing`:** o app-server do Codex de destino não consegue ver o marketplace ou Plugin `openai-curated` esperado. Execute a migração novamente contra o runtime de destino ou inspecione o status de Plugin do app-server do Codex.

**`app_inventory_missing` ou `app_inventory_stale`:** a prontidão do app veio de um cache vazio ou obsoleto. O OpenClaw agenda uma atualização assíncrona e exclui apps de Plugin até que a propriedade e a prontidão sejam conhecidas.

**`app_ownership_ambiguous`:** o inventário de apps só correspondeu pelo nome de exibição, então o app não é exposto à thread do Codex.

**A configuração mudou, mas o agente não consegue ver o Plugin:** use `/new`, `/reset` ou reinicie o gateway. Vinculações existentes de thread do Codex mantêm a configuração de apps com que começaram até que o OpenClaw estabeleça uma nova sessão de harness ou substitua uma vinculação obsoleta.

**A ação destrutiva foi recusada:** verifique os valores globais e por Plugin de `allow_destructive_actions`. Mesmo quando a política é true, esquemas de elicitação inseguros e identidade ambígua de Plugin ainda falham fechados.

## Relacionado

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migração](/pt-BR/cli/migrate)
