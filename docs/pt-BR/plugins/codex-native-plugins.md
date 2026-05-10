---
read_when:
    - Você quer que agentes OpenClaw em modo Codex usem plugins nativos do Codex
    - Você está migrando plugins do Codex selecionados pela OpenAI instalados a partir do código-fonte
    - Você está solucionando problemas de codexPlugins, inventário de apps, ações destrutivas ou diagnósticos de apps de Plugin
summary: Configure Plugins nativos do Codex migrados para agentes do OpenClaw em modo Codex
title: Plugins nativos do Codex
x-i18n:
    generated_at: "2026-05-10T19:41:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

O suporte nativo a plugins do Codex permite que um agente OpenClaw em modo Codex use
os próprios recursos de app e plugin do app-server do Codex dentro da mesma thread do Codex que
processa o turno do OpenClaw.

O OpenClaw não traduz plugins do Codex em ferramentas dinâmicas sintéticas
`codex_plugin_*` do OpenClaw. As chamadas de plugin permanecem na transcrição nativa do Codex, e
o app-server do Codex é responsável pela execução MCP respaldada por apps.

Use esta página depois que o [harness do Codex](/pt-BR/plugins/codex-harness) base estiver funcionando.

## Requisitos

- O runtime do agente OpenClaw selecionado deve ser o harness nativo do Codex.
- `plugins.entries.codex.enabled` deve ser true.
- `plugins.entries.codex.config.codexPlugins.enabled` deve ser true.
- A V1 oferece suporte apenas a plugins `openai-curated` que a migração observou como
  instalados a partir da origem na home do Codex de origem.
- O app-server do Codex de destino deve conseguir ver o marketplace,
  o plugin e o inventário de apps esperados.

`codexPlugins` não tem efeito em execuções do PI, execuções normais do provedor OpenAI, associações de conversa ACP
ou outros harnesses, porque esses caminhos não criam
threads do app-server do Codex com configuração nativa de `apps`.

## Início rápido

Pré-visualize a migração a partir da home do Codex de origem:

```bash
openclaw migrate codex --dry-run
```

Aplique a migração quando o plano parecer correto:

```bash
openclaw migrate apply codex --yes
```

A migração grava entradas explícitas de `codexPlugins` para plugins qualificados e chama
`plugin/install` do app-server do Codex para os plugins selecionados. Uma configuração migrada
típica se parece com isto:

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

Depois de alterar `codexPlugins`, use `/new`, `/reset` ou reinicie o gateway para que
futuras sessões do harness do Codex comecem com o conjunto de apps atualizado.

## Como a configuração nativa de plugins funciona

A integração tem três estados separados:

- Instalado: o Codex tem o pacote de plugin local no runtime do app-server de destino.
- Habilitado: a configuração do OpenClaw está disposta a disponibilizar o plugin para turnos
  do harness do Codex.
- Acessível: o app-server do Codex confirma que as entradas de app do plugin estão disponíveis
  para a conta ativa e podem ser mapeadas para a identidade de plugin migrada.

A migração é a etapa durável de instalação/qualificação. O inventário de apps em runtime é a
verificação de acessibilidade. Em seguida, a configuração da sessão do harness do Codex calcula uma
configuração restritiva de apps da thread para os apps de plugin habilitados e acessíveis.

A configuração de apps da thread é calculada quando o OpenClaw estabelece uma sessão do harness do Codex
ou substitui uma associação obsoleta de thread do Codex. Ela não é recalculada a cada turno.

## Limite de suporte da V1

A V1 é intencionalmente restrita:

- Apenas plugins `openai-curated` que já estavam instalados no inventário do app-server
  do Codex de origem são qualificados para migração.
- A migração grava identidades explícitas de plugin com `marketplaceName` e
  `pluginName`; ela não grava caminhos de cache locais de `marketplacePath`.
- `codexPlugins.enabled` é o interruptor de habilitação global.
- Não há curinga `plugins["*"]` nem chave de configuração que conceda autoridade arbitrária
  de instalação.
- Marketplaces sem suporte, pacotes de plugin em cache, hooks e arquivos de configuração do Codex
  são preservados no relatório de migração para revisão manual.

## Inventário de apps e propriedade

O OpenClaw lê o inventário de apps do Codex por meio de `app/list` do app-server, armazena em cache por
uma hora e atualiza entradas obsoletas ou ausentes de forma assíncrona.

Um app de plugin só é exposto quando o OpenClaw consegue mapeá-lo de volta para o plugin migrado
por meio de propriedade estável:

- id exato do app a partir dos detalhes do plugin
- nome conhecido do servidor MCP
- metadados estáveis exclusivos

Propriedade ambígua ou baseada apenas no nome de exibição é excluída até que a próxima atualização de inventário
comprove a propriedade.

## Configuração de apps da thread

O OpenClaw injeta um patch restritivo de `config.apps` para a thread do Codex:
`_default` é desabilitado e somente apps pertencentes a plugins migrados habilitados são
habilitados.

O OpenClaw define `destructive_enabled` no nível do app a partir da política efetiva global ou
por plugin de `allow_destructive_actions` e deixa o Codex aplicar os metadados de ferramentas
destrutivas a partir das anotações de ferramentas de app nativas dele. A configuração do app `_default`
é desabilitada com `open_world_enabled: false`. Apps de plugin habilitados
são emitidos com `open_world_enabled: true`; o OpenClaw não expõe um controle de política separado
de mundo aberto para plugins e não mantém listas de negação por nome de ferramenta destrutiva
por plugin.

O modo de aprovação de ferramentas usa solicitação por padrão para apps de plugin, porque o OpenClaw não
tem uma UI interativa de elicitação de app neste caminho de mesma thread.

## Política de ações destrutivas

Elicitações destrutivas de plugin falham fechadas por padrão:

- `allow_destructive_actions` global usa `false` por padrão.
- `allow_destructive_actions` por plugin substitui a política global para esse
  plugin.
- Quando a política é `false`, o OpenClaw retorna uma recusa determinística.
- Quando a política é `true`, o OpenClaw aceita automaticamente apenas esquemas seguros que ele consegue mapear para
  uma resposta de aprovação, como um campo booleano de aprovação.
- Identidade de plugin ausente, propriedade ambígua, id de turno ausente, id de turno incorreto
  ou um esquema de elicitação inseguro recusam em vez de solicitar.

## Solução de problemas

**`auth_required`:** a migração instalou o plugin, mas um de seus apps ainda
precisa de autenticação. A entrada explícita de plugin é gravada desabilitada até você
reautorizar e habilitá-la.

**`marketplace_missing` ou `plugin_missing`:** o app-server do Codex de destino
não consegue ver o marketplace ou plugin `openai-curated` esperado. Execute a migração novamente
contra o runtime de destino ou inspecione o status de plugin do app-server do Codex.

**`app_inventory_missing` ou `app_inventory_stale`:** a prontidão do app veio de um
cache vazio ou obsoleto. O OpenClaw agenda uma atualização assíncrona e exclui apps de plugin
até que a propriedade e a prontidão sejam conhecidas.

**`app_ownership_ambiguous`:** o inventário de apps correspondeu apenas pelo nome de exibição, então
o app não é exposto à thread do Codex.

**A configuração mudou, mas o agente não consegue ver o plugin:** use `/new`, `/reset` ou
reinicie o gateway. Associações de thread do Codex existentes mantêm a configuração de apps com que
começaram até que o OpenClaw estabeleça uma nova sessão de harness ou substitua uma
associação obsoleta.

**A ação destrutiva é recusada:** verifique os valores globais e por plugin de
`allow_destructive_actions`. Mesmo quando a política é true, esquemas de elicitação inseguros
e identidade de plugin ambígua ainda falham fechados.

## Relacionado

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migração](/pt-BR/cli/migrate)
