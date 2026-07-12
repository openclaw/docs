---
read_when:
    - Você quer que os agentes do OpenClaw no modo Codex usem plugins nativos do Codex
    - Você está migrando plugins do Codex selecionados pela OpenAI e instalados a partir do código-fonte
    - Você está configurando um plugin do Codex existente no diretório do workspace
    - Você está solucionando problemas de codexPlugins, inventário de aplicativos, ações destrutivas ou diagnósticos de aplicativos de Plugin
summary: Configure plugins nativos do Codex para agentes OpenClaw no modo Codex
title: Plugins nativos do Codex
x-i18n:
    generated_at: "2026-07-12T00:08:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

O suporte nativo a plugins do Codex permite que um agente OpenClaw no modo Codex use os recursos de aplicativos e plugins do próprio app-server do Codex dentro da mesma thread do Codex que processa o turno do OpenClaw. As chamadas de plugins permanecem na transcrição nativa do Codex; o app-server do Codex é responsável pela execução de MCP baseada em aplicativos. O OpenClaw não converte plugins do Codex em ferramentas dinâmicas sintéticas `codex_plugin_*` do OpenClaw.

Use esta página depois que o [harness do Codex](/pt-BR/plugins/codex-harness) básico estiver funcionando.

## Requisitos

- O runtime do agente deve ser o harness nativo do Codex.
- `plugins.entries.codex.enabled` deve ser `true`.
- `plugins.entries.codex.config.codexPlugins.enabled` deve ser `true`.
- O app-server do Codex de destino deve conseguir acessar o inventário esperado de marketplace, plugins e aplicativos.
- A migração oferece suporte somente a plugins `openai-curated` que ela tenha observado como instalados a partir do código-fonte no diretório inicial de origem do Codex.
- Plugins `workspace-directory` configurados manualmente exigem um app-server do Codex cujo `plugin/list` aceite `marketplaceKinds` e cujos resumos de workspace sem caminho incluam `remotePluginId`. O plugin já deve estar instalado e habilitado, e os aplicativos pertencentes a ele devem estar acessíveis em `app/list`.

`codexPlugins` não tem efeito sobre execuções de provedores do OpenClaw, vínculos de conversas ACP ou outros harnesses, pois esses caminhos nunca criam threads do app-server do Codex com uma configuração nativa de `apps`.

A conta do Codex no lado da OpenAI, a disponibilidade de aplicativos e os controles de aplicativos/plugins do workspace são definidos pela conta do Codex com sessão iniciada. Consulte [Como usar o Codex com seu plano do ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan) para conhecer o modelo de conta e administração da OpenAI.

## Início rápido

Visualize a migração a partir do diretório inicial de origem do Codex:

```bash
openclaw migrate codex --dry-run
```

Adicione `--verify-plugin-apps` para fazer a migração chamar o `app/list` de origem e exigir que todos os aplicativos pertencentes ao plugin estejam presentes, habilitados e acessíveis antes de planejar a ativação nativa:

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

Aplique a migração quando o plano estiver correto:

```bash
openclaw migrate apply codex --yes
```

A migração grava entradas explícitas em `codexPlugins` para plugins qualificados e chama `plugin/install` do app-server do Codex para os plugins selecionados. Uma configuração migrada tem esta aparência:

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

A migração continua limitada a `openai-curated`. Para usar um plugin `workspace-directory` existente, adicione-o manualmente com o `summary.id` exato, qualificado pelo marketplace, retornado por `plugin/list`. Por exemplo, se o Codex retornar `example-plugin@workspace-directory`, configure esse valor completo em vez do nome de exibição:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

O OpenClaw não chama `plugin/install` nem inicia a autenticação para um plugin `workspace-directory`. Instale, habilite e autentique-o no Codex antes de adicionar ou habilitar a política do OpenClaw. O OpenClaw mantém os aplicativos ocultos quando a resposta omite o marketplace exato, o ID do plugin, o ID dos detalhes ou evidências de prontidão do aplicativo. Se o Codex rejeitar a solicitação explícita de `plugin/list` do workspace, o OpenClaw relatará `marketplace_missing` para cada plugin de workspace habilitado e manterá disponíveis todos os plugins selecionados que tenham sido descobertos de forma independente.

Após uma alteração em `codexPlugins`, novas conversas do Codex adotam automaticamente o conjunto atualizado de aplicativos. Execute `/new` ou `/reset` para atualizar a conversa atual. Não é necessário reiniciar o Gateway para alterações de habilitação ou desabilitação de plugins.

## Gerenciar plugins pelo chat

`/codex plugins` inspeciona ou altera plugins nativos do Codex configurados no mesmo chat em que você opera o harness do Codex:

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` é um alias de `/codex plugins list`. A lista mostra a chave, o estado ativado/desativado, o nome do plugin do Codex e o marketplace de cada plugin configurado em `plugins.entries.codex.config.codexPlugins.plugins`.

`enable`/`disable` gravam somente em `~/.openclaw/openclaw.json`; eles nunca editam `~/.codex/config.toml` nem instalam novos plugins do Codex. Somente o proprietário ou um cliente do Gateway com o escopo `operator.admin` pode executá-los.

Habilitar um plugin configurado também ativa a chave global `codexPlugins.enabled`. Se um plugin selecionado tiver sido gravado como desabilitado porque a migração retornou `auth_required`, autorize novamente o aplicativo no Codex antes de habilitá-lo no OpenClaw. Para uma entrada `workspace-directory`, habilitá-la aqui altera somente a política do OpenClaw; o plugin e o aplicativo já devem estar ativos no Codex.

## Como funciona a configuração nativa de plugins

A integração acompanha três estados:

| Estado     | Significado                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalado  | O Codex tem o pacote do plugin no runtime do app-server de destino.                                                                          |
| Habilitado | O Codex informa que o plugin está habilitado, e a configuração do OpenClaw o permite nos turnos do harness do Codex.                         |
| Acessível  | O app-server do Codex confirma que as entradas de aplicativos do plugin estão disponíveis para a conta ativa e correspondem à identidade configurada do plugin. |

Para plugins `openai-curated`, a migração é a etapa durável de instalação e qualificação:

- Durante o planejamento, o OpenClaw lê os detalhes de `plugin/read` do Codex de origem e verifica se a conta do app-server do Codex de origem é uma conta com assinatura do ChatGPT. Uma resposta de conta ausente ou que não seja do ChatGPT ignora plugins baseados em aplicativos com `codex_subscription_required`.
- Por padrão, a migração não chama o `app/list` de origem: plugins de origem baseados em aplicativos que passam pela verificação da conta são planejados sem verificar a acessibilidade dos aplicativos de origem, e falhas de transporte na consulta da conta fazem com que sejam ignorados com `codex_account_unavailable`.
- Com `--verify-plugin-apps`, a migração obtém um novo snapshot de `app/list` da origem e exige que todos os aplicativos pertencentes ao plugin estejam presentes, habilitados e acessíveis antes de planejar a ativação nativa. Nesse caso, falhas de transporte na consulta da conta prosseguem para a verificação do inventário de aplicativos de origem em vez de fazer com que o plugin seja ignorado imediatamente.

Para plugins `workspace-directory`, a configuração ocorre fora do OpenClaw. O OpenClaw consulta esse marketplace somente quando há pelo menos uma entrada de workspace habilitada configurada, resolve cada plugin pelo `summary.id` exato e reutiliza as verificações existentes de propriedade de `plugin/read` e de prontidão de `app/list`. Um plugin não instalado, desabilitado, inacessível ou não autenticado não expõe aplicativos; o OpenClaw não tenta instalá-lo nem autenticá-lo.

O inventário de aplicativos do runtime é a verificação de acessibilidade da sessão de destino tanto para plugins selecionados migrados quanto para plugins de workspace configurados manualmente. A configuração da sessão do harness do Codex calcula uma configuração restritiva de aplicativos da thread com base nos aplicativos habilitados e acessíveis dos plugins; ela não é recalculada a cada turno, portanto `/codex plugins enable`/`disable` afeta somente novas conversas do Codex. Use `/new` ou `/reset` para aplicar a alteração à conversa atual.

## Limites do suporte na V1

- Somente plugins `openai-curated` já instalados no inventário do app-server do Codex de origem estão qualificados para migração.
- O runtime também oferece suporte a entradas explícitas de `workspace-directory` em versões do app-server cujo `plugin/list` implemente `marketplaceKinds` e retorne `remotePluginId` para resumos de workspace sem caminho. Essas entradas devem usar seu `summary.id` exato, qualificado pelo marketplace, e já devem estar instaladas, habilitadas e com os aplicativos acessíveis. Uma solicitação rejeitada de listagem do workspace produz o diagnóstico existente `marketplace_missing` por plugin; a ausência de evidências do marketplace, plugin, detalhes ou aplicativo não expõe nenhum aplicativo do workspace. O inventário selecionado da solicitação de listagem padrão continua utilizável.
- Plugins de origem baseados em aplicativos devem passar pela verificação de assinatura durante a migração. `--verify-plugin-apps` adiciona a verificação do inventário de aplicativos de origem. Contas barradas pela verificação de assinatura e, no modo de verificação, aplicativos de origem inacessíveis, desabilitados ou ausentes, bem como falhas na atualização do inventário de aplicativos, são relatados como itens manuais ignorados em vez de entradas de configuração habilitadas. Detalhes ilegíveis de plugins são ignorados antes da verificação do inventário de aplicativos.
- A migração grava identidades explícitas de plugins (`marketplaceName` e `pluginName`); ela não grava caminhos locais de cache em `marketplacePath`.
- `codexPlugins.enabled` é a única chave global de habilitação; não há um curinga `plugins["*"]` nem uma chave de configuração que conceda autoridade arbitrária de instalação.
- Marketplaces que não sejam selecionados, pacotes de plugins em cache, hooks e arquivos de configuração do Codex são preservados no relatório de migração para análise manual, e não ativados automaticamente. O runtime aceita entradas `workspace-directory` configuradas manualmente; outros marketplaces continuam sem suporte.

## Inventário e propriedade de aplicativos

O OpenClaw lê o inventário de aplicativos do Codex por meio do `app/list` do app-server, mantém-no em cache na memória por uma hora e atualiza entradas desatualizadas ou ausentes de forma assíncrona. O cache é local ao processo; reiniciar a CLI ou o Gateway o descarta, e o OpenClaw o recria a partir da próxima leitura de `app/list`.

A migração e o runtime usam chaves de cache separadas:

- A verificação da migração de origem usa o diretório inicial e as opções de inicialização do Codex de origem. Ela é executada somente com `--verify-plugin-apps` e força uma nova leitura completa de `app/list` da origem para essa execução de planejamento.
- A configuração do runtime de destino usa a identidade do app-server do Codex do agente de destino ao criar a configuração de aplicativos da thread. A ativação de plugins selecionados invalida essa chave de cache de destino e força sua atualização após `plugin/install`. A configuração de `workspace-directory` nunca executa esse caminho de ativação.

Um aplicativo de plugin é exposto somente quando o OpenClaw consegue associá-lo ao plugin configurado por meio de uma relação de propriedade estável: um ID de aplicativo exato nos detalhes do plugin, um nome de servidor MCP conhecido ou metadados estáveis e exclusivos. Relações de propriedade baseadas somente no nome de exibição ou ambíguas são excluídas até que a próxima atualização do inventário comprove a propriedade.

## Aplicativos de contas conectadas

Agentes operados pelo proprietário podem optar por todos os aplicativos já conectados à conta do Codex sem exigir um pacote de plugin correspondente:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true` obtém um snapshot completo de `app/list` quando uma nova thread nativa do Codex é estabelecida e admite somente aplicativos marcados como acessíveis para essa conta. Ele não instala, autentica nem habilita aplicativos globalmente. As threads existentes mantêm seu conjunto persistido de aplicativos; use `/new`, `/reset` ou reinicie o Gateway para aplicar aplicativos recém-conectados ou revogados.

Os aplicativos da conta herdam o valor global de `codexPlugins.allow_destructive_actions`, que aceita `true`, `false`, `"auto"` ou `"ask"`. A política explícita por plugin substitui a política global para IDs de aplicativos sobrepostos. Falhas de inventário bloqueiam o acesso por padrão, em vez de recorrer a um padrão irrestrito.

## Configuração de aplicativos da thread

O OpenClaw injeta uma modificação restritiva de `config.apps` para a conversa do Codex:
`_default` é desativado, e somente os apps pertencentes a plugins configurados e habilitados ou
os apps acessíveis da conta admitidos por `allow_all_plugins` são habilitados.

O valor de `destructive_enabled` em cada app vem da política efetiva global ou
por plugin `allow_destructive_actions`; `true`, `"auto"` e `"ask"`
definem `destructive_enabled: true`, enquanto `false` o define como `false`. O Codex ainda
aplica os metadados de ferramentas destrutivas provenientes das anotações nativas de ferramentas do app.
`_default` é desativado com `open_world_enabled: false`; os apps de plugins habilitados
recebem `open_world_enabled: true`. O OpenClaw não expõe um controle separado
de política de mundo aberto por plugin e não mantém listas de bloqueio de nomes
de ferramentas destrutivas por plugin.

O modo de aprovação de ferramentas usa o automático como padrão para os apps admitidos; portanto, ferramentas
de leitura não destrutivas são executadas sem uma solicitação de aprovação na mesma conversa. As ferramentas destrutivas permanecem
controladas pela política `destructive_enabled` de cada app.

## Política de ações destrutivas

As solicitações destrutivas de plugins são permitidas por padrão para plugins configurados do Codex,
enquanto esquemas inseguros e propriedade ambígua resultam em recusa segura:

- O padrão global de `allow_destructive_actions` é `true`.
- O valor de `allow_destructive_actions` por plugin substitui a política global para
  esse plugin.
- `false`: o OpenClaw retorna uma recusa determinística.
- `true`: o OpenClaw aceita automaticamente somente esquemas seguros que possa mapear para uma resposta
  de aprovação, como um campo booleano de aprovação.
- `"auto"`: o OpenClaw expõe ações destrutivas de plugins ao Codex e, em seguida,
  transforma solicitações de aprovação MCP com propriedade comprovada em aprovações de plugins
  do OpenClaw antes de retornar a resposta de aprovação do Codex.
- `"ask"`: o OpenClaw usa o mesmo controle de gravação/ações destrutivas do Codex que
  `"auto"`, limpa as substituições persistentes de aprovação por ferramenta do Codex para o app
  antes do início da conversa e oferece somente aprovação ou recusa de uso único, para que
  aprovações persistentes não possam suprimir solicitações posteriores de ações de gravação. Para cada
  app admitido que usa `"ask"`, o OpenClaw seleciona o revisor de aprovações humanas do Codex
  para esse app, para que o Codex envie suas solicitações de aprovação ao
  OpenClaw; outros apps e aprovações da conversa não relacionadas a apps mantêm o revisor
  e a política configurados.
- A ausência da identidade do plugin, propriedade ambígua, um ID de turno ausente ou incompatível
  ou um esquema de solicitação inseguro resulta em recusa, em vez de uma solicitação de aprovação.

## Solução de problemas

| Código                                            | Significado                                                                                                                                    | Correção                                                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | A migração instalou o plugin, mas um dos apps ainda precisa de autenticação. A entrada é gravada como desativada até que você a reautorize.     | Reautorize o app no Codex e, em seguida, habilite o plugin no OpenClaw.                                                          |
| `app_inaccessible`, `app_disabled`, `app_missing` | Com `--verify-plugin-apps`, o inventário de apps do Codex de origem não mostrou todos os apps pertencentes como presentes, habilitados e acessíveis. | Reautorize ou habilite o app no Codex e execute novamente a migração com `--verify-plugin-apps`.                                 |
| `app_inventory_unavailable`                       | A verificação estrita dos apps de origem foi solicitada, mas a atualização do inventário de apps do Codex de origem falhou.                    | Corrija o acesso ao servidor de apps do Codex de origem ou tente novamente sem `--verify-plugin-apps` para aceitar o plano mais rápido, condicionado à conta. |
| `codex_subscription_required`                     | A conta do servidor de apps do Codex de origem não era uma conta com assinatura do ChatGPT.                                                    | Entre no app Codex usando autenticação de assinatura e execute novamente a migração.                                             |
| `codex_account_unavailable`                       | Não foi possível ler a conta do servidor de apps do Codex de origem.                                                                           | Corrija a autenticação do servidor de apps do Codex de origem ou execute novamente com `--verify-plugin-apps` para que o inventário de apps de origem determine a elegibilidade. |
| `marketplace_missing`, `plugin_missing`           | O marketplace ou o plugin exato não está disponível; a solicitação explícita do catálogo do espaço de trabalho pode ter sido rejeitada; apps do espaço de trabalho resultam em recusa segura. | Verifique o contrato compatível do servidor de apps e o ID exato descrito abaixo.                                                |
| `plugin_detail_unavailable`                       | O OpenClaw não conseguiu ler os detalhes de propriedade do plugin.                                                                              | Inspecione as respostas `plugin/list` e `plugin/read` do servidor de apps de destino.                                            |
| `plugin_disabled`                                 | O Codex informa que o plugin está instalado, mas desativado.                                                                                    | A ativação selecionada pode corrigir isso; habilite um plugin do espaço de trabalho no Codex antes de tentar novamente.          |
| `plugin_activation_failed`                        | A ativação do plugin não foi concluída.                                                                                                         | Use o diagnóstico anexado para diferenciar falhas de marketplace, autenticação, atualização ou preparação do espaço de trabalho. |
| `app_inventory_missing`, `app_inventory_stale`    | A prontidão do app veio de um cache vazio ou desatualizado.                                                                                     | O OpenClaw agenda automaticamente uma atualização assíncrona; os apps de plugins permanecem excluídos até que a propriedade e a prontidão sejam conhecidas. |
| `app_ownership_ambiguous`                         | O inventário de apps encontrou correspondência somente pelo nome de exibição.                                                                   | O app permanece oculto da conversa do Codex até que uma atualização posterior comprove a propriedade.                           |

**O plugin do espaço de trabalho está instalado, mas não está visível:** confirme se o resultado de
`plugin/list` do espaço de trabalho informa o ID exato configurado como instalado e habilitado;
depois, confirme se `app/list` informa que todos os apps pertencentes estão acessíveis para a mesma conta
do Codex. O OpenClaw pode habilitar um app acessível para a conversa mesmo quando o
inventário da conta atualmente informa que esse app está desativado. Se você alterou esse estado depois que o Gateway armazenou o inventário de apps
em cache, aguarde a atualização do cache após uma hora ou reinicie o Gateway e, em seguida, use
`/new` ou `/reset`. O OpenClaw não corrige nem autentica plugins do espaço de trabalho.
Se a solicitação explícita da lista do espaço de trabalho for rejeitada, cada entrada habilitada do espaço de trabalho
informará `marketplace_missing`; entradas selecionadas não relacionadas ainda prosseguem
com base na resposta da lista padrão.

Para `plugin_detail_unavailable`, um resumo do espaço de trabalho sem caminho deve incluir
`remotePluginId`; o OpenClaw mantém os apps pertencentes ocultos quando esse seletor ou o
resultado subsequente de `plugin/read` não está disponível. Para
`plugin_activation_failed`, plugins selecionados podem informar uma falha de marketplace,
autenticação ou atualização após a instalação. Um plugin do espaço de trabalho informa esse código quando
ainda não está ativo; instale-o, habilite-o e autentique-o fora do OpenClaw.

**A configuração foi alterada, mas o agente não consegue ver o plugin:** execute `/codex plugins
list` para confirmar o estado configurado e, em seguida, `/new` ou `/reset`. Os vínculos de
conversas existentes do Codex mantêm a configuração de apps com a qual foram iniciados até que o OpenClaw
estabeleça uma nova sessão do ambiente de execução ou substitua um vínculo desatualizado.

**A ação destrutiva é recusada:** verifique os valores globais e por plugin de
`allow_destructive_actions`. Mesmo com `true`, `"auto"` ou `"ask"`,
esquemas de solicitação inseguros e identidade ambígua do plugin ainda resultam em recusa segura.

## Relacionados

- [Ambiente de execução do Codex](/pt-BR/plugins/codex-harness)
- [Referência do ambiente de execução do Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do ambiente de execução do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Referência de configuração](/pt-BR/gateway/configuration-reference#codex-harness-plugin-config)
- [CLI de migração](/pt-BR/cli/migrate)
