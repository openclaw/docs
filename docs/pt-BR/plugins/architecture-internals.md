---
read_when:
    - Implementação de hooks de runtime de provedores, ciclo de vida de canais ou pacotes de pacotes
    - Depuração da ordem de carregamento de plugins ou do estado do registro
    - Adição de um novo recurso de Plugin ou de um Plugin de mecanismo de contexto
summary: 'Aspectos internos da arquitetura de Plugins: pipeline de carregamento, registro, hooks de tempo de execução, rotas HTTP e tabelas de referência'
title: Detalhes internos da arquitetura de Plugins
x-i18n:
    generated_at: "2026-07-12T00:08:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para o modelo público de capacidades, os formatos de Plugin e os contratos de propriedade/execução, consulte [Arquitetura de Plugins](/pt-BR/plugins/architecture). Esta página aborda os mecanismos internos: pipeline de carregamento, registro, hooks de runtime, rotas HTTP do Gateway, caminhos de importação e tabelas de esquema.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente o seguinte:

1. descobre raízes de Plugins candidatas
2. lê manifestos de pacotes nativos ou compatíveis e metadados de pacotes
3. rejeita candidatos inseguros
4. normaliza a configuração de Plugins (`plugins.enabled`, `allow`, `deny`, `entries`, `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega os módulos nativos habilitados: módulos integrados já compilados usam um carregador nativo; código-fonte TypeScript local de terceiros usa o fallback emergencial do Jiti
7. chama os hooks nativos `register(api)` e coleta os registros no registro de Plugins
8. expõe o registro aos comandos e às superfícies de runtime

<Note>
`activate` é um alias legado de `register` — o carregador resolve aquele que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os Plugins integrados usam `register`; prefira `register` para novos Plugins.
</Note>

As verificações de segurança são executadas **antes** da execução do runtime. A descoberta bloqueia um candidato quando:

- sua entrada resolvida escapa da raiz do Plugin
- seu caminho (ou diretório raiz) permite gravação por qualquer usuário
- para Plugins não integrados, a propriedade do caminho não corresponde ao uid atual (ou ao root)

Para diretórios integrados com permissão de gravação por qualquer usuário, primeiro é feita uma tentativa de correção no local com `chmod` (instalações npm/globais podem distribuir diretórios de pacote com `0777`) antes de a verificação ser repetida; as verificações de propriedade são totalmente ignoradas para a origem integrada.

Os candidatos bloqueados ainda incluem seu id de Plugin no diagnóstico emitido quando ele é conhecido (incluindo ids resolvidos de um manifesto dentro de um diretório que, de outra forma, seria rejeitado), para que uma configuração que faça referência a esse id veja um Plugin bloqueado associado a um aviso de segurança do caminho, em vez de um erro não relacionado de "Plugin desconhecido".

### Comportamento orientado pelo manifesto

O manifesto é a fonte da verdade do plano de controle. O OpenClaw o utiliza para:

- identificar o Plugin
- descobrir canais/Skills/esquema de configuração ou capacidades do pacote declarados
- validar `plugins.entries.<id>.config`
- complementar rótulos e espaços reservados da interface de controle
- exibir metadados de instalação/catálogo
- preservar descritores leves de ativação e configuração sem carregar o runtime do Plugin

Para Plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra o comportamento efetivo, como hooks, ferramentas, comandos ou fluxos de provedores.

Os blocos opcionais `activation` e `setup` do manifesto permanecem no plano de controle. Eles são descritores compostos apenas por metadados para o planejamento da ativação e a descoberta da configuração; não substituem o registro no runtime, `register(...)` nem `setupEntry`. Consumidores de ativação em execução usam dicas de comandos, canais e provedores do manifesto para restringir o carregamento de Plugins antes da materialização mais ampla do registro:

- o carregamento da CLI restringe-se aos Plugins responsáveis pelo comando principal solicitado
- a configuração do canal/resolução do Plugin restringe-se aos Plugins responsáveis pelo id de canal solicitado
- a configuração explícita/resolução de runtime do provedor restringe-se aos Plugins responsáveis pelo id de provedor solicitado
- o planejamento da inicialização do Gateway usa `activation.onStartup` para importações explícitas na inicialização; Plugins sem metadados de inicialização são carregados somente por acionadores de ativação mais específicos

O planejador de ativação expõe tanto uma API somente de ids para chamadores existentes quanto uma API de plano para diagnósticos. As entradas do plano informam por que um Plugin foi selecionado, separando dicas explícitas de `activation.*` do fallback de propriedade do manifesto:

| Motivo (de dicas de `activation.*`)   | Motivo (da propriedade do manifesto)                                                           |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`       | —                                                                                              |
| `activation-capability-hint`          | —                                                                                              |
| `activation-channel-hint`             | `manifest-channel-owner` (`channels`)                                                          |
| `activation-command-hint`             | `manifest-command-alias` (`commandAliases`)                                                    |
| `activation-provider-hint`            | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`)   |
| `activation-route-hint`               | —                                                                                              |
| — (o acionador de hook não tem variante de dica) | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)          |

Essa separação dos motivos é o limite de compatibilidade: os metadados de Plugins existentes continuam funcionando, enquanto o novo código pode detectar dicas amplas ou comportamento de fallback sem alterar a semântica de carregamento do runtime.

Os pré-carregamentos de runtime durante solicitações que pedem o escopo amplo `all` ainda derivam um conjunto explícito de ids de Plugins efetivos com base na configuração, no planejamento da inicialização, nos canais configurados, nos slots e nas regras de habilitação automática (`resolveEffectivePluginIds` em `src/plugins/effective-plugin-ids.ts`). Se esse conjunto derivado estiver vazio, o OpenClaw mantém o escopo vazio em vez de ampliá-lo para todos os Plugins detectáveis.

A descoberta da configuração prefere ids pertencentes aos descritores, como `setup.providers` e `setup.cliBackends`, para restringir os Plugins candidatos antes de recorrer a `setup-api` para Plugins que ainda precisam de hooks de runtime durante a configuração. As listas de configuração de provedores usam `providerAuthChoices` do manifesto, opções de configuração derivadas de descritores e metadados do catálogo de instalação sem carregar o runtime do provedor. O valor explícito `setup.requiresRuntime: false` define um limite baseado somente em descritores; a omissão de `requiresRuntime` mantém o fallback legado de setup-api para compatibilidade. Se mais de um Plugin descoberto reivindicar o mesmo id normalizado de provedor de configuração ou backend de CLI, a busca da configuração recusará o proprietário ambíguo, em vez de depender da ordem de descoberta. Quando o runtime de configuração é executado, os diagnósticos do registro informam divergências entre `setup.providers` / `setup.cliBackends` e os provedores ou backends de CLI efetivamente registrados pela setup-api, sem bloquear Plugins legados.

### Limite do cache de Plugins

O OpenClaw não armazena em cache os resultados da descoberta de Plugins nem os dados diretos do registro de manifestos por períodos baseados no relógio. Instalações, edições de manifestos e alterações nos caminhos de carregamento devem ficar visíveis na próxima leitura explícita de metadados ou reconstrução de snapshot. O analisador do arquivo de manifesto mantém um cache limitado de assinaturas de arquivos, indexado pelo caminho do manifesto aberto junto com dispositivo/inode, tamanho e mtime/ctime; esse cache apenas evita analisar novamente bytes inalterados e não deve armazenar em cache respostas sobre descoberta, registro, proprietário ou política.

O caminho rápido e seguro para metadados é a propriedade explícita de objetos, não um cache oculto. Os caminhos críticos de inicialização do Gateway devem passar o `PluginMetadataSnapshot` atual, a `PluginLookUpTable` derivada ou um registro explícito de manifestos pela cadeia de chamadas. A validação da configuração, a habilitação automática na inicialização, a inicialização de Plugins e a seleção de provedores podem reutilizar esses objetos enquanto eles representarem a configuração e o inventário de Plugins atuais. A busca da configuração ainda reconstrói os metadados do manifesto sob demanda, a menos que o caminho específico da configuração receba um registro explícito de manifestos; mantenha isso como um fallback de caminho pouco utilizado, em vez de adicionar caches ocultos de busca. Quando a entrada mudar, reconstrua e substitua o snapshot em vez de modificá-lo ou manter cópias históricas. As visualizações do registro de Plugins ativo e os auxiliares de inicialização de canais integrados devem ser recalculados com base no registro/raiz atual. Mapas de curta duração podem ser usados dentro de uma única chamada para eliminar trabalho duplicado ou impedir reentrada; eles não devem se tornar caches de metadados do processo.

Para o carregamento de Plugins, a camada de cache persistente é o carregamento do runtime. Ela pode reutilizar o estado do carregador quando o código ou os artefatos instalados forem efetivamente carregados, como:

- `PluginLoaderCacheState` e registros de runtime ativos compatíveis
- caches de jiti/módulos e caches do carregador de superfícies públicas usados para evitar a importação repetida da mesma superfície de runtime
- caches do sistema de arquivos para artefatos de Plugins instalados
- mapas de curta duração por chamada para normalização de caminhos ou resolução de duplicatas

Esses caches são detalhes de implementação do plano de dados. Eles não devem responder a perguntas do plano de controle, como "qual Plugin é responsável por este provedor?", a menos que o chamador tenha solicitado deliberadamente o carregamento do runtime.

Não adicione caches persistentes ou baseados no relógio para:

- resultados da descoberta
- registros diretos de manifestos
- registros de manifestos reconstruídos a partir do índice de Plugins instalados
- busca do proprietário do provedor, supressão de modelos, política do provedor ou metadados de artefatos públicos
- qualquer outra resposta derivada de manifestos em que uma alteração no manifesto, no índice instalado ou no caminho de carregamento deva ficar visível na próxima leitura de metadados

Os chamadores que reconstroem os metadados dos manifestos a partir do índice persistente de Plugins instalados reconstroem esse registro sob demanda. O índice instalado é um estado durável do plano de origem; ele não é um cache oculto de metadados no processo.

## Modelo de registro

Os Plugins carregados não modificam diretamente variáveis globais aleatórias do núcleo. Eles se registram em um registro central de Plugins (`PluginRegistry` em `src/plugins/registry-types.ts`), que acompanha registros de Plugins (identidade, origem do código, origem, status, diagnósticos), além de matrizes para cada capacidade: ferramentas, hooks legados e tipados, canais, provedores, manipuladores RPC do Gateway, rotas HTTP, registradores de CLI, serviços em segundo plano, comandos pertencentes a Plugins e dezenas de outras famílias tipadas de provedores (fala, embeddings, geração de imagens/vídeos/música, busca/obtenção na web, estruturas de agentes, ações de sessão e assim por diante).

Os recursos do núcleo então leem esse registro em vez de se comunicarem diretamente com os módulos dos Plugins. Isso mantém o carregamento unidirecional:

- módulo do Plugin -> registro no registro central
- runtime do núcleo -> consumo do registro

Essa separação é importante para a manutenibilidade. Ela significa que a maioria das superfícies do núcleo precisa de apenas um ponto de integração: "ler o registro", e não "tratar cada módulo de Plugin como caso especial".

## Callbacks de vinculação de conversas

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback após uma solicitação de vinculação ser aprovada ou negada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos do payload do callback:

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: a vinculação resolvida para solicitações aprovadas
- `request`: o resumo da solicitação original, a dica de desvinculação, o id do remetente e os metadados da conversa

Esse callback serve apenas para notificação. Ele não altera quem tem permissão para vincular uma conversa e é executado após a conclusão do processamento da aprovação pelo núcleo.

## Hooks de runtime de provedores

Os Plugins de provedores têm três camadas:

- **Metadados do manifesto** para uma busca leve antes do runtime: `setup.providers[].envVars`, a compatibilidade obsoleta `providerAuthEnvVars`, `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hooks durante a configuração**: `catalog` (o legado `discovery`) e `applyConfigDefaults`.
- **Hooks de runtime**: mais de 40 hooks opcionais que abrangem autenticação, resolução de modelos, encapsulamento de fluxos, níveis de raciocínio, política de repetição e endpoints de uso. Consulte [Ordem e uso dos hooks](#hook-order-and-usage).

O OpenClaw ainda é responsável pelo loop genérico do agente, failover, processamento de transcrições e política de ferramentas. Esses hooks são a superfície de extensão para comportamentos específicos de provedores sem a necessidade de um transporte de inferência personalizado completo.

Use `setup.providers[].envVars` no manifesto quando o provedor tiver credenciais baseadas em variáveis de ambiente que os fluxos genéricos de autenticação/status/seletor de modelos devam detectar sem carregar o runtime do plugin. O `providerAuthEnvVars` obsoleto ainda é lido pelo adaptador de compatibilidade durante o período de descontinuação, e plugins não incluídos no pacote que o utilizam recebem um diagnóstico de manifesto. Use `providerAuthAliases` no manifesto quando um ID de provedor precisar reutilizar as variáveis de ambiente, os perfis de autenticação, a autenticação baseada em configuração e a opção de integração com chave de API de outro ID de provedor. Use `providerAuthChoices` no manifesto quando as interfaces de CLI de integração/escolha de autenticação precisarem conhecer o ID da opção do provedor, os rótulos dos grupos e a configuração simples da autenticação por uma única opção, sem carregar o runtime do provedor. Mantenha `envVars` no runtime do provedor para orientações destinadas ao operador, como rótulos de integração ou variáveis de configuração de ID/segredo do cliente OAuth.

Use `channelEnvVars` no manifesto quando um canal tiver autenticação ou configuração orientada por variáveis de ambiente que o fallback genérico para variáveis de ambiente do shell, as verificações de configuração/status ou os prompts de configuração devam detectar sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para plugins de modelo/provedor, o OpenClaw chama os hooks aproximadamente nesta ordem.
A coluna "Quando usar" é o guia rápido para a decisão.
Os campos de provedor exclusivos para compatibilidade que o OpenClaw não chama mais, como
`ProviderPlugin.capabilities` e `suppressBuiltInModel`, não são listados aqui intencionalmente.

| Hook                              | O que faz                                                                                                                | Quando usar                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                              | O provedor é responsável por um catálogo ou por padrões de URL base                                                                                                                          |
| `applyConfigDefaults`             | Aplica padrões de configuração global definidos pelo provedor durante a materialização da configuração                   | Os padrões dependem do modo de autenticação, do ambiente ou da semântica da família de modelos do provedor                                                                                    |
| _(consulta de modelo integrada)_  | O OpenClaw tenta primeiro o caminho normal do registro/catálogo                                                          | _(não é um hook de Plugin)_                                                                                                                                                                   |
| `normalizeModelId`                | Normaliza aliases legados ou de prévia de IDs de modelo antes da consulta                                                | O provedor é responsável pela limpeza de aliases antes da resolução canônica do modelo                                                                                                       |
| `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo                                  | O provedor é responsável pela limpeza do transporte para IDs de provedor personalizados da mesma família de transporte                                                                       |
| `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução em tempo de execução/do provedor                                     | O provedor precisa de uma limpeza de configuração que deve ficar no Plugin; auxiliares integrados da família Google também oferecem suporte de contingência às entradas de configuração Google compatíveis |
| `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo aos provedores da configuração                           | O provedor precisa de correções de metadados de uso de streaming nativo determinadas pelo endpoint                                                                                           |
| `resolveConfigApiKey`             | Resolve a autenticação por marcador de ambiente para provedores da configuração antes do carregamento da autenticação em tempo de execução | Os provedores expõem seus próprios hooks de resolução de chave de API por marcador de ambiente                                                                                                |
| `resolveSyntheticAuth`            | Disponibiliza autenticação local/auto-hospedada ou baseada em configuração sem persistir texto simples                    | O provedor pode operar com um marcador de credencial sintética/local                                                                                                                          |
| `resolveExternalAuthProfiles`     | Sobrepõe perfis de autenticação externos definidos pelo provedor; o padrão de `persistence` é `runtime-only` para credenciais pertencentes à CLI/ao aplicativo | O provedor reutiliza credenciais de autenticação externas sem persistir tokens de atualização copiados; declare `contracts.externalAuthProviders` no manifesto                                |
| `shouldDeferSyntheticProfileAuth` | Reduz a precedência de espaços reservados de perfis sintéticos armazenados em relação à autenticação baseada em ambiente/configuração | O provedor armazena perfis sintéticos de espaço reservado que não devem ter precedência                                                                                                       |
| `resolveDynamicModel`             | Fallback síncrono para IDs de modelo definidos pelo provedor que ainda não estão no registro local                        | O provedor aceita IDs de modelo upstream arbitrários                                                                                                                                          |
| `prepareDynamicModel`             | Executa o aquecimento assíncrono e, em seguida, `resolveDynamicModel` é executado novamente                               | O provedor precisa de metadados de rede antes de resolver IDs desconhecidos                                                                                                                   |
| `normalizeResolvedModel`          | Reescrita final antes de o executor incorporado usar o modelo resolvido                                                  | O provedor precisa de reescritas de transporte, mas ainda usa um transporte do núcleo                                                                                                         |
| `normalizeToolSchemas`            | Normaliza os esquemas das ferramentas antes que o executor incorporado os receba                                         | O provedor precisa de limpeza de esquema específica da família de transporte                                                                                                                  |
| `inspectToolSchemas`              | Disponibiliza diagnósticos de esquema definidos pelo provedor após a normalização                                         | O provedor deseja avisos de palavras-chave sem ensinar ao núcleo regras específicas do provedor                                                                                               |
| `resolveReasoningOutputMode`      | Seleciona o contrato de saída de raciocínio nativo ou com tags                                                            | O provedor precisa de saída de raciocínio/final com tags em vez de campos nativos                                                                                                             |
| `prepareExtraParams`              | Normaliza os parâmetros da solicitação antes dos wrappers genéricos de opções de streaming                               | O provedor precisa de parâmetros de solicitação padrão ou de limpeza de parâmetros específica do provedor                                                                                    |
| `createStreamFn`                  | Substitui totalmente o caminho normal de streaming por um transporte personalizado                                       | O provedor precisa de um protocolo de comunicação personalizado, não apenas de um wrapper                                                                                                     |
| `wrapStreamFn`                    | Wrapper de streaming aplicado depois dos wrappers genéricos                                                              | O provedor precisa de wrappers de compatibilidade para cabeçalhos/corpo/modelo da solicitação sem um transporte personalizado                                                                 |
| `resolveTransportTurnState`       | Anexa cabeçalhos ou metadados de transporte nativos por turno                                                             | O provedor deseja que transportes genéricos enviem uma identidade de turno nativa do provedor                                                                                                 |
| `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos WebSocket nativos ou uma política de período de espera da sessão                                         | O provedor deseja que transportes WS genéricos ajustem os cabeçalhos da sessão ou a política de fallback                                                                                      |
| `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado se torna a string `apiKey` em tempo de execução                 | O provedor armazena metadados de autenticação adicionais e precisa de um formato personalizado de token em tempo de execução                                                                  |
| `refreshOAuth`                    | Substituição da atualização OAuth para endpoints de atualização personalizados ou uma política de falha de atualização   | O provedor não é compatível com os atualizadores compartilhados do OpenClaw                                                                                                                   |
| `buildAuthDoctorHint`             | Dica de reparo acrescentada quando a atualização OAuth falha                                                              | O provedor precisa de orientações de reparo de autenticação definidas pelo próprio provedor após uma falha de atualização                                                                      |
| `matchesContextOverflowError`     | Correspondência de estouro da janela de contexto definida pelo provedor                                                   | O provedor apresenta erros brutos de estouro que as heurísticas genéricas não detectariam                                                                                                     |
| `classifyFailoverReason`          | Classificação do motivo de failover definida pelo provedor                                                                | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                                                                                      |
| `isCacheTtlEligible`              | Política de cache de prompt para provedores de proxy/backhaul                                                             | O provedor precisa de restrição de TTL do cache específica do proxy                                                                                                                           |
| `buildMissingAuthMessage`         | Substitui a mensagem genérica de recuperação de autenticação ausente                                                      | O provedor precisa de uma dica de recuperação de autenticação ausente específica do provedor                                                                                                  |
| `augmentModelCatalog`             | Linhas sintéticas/finais do catálogo acrescentadas após a descoberta (obsoleto; veja abaixo)                              | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                                                                                |
| `resolveThinkingProfile`          | Conjunto de níveis de `/think`, rótulos de exibição e padrão específicos do modelo                                       | O provedor expõe uma escala personalizada de raciocínio ou um rótulo binário para modelos selecionados                                                                                        |
| `isBinaryThinking`                | Hook de compatibilidade da alternância de raciocínio ativado/desativado                                                   | O provedor expõe apenas raciocínio binário ativado/desativado                                                                                                                                 |
| `supportsXHighThinking`           | Hook de compatibilidade com o raciocínio `xhigh`                                                                          | O provedor deseja `xhigh` apenas em um subconjunto de modelos                                                                                                                                 |
| `resolveDefaultThinkingLevel`     | Hook de compatibilidade do nível padrão de `/think`                                                                       | O provedor é responsável pela política padrão de `/think` para uma família de modelos                                                                                                         |
| `isModernModelRef`                | Correspondência de modelo moderno para filtros de perfis ativos e seleção de testes de fumaça                             | O provedor é responsável pela correspondência de modelos preferenciais para perfis ativos/testes de fumaça                                                                                    |
| `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de tempo de execução imediatamente antes da inferência             | O provedor precisa trocar um token ou obter uma credencial de solicitação de curta duração                                                                                                    |
| `resolveUsageAuth`                | Resolve credenciais de uso/cobrança para `/usage` e superfícies de status relacionadas                                   | O provedor precisa de análise personalizada do token de uso/cota ou de uma credencial de uso diferente                                                                                        |
| `fetchUsageSnapshot`              | Busca e normaliza snapshots de uso/cota específicos do provedor após a resolução da autenticação                          | O provedor precisa de um endpoint de uso específico ou de um analisador de payload específico                                                                                                 |
| `createEmbeddingProvider`         | Criar um adaptador de embeddings pertencente ao provedor para memória/pesquisa                                                        | O comportamento dos embeddings de memória pertence ao Plugin do provedor                                                                                         |
| `buildReplayPolicy`               | Retornar uma política de reprodução que controle o processamento da transcrição para o provedor                                      | O provedor precisa de uma política de transcrição personalizada (por exemplo, remoção de blocos de raciocínio)                                                     |
| `sanitizeReplayHistory`           | Reescrever o histórico de reprodução após a limpeza genérica da transcrição                                                          | O provedor precisa de reescritas de reprodução específicas além dos auxiliares compartilhados de Compaction                                                       |
| `validateReplayTurns`             | Executar a validação ou reformulação final dos turnos de reprodução antes do executor incorporado                                    | O transporte do provedor precisa de uma validação de turnos mais rigorosa após a sanitização genérica                                                              |
| `onModelSelected`                 | Executar efeitos colaterais pós-seleção pertencentes ao provedor                                                                     | O provedor precisa de telemetria ou de estado próprio quando um modelo se torna ativo                                                                             |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` verificam primeiro o
plugin do provedor correspondente e, em seguida, percorrem os outros plugins de
provedor com suporte a hooks até que um deles realmente altere o ID do modelo ou
o transporte/a configuração. Isso mantém os shims de alias/compatibilidade de
provedores funcionando sem exigir que o chamador saiba qual plugin incluído é
responsável pela reescrita. Se nenhum hook de provedor reescrever uma entrada de
configuração compatível da família Google, o normalizador de configuração do
Google incluído ainda aplicará essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de comunicação totalmente personalizado
ou de um executor de solicitações personalizado, trata-se de outra classe de
extensão. Esses hooks destinam-se ao comportamento de provedores que ainda é
executado no loop de inferência normal do OpenClaw.

`resolveUsageAuth` decide se o OpenClaw deve chamar `fetchUsageSnapshot` ou
recorrer à resolução genérica de credenciais para superfícies de uso/status.
Retorne `{ token, accountId?, subscriptionType?, rateLimitTier? }` quando o
provedor tiver uma credencial de uso (os metadados opcionais do plano são
repassados para `fetchUsageSnapshot`), retorne
`{ handled: true }` quando a autenticação de uso pertencente ao provedor tiver
tratado a solicitação e precisar impedir o fallback genérico para chave de
API/OAuth, e retorne `null` ou `undefined` quando o provedor não tiver tratado a
autenticação de uso.

Declare credenciais de organização ou faturamento em
`providerUsageAuthEnvVars` no manifesto. Isso permite que as superfícies
genéricas de descoberta e remoção de segredos as reconheçam sem torná-las
candidatas à autenticação de inferência.

### Exemplo de provedor

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Exemplos integrados

Os plugins de provedor incluídos combinam os hooks acima para atender às
necessidades de catálogo, autenticação, raciocínio, reprodução e uso de cada
fornecedor. O conjunto oficial de hooks fica em cada plugin em `extensions/`;
esta página ilustra os formatos em vez de reproduzir a lista.

<AccordionGroup>
  <Accordion title="Provedores de catálogo de repasse">
    OpenRouter, Kilocode, Z.AI e xAI registram `catalog` junto com
    `resolveDynamicModel` / `prepareDynamicModel` para poderem disponibilizar
    IDs de modelos upstream antes do catálogo estático do OpenClaw.
  </Accordion>
  <Accordion title="Provedores de endpoints de OAuth e uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi e z.ai combinam
    `prepareRuntimeAuth` ou `formatApiKey` com `resolveUsageAuth` +
    `fetchUsageSnapshot` para controlar a troca de tokens e a integração com
    `/usage`.
  </Accordion>
  <Accordion title="Famílias de reprodução e limpeza de transcrições">
    Famílias nomeadas compartilhadas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permitem que os provedores
    adotem a política de transcrição por meio de `buildReplayPolicy`, em vez de
    cada plugin reimplementar a limpeza.
  </Accordion>
  <Accordion title="Provedores somente de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registram apenas `catalog` e usam o loop de inferência
    compartilhado.
  </Accordion>
  <Accordion title="Helpers de fluxo específicos do Anthropic">
    Cabeçalhos beta, `/fast` / `serviceTier` e `context1m` ficam dentro da
    interface pública `api.ts` / `contract-api.ts` do plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), e não no SDK
    genérico.
  </Accordion>
</AccordionGroup>

## Helpers de runtime

Os plugins podem acessar helpers selecionados do núcleo por meio de
`api.runtime`. Para TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Observações:

- `textToSpeech` retorna o payload normal de saída de TTS do núcleo para superfícies de arquivo/mensagem de voz.
- Usa a configuração principal `messages.tts` e a seleção de provedor.
- Retorna um buffer de áudio PCM + taxa de amostragem. Os plugins devem reamostrar/codificar para os provedores.
- `listVoices` é opcional para cada provedor. Use-o em seletores de voz pertencentes ao fornecedor ou em fluxos de configuração.
- O núcleo repassa um prazo de solicitação resolvido aos hooks `listVoices` do provedor; configurações de tempo limite específicas do provedor podem substituí-lo.
- As listagens de vozes podem incluir metadados mais detalhados, como localidade, gênero e tags de personalidade, para seletores compatíveis com provedores.
- OpenAI e ElevenLabs atualmente oferecem suporte a telefonia. A Microsoft não.

Os plugins também podem registrar provedores de fala por meio de
`api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Observações:

- Mantenha a política de TTS, o fallback e a entrega de respostas no núcleo.
- Use provedores de fala para comportamentos de síntese pertencentes ao fornecedor.
- A entrada legada `edge` da Microsoft é normalizada para o ID de provedor `microsoft`.
- O modelo de propriedade preferencial é orientado por empresa: um único plugin
  de fornecedor pode controlar provedores de texto, fala, imagem e mídias
  futuras à medida que o OpenClaw adiciona esses contratos de recursos.

Para compreensão de imagem/áudio/vídeo, os plugins registram um provedor tipado
de compreensão de mídia em vez de um conjunto genérico de chave/valor:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Observações:

- Mantenha a orquestração, o fallback, a configuração e a integração de canais no núcleo.
- Mantenha o comportamento do fornecedor no plugin do provedor.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos
  campos de resultado opcionais e novos recursos opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o núcleo controla o contrato de recurso e o helper de runtime
  - os plugins de fornecedores registram `api.registerVideoGenerationProvider(...)`
  - os plugins de recursos/canais consomem `api.runtime.videoGeneration.*`

Para helpers de runtime de compreensão de mídia, os plugins podem chamar:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.6-sol",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

Para transcrição de áudio, os plugins podem usar o runtime de compreensão de
mídia ou o alias STT mais antigo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Observações:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferencial
  para compreensão de imagem/áudio/vídeo.
- `extractStructuredWithModel(...)` é a interface voltada para plugins para
  extração limitada, pertencente ao provedor e centrada primeiro em imagens.
  Inclua pelo menos uma entrada de imagem; as entradas de texto são contexto
  complementar. Os plugins de produto controlam suas rotas e esquemas, enquanto
  o OpenClaw controla o limite entre provedor e runtime.
- Usa a configuração de áudio da compreensão de mídia do núcleo (`tools.media.audio`) e a ordem de fallback dos provedores.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não compatível).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidade.

Os plugins também podem iniciar execuções de subagentes em segundo plano por
meio de `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Observações:

- `provider` e `model` são substituições opcionais por execução, não alterações persistentes da sessão.
- O OpenClaw só respeita esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback pertencentes ao plugin, os operadores devem habilitá-las explicitamente com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a destinos canônicos `provider/model` específicos, ou `"*"` para permitir explicitamente qualquer destino.
- As execuções de subagentes de plugins não confiáveis continuam funcionando, mas as solicitações de substituição são rejeitadas em vez de recorrer silenciosamente ao fallback.
- As sessões de subagentes criadas por plugins recebem uma tag com o ID do plugin criador. O fallback `api.runtime.subagent.deleteSession(...)` só pode excluir essas sessões pertencentes ao plugin; a exclusão arbitrária de sessões ainda exige uma solicitação ao Gateway com escopo de administrador.

Para pesquisa na web, os plugins podem consumir o helper de runtime compartilhado
em vez de acessar diretamente a integração de ferramentas do agente:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Os plugins também podem registrar provedores de pesquisa na web por meio de
`api.registerWebSearchProvider(...)`.

Observações:

- Mantenha a seleção de provedor, a resolução de credenciais e a semântica compartilhada das solicitações no núcleo.
- Use provedores de pesquisa na web para transportes de pesquisa específicos de fornecedores.
- `api.runtime.webSearch.*` é a superfície compartilhada preferencial para plugins de recursos/canais que precisam de comportamento de pesquisa sem depender do wrapper de ferramentas do agente.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: gera uma imagem usando a cadeia configurada de provedores de geração de imagens.
- `listProviders(...)`: lista os provedores de geração de imagens disponíveis e seus recursos.

## Rotas HTTP do Gateway

Os plugins podem expor endpoints HTTP com `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Campos da rota:

- `path`: caminho da rota no servidor HTTP do Gateway.
- `auth`: obrigatório, `"gateway"` ou `"plugin"`. Use `"gateway"` para exigir a autenticação normal do Gateway ou `"plugin"` para autenticação/verificação de Webhook gerenciada pelo Plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `handleUpgrade`: manipulador opcional para solicitações de upgrade do WebSocket na mesma rota.
- `replaceExisting`: opcional. Permite que o mesmo Plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver processado a solicitação.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento do Plugin. Use `api.registerHttpRoute(...)` em seu lugar.
- As rotas de Plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, exceto quando `replaceExisting: true`, e um Plugin não pode substituir a rota de outro Plugin.
- Rotas sobrepostas com níveis de `auth` diferentes são rejeitadas. Mantenha cadeias de encaminhamento `exact`/`prefix` somente no mesmo nível de autenticação.
- Rotas com `auth: "plugin"` **não** recebem automaticamente escopos de runtime do operador. Elas se destinam a Webhooks/verificação de assinatura gerenciados pelo Plugin, não a chamadas privilegiadas de auxiliares do Gateway.
- Rotas com `auth: "gateway"` são executadas dentro de um escopo de runtime de solicitação do Gateway. A superfície padrão (`gatewayRuntimeScopeSurface: "write-default"`) é intencionalmente conservadora:
  - a autenticação de portador por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) e qualquer método de autenticação que não seja `trusted-proxy` recebem um único escopo `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - chamadores `trusted-proxy` sem um cabeçalho `x-openclaw-scopes` explícito também mantêm a superfície legada limitada a `operator.write`
  - chamadores `trusted-proxy` que enviam `x-openclaw-scopes` recebem os escopos declarados
  - uma rota pode optar por `gatewayRuntimeScopeSurface: "trusted-operator"` para sempre respeitar `x-openclaw-scopes` em modos de autenticação associados a uma identidade (recorrendo ao conjunto completo de escopos padrão da CLI quando o cabeçalho estiver ausente)
- Regra prática: não presuma que uma rota de Plugin autenticada pelo Gateway seja implicitamente uma superfície administrativa. Se sua rota precisar de comportamento exclusivo para administradores, opte pela superfície de escopo `trusted-operator`, exija um modo de autenticação associado a uma identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.
- Após a correspondência de rota e a autenticação, manipuladores comuns participam da admissão de trabalho raiz do Gateway. Um Gateway preparado ou em reinicialização retorna `503` antes de invocar o manipulador. A exceção restrita é uma rota com `auth: "gateway"`, autorizada pelo manifesto, que também opte pela superfície `trusted-operator` específica da rota; ela permanece acessível para que o encaminhamento do controle de suspensão não fique bloqueado, enquanto as rotas irmãs comuns do mesmo Plugin permanecem atrás do limite de admissão. A propriedade de `handleUpgrade` do WebSocket usa o mesmo limite de admissão atômico; depois que o manipulador aceita um socket, o restante do ciclo de vida desse socket pertence ao Plugin e não é acompanhado por esse limite.

## Caminhos de importação do SDK de Plugin

Use subcaminhos restritos do SDK em vez do barrel raiz monolítico `openclaw/plugin-sdk`
ao criar novos Plugins. Subcaminhos principais:

| Subcaminho                          | Finalidade                                          |
| ----------------------------------- | --------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugin                    |
| `openclaw/plugin-sdk/channel-core`  | Auxiliares de entrada/compilação de canal           |
| `openclaw/plugin-sdk/core`          | Auxiliares genéricos compartilhados e contrato abrangente |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod do `openclaw.json` raiz (`OpenClawSchema`) |

Plugins de canal escolhem entre uma família de interfaces restritas — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve ser consolidado
em um único contrato `approvalCapability`, em vez de ser combinado entre campos de
Plugin não relacionados. Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

Auxiliares de runtime e configuração ficam em subcaminhos específicos `*-runtime`
correspondentes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` etc.). Prefira `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
em vez do barrel amplo de compatibilidade `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
pequenas fachadas auxiliares de canal, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` são adaptações de compatibilidade obsoletas para
Plugins mais antigos. O código novo deve importar primitivas genéricas mais restritas.
</Info>

Pontos de entrada internos do repositório (por raiz de pacote de Plugin integrado):

- `index.js` — entrada do Plugin integrado
- `api.js` — barrel de auxiliares/tipos
- `runtime-api.js` — barrel somente de runtime
- `setup-entry.js` — entrada do Plugin de configuração

Plugins externos devem importar somente subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe `src/*` do pacote de outro Plugin no núcleo ou em outro Plugin.
Os pontos de entrada carregados por fachada preferem o snapshot ativo da configuração
de runtime quando houver um e, caso contrário, recorrem ao arquivo de configuração
resolvido no disco.

Subcaminhos específicos de recursos, como `image-generation`, `media-understanding`
e `speech`, existem porque os Plugins integrados os utilizam atualmente. Eles não são
automaticamente contratos externos imutáveis de longo prazo — consulte a página de
referência pertinente do SDK ao depender deles.

## Esquemas da ferramenta de mensagens

Os Plugins devem ser responsáveis pelas contribuições de esquema
`describeMessageTool(...)` específicas do canal para primitivas que não sejam mensagens,
como reações, leituras e enquetes. A apresentação compartilhada de envio deve usar o
contrato genérico `MessagePresentation` em vez de campos nativos do provedor para botões,
componentes, blocos ou cartões.
Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) para conhecer o contrato,
as regras de contingência, o mapeamento de provedores e a lista de verificação para autores
de Plugins.

Plugins capazes de enviar declaram o que podem renderizar por meio dos recursos de mensagem:

- `presentation` para blocos de apresentação semântica (`text`, `context`,
  `divider`, `chart`, `table`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O núcleo decide se renderiza a apresentação de forma nativa ou se a converte em texto.
Não exponha mecanismos de escape da interface nativa do provedor por meio da ferramenta
genérica de mensagens. Auxiliares obsoletos do SDK para esquemas nativos legados continuam
exportados para Plugins existentes de terceiros, mas novos Plugins não devem utilizá-los.

## Resolução de destinos de canal

Os Plugins de canal devem ser responsáveis pela semântica de destino específica do canal.
Mantenha o host compartilhado de saída genérico e use a superfície do adaptador de mensagens
para as regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da consulta ao diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao núcleo se uma
  entrada deve prosseguir diretamente para uma resolução semelhante a um identificador,
  em vez de realizar uma busca no diretório.
- `messaging.targetResolver.reservedLiterals` lista palavras isoladas que são
  referências de canal/sessão para esse provedor. A resolução preserva as entradas
  configuradas do diretório antes de rejeitar literais reservados e, depois, falha de
  forma fechada quando não há correspondência no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o mecanismo de contingência do Plugin
  quando o núcleo precisa de uma resolução final pertencente ao provedor após a normalização
  ou quando não há correspondência no diretório.
- `messaging.resolveOutboundSessionRoute(...)` é responsável pela criação da rota de sessão
  específica do provedor depois que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem ocorrer antes
  da busca por pares/grupos.
- Use `looksLikeId` para verificações do tipo "trate isto como um identificador de destino
  explícito/nativo".
- Use `resolveTarget` como contingência de normalização específica do provedor, não para
  buscas amplas no diretório.
- Mantenha identificadores nativos do provedor, como identificadores de chat, de thread,
  JIDs, identificadores de usuário e identificadores de sala, nos valores de `target` ou
  em parâmetros específicos do provedor, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
Plugin e reutilizar os auxiliares compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de pares/grupos baseados em configuração, como:

- pares de mensagens diretas determinados por lista de permissões
- mapas configurados de canais/grupos
- mecanismos estáticos de contingência de diretório com escopo de conta

Os auxiliares compartilhados em `directory-runtime` processam apenas operações genéricas:

- filtragem de consultas
- aplicação de limites
- auxiliares de desduplicação/normalização
- criação de `ChannelDirectoryEntry[]`

A inspeção de conta e a normalização de identificadores específicas do canal devem
permanecer na implementação do Plugin.

## Catálogos de provedores

Plugins de provedor podem definir catálogos de modelos para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para várias entradas de provedores

Use `catalog` quando o Plugin for responsável por identificadores de modelo específicos
do provedor, padrões da URL base ou metadados de modelo condicionados à autenticação.

`catalog.order` controla quando o catálogo de um Plugin é mesclado em relação aos
provedores implícitos integrados do OpenClaw:

- `simple`: provedores comuns orientados por chave de API ou variável de ambiente
- `profile`: provedores que aparecem quando existem perfis de autenticação
- `paired`: provedores que sintetizam várias entradas de provedores relacionados
- `late`: última etapa, após os outros provedores implícitos

Provedores posteriores prevalecem em colisões de chave, portanto os Plugins podem
substituir intencionalmente uma entrada de provedor integrada que tenha o mesmo
identificador de provedor.

Os Plugins também podem publicar linhas de modelo somente leitura por meio de
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Esse é o caminho futuro para superfícies de listagem/ajuda/seleção e oferece
suporte a linhas `text`, `voice`, `image_generation`, `video_generation` e
`music_generation`. Os Plugins de provedor continuam responsáveis pelas chamadas
em tempo real aos endpoints, pela troca de tokens e pelo mapeamento das respostas
do fornecedor; o núcleo é responsável pelo formato comum das linhas, pelos rótulos
de origem e pela formatação da ajuda das ferramentas de mídia. Os registros de
provedores de geração de mídia sintetizam automaticamente linhas de catálogo
estáticas com base em `defaultModel`, `models` e `capabilities`.

Compatibilidade:

- `discovery` continua funcionando como um alias legado, mas emite um aviso de obsolescência
- se `catalog` e `discovery` forem registrados, o OpenClaw usará `catalog`
  e emitirá um aviso
- `augmentModelCatalog` está obsoleto; provedores integrados devem publicar
  linhas complementares por meio de `registerModelCatalogProvider`

## Inspeção de canal somente leitura

Se o seu Plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Motivos:

- `resolveAccount(...)` é o caminho de runtime. Ele pode presumir que as credenciais
  estão totalmente materializadas e falhar imediatamente quando os segredos obrigatórios
  estiverem ausentes.
- Caminhos de comandos somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de reparo de
  configuração/doctor não devem precisar materializar credenciais de runtime apenas
  para descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas o estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status das credenciais quando relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de tokens apenas para informar a disponibilidade
  somente para leitura. Retornar `tokenStatus: "available"` (e o campo de origem
  correspondente) é suficiente para comandos de status.
- Use `configured_unavailable` quando uma credencial estiver configurada por meio de SecretRef, mas
  indisponível no caminho do comando atual.

Isso permite que comandos somente para leitura informem "configurada, mas indisponível neste caminho
de comando", em vez de falhar ou indicar incorretamente que a conta não está configurada.

## Pacotes de plugins

Um diretório de plugin pode incluir um `package.json` com `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Cada entrada se torna um plugin. Se o pacote listar várias extensões, o id do plugin
se tornará `<manifestOrPackageName>/<fileBase>` (o id do manifesto prevalece quando
presente; caso contrário, será usado o nome sem escopo do `package.json`).

Se o seu plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Proteção de segurança: cada entrada de `openclaw.extensions` deve permanecer dentro do diretório
do plugin após a resolução de links simbólicos. Entradas que escapem do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala as dependências do plugin com uma
execução de `npm install --omit=dev --ignore-scripts` local ao projeto (sem scripts de ciclo de vida
e sem dependências de desenvolvimento em tempo de execução), ignorando configurações globais herdadas de instalação do npm.
Mantenha as árvores de dependências do plugin compostas por "JS/TS puro" e evite pacotes que exijam
compilações em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve usado apenas na configuração.
Quando o OpenClaw precisa das superfícies de configuração de um plugin de canal desativado, ou
quando um plugin de canal está ativado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso torna a inicialização e a configuração mais leves
quando a entrada principal do plugin também conecta ferramentas, hooks ou outro código exclusivo
de tempo de execução.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode fazer com que um plugin de canal use o mesmo caminho de `setupEntry` durante a fase
de inicialização anterior à escuta do Gateway, mesmo quando o canal já estiver configurado.

Use isso somente quando `setupEntry` abranger completamente a superfície de inicialização que deve existir
antes de o Gateway começar a escutar. Na prática, isso significa que a entrada de configuração
deve registrar todos os recursos pertencentes ao canal dos quais a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes de o Gateway começar a escutar
- quaisquer métodos, ferramentas ou serviços do Gateway que precisem existir durante essa mesma janela

Se a entrada completa ainda possuir algum recurso obrigatório de inicialização, não ative
essa flag. Mantenha o comportamento padrão do plugin e permita que o OpenClaw carregue a
entrada completa durante a inicialização.

Canais integrados também podem publicar auxiliares de superfície de contrato exclusivos de configuração que o núcleo
pode consultar antes de o tempo de execução completo do canal ser carregado. A superfície atual
de promoção da configuração é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O núcleo usa essa superfície quando precisa promover uma configuração legada de canal com uma única conta
para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
Matrix é o exemplo integrado atual: ele move apenas chaves de autenticação/inicialização para uma
conta promovida nomeada quando já existem contas nomeadas e pode preservar uma
chave configurada de conta padrão não canônica em vez de sempre criar
`accounts.default`.

Esses adaptadores de correção da configuração mantêm a descoberta da superfície de contrato integrada sob demanda. O tempo
de importação permanece leve; a superfície de promoção é carregada somente no primeiro uso, em vez de
reiniciar a inicialização do canal integrado durante a importação do módulo.

Quando essas superfícies de inicialização incluírem métodos RPC do Gateway, mantenha-os em um
prefixo específico do plugin. Os namespaces administrativos do núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre são associados
a `operator.admin`, mesmo que um plugin solicite um escopo mais restrito.

Exemplo:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadados do catálogo de canais

Plugins de canal podem divulgar metadados de configuração/descoberta por meio de `openclaw.channel` e
dicas de instalação por meio de `openclaw.install`. Isso mantém o catálogo do núcleo sem dados específicos.

Exemplo:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Campos úteis de `openclaw.channel` além do exemplo mínimo:

- `detailLabel`: rótulo secundário para superfícies mais detalhadas de catálogo/status
- `docsLabel`: substitui o texto do link para a documentação
- `preferOver`: ids de plugins/canais de prioridade mais baixa que esta entrada do catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com Markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: inclui o canal no fluxo padrão `allowFrom` de início rápido
- `forceAccountBinding`: exige vinculação explícita da conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prioriza a busca de sessão ao resolver destinos de anúncios

O OpenClaw também pode mesclar **catálogos externos de canais** (por exemplo, uma exportação de
registro MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula, ponto e vírgula ou `PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O analisador também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

As entradas geradas do catálogo de canais e as entradas do catálogo de instalação de provedores expõem
informações normalizadas sobre a origem da instalação ao lado do bloco bruto `openclaw.install`. As
informações normalizadas identificam se a especificação npm é uma versão exata ou um
seletor flutuante, se os metadados de integridade esperados estão presentes e se também há
um caminho de origem local disponível. Quando a identidade do catálogo/pacote é conhecida, as
informações normalizadas avisam se o nome analisado do pacote npm diverge dessa identidade.
Elas também avisam quando `defaultChoice` é inválido ou aponta para uma origem que
não está disponível, e quando há metadados de integridade do npm sem uma origem npm
válida. Os consumidores devem tratar `installSource` como um campo opcional aditivo, para que
entradas criadas manualmente e adaptações de catálogo não precisem sintetizá-lo.
Isso permite que a integração inicial e os diagnósticos expliquem o estado do plano de origem sem
importar o tempo de execução do plugin.

Entradas npm externas oficiais devem preferir um `npmSpec` exato acompanhado de
`expectedIntegrity`. Nomes de pacotes sem versão e dist-tags continuam funcionando por
compatibilidade, mas exibem avisos do plano de origem para que o catálogo possa avançar
em direção a instalações fixadas e verificadas por integridade sem interromper plugins existentes.
Quando a integração inicial instala a partir de um caminho de catálogo local, ela registra uma entrada gerenciada
no índice de plugins com `source: "path"` e um `sourcePath` relativo ao espaço de trabalho
quando possível. O caminho operacional absoluto de carregamento permanece em
`plugins.load.paths`; o registro de instalação evita duplicar caminhos da estação de trabalho
local na configuração de longa duração. Isso mantém as instalações de desenvolvimento local visíveis aos
diagnósticos do plano de origem sem adicionar uma segunda superfície de exposição de caminhos brutos
do sistema de arquivos. A tabela SQLite persistida `installed_plugin_index` é a fonte
da verdade sobre a origem da instalação e pode ser atualizada sem carregar módulos de tempo de execução do plugin.
Seu mapa `installRecords` é durável mesmo quando o manifesto de um plugin está ausente ou
é inválido; seu conteúdo `plugins` é uma visão reconstruível dos manifestos.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto são responsáveis pela orquestração do contexto da sessão para ingestão, montagem
e Compaction. Registre-os a partir do seu plugin com
`api.registerContextEngine(id, factory)` e selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando o seu plugin precisar substituir ou ampliar o pipeline padrão de contexto,
em vez de apenas adicionar busca de memória ou hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

A fábrica `ctx` expõe valores opcionais `config`, `agentDir` e `workspaceDir`
para inicialização no momento da construção.

`assemble()` pode retornar `contextProjection` quando o ambiente ativo possui uma
thread persistente no backend. Omita-o para a projeção legada a cada turno. Retorne
`{ mode: "thread_bootstrap", epoch }` quando o contexto montado precisar ser
injetado uma vez em uma thread do backend e reutilizado até que a época seja alterada. Altere
a época após mudanças no contexto semântico do mecanismo, como depois de uma
execução de Compaction controlada pelo mecanismo. Os hosts podem preservar metadados de chamadas de ferramentas, o formato
da entrada e resultados de ferramentas com dados sensíveis removidos em uma projeção de inicialização de thread, para que novas
threads do backend mantenham a continuidade das ferramentas sem copiar conteúdos brutos
que contenham segredos.

Se o seu mecanismo **não** for responsável pelo algoritmo de Compaction, mantenha `compact()`
implementado e delegue-o explicitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Adição de uma nova capacidade

Quando um plugin precisar de um comportamento que não se enquadre na API atual, não contorne
o sistema de plugins com um acesso interno privado. Adicione a capacidade ausente.

Sequência recomendada:

1. **Defina o contrato do núcleo.** Decida qual comportamento compartilhado deve pertencer ao núcleo:
   política, fallback, mesclagem de configuração, ciclo de vida, semântica voltada aos canais e
   formato do auxiliar de runtime.
2. **Adicione superfícies tipadas de registro/runtime de plugins.** Estenda
   `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada de
   capacidade que seja útil.
3. **Conecte o núcleo e os consumidores de canal/recurso.** Os canais e plugins de recursos
   devem consumir a nova capacidade por meio do núcleo, e não importando diretamente
   uma implementação de fornecedor.
4. **Registre as implementações dos fornecedores.** Em seguida, os plugins de fornecedores registram seus
   backends para a capacidade.
5. **Adicione cobertura do contrato.** Adicione testes para que a atribuição de responsabilidade e o formato do registro
   permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw mantém decisões bem definidas sem ficar codificado de forma rígida segundo a
visão de mundo de um único provedor. Consulte o [Guia prático de capacidades](/pt-BR/plugins/adding-capabilities)
para ver uma lista de verificação concreta de arquivos e um exemplo completo.

### Lista de verificação da capacidade

Ao adicionar uma nova capacidade, a implementação normalmente deve abranger estas
superfícies em conjunto:

- tipos do contrato do núcleo em `src/<capability>/types.ts`
- executor/auxiliar de runtime do núcleo em `src/<capability>/runtime.ts`
- superfície de registro da API de plugins em `src/plugins/types.ts`
- integração com o registro de plugins em `src/plugins/registry.ts`
- exposição do runtime de plugins em `src/plugins/runtime/*` quando plugins de recurso/canal
  precisarem consumi-la
- auxiliares de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de responsabilidade/contrato em `src/plugins/contracts/registry.ts`
- documentação para operadores/plugins em `docs/`

Se uma dessas superfícies estiver ausente, isso geralmente indica que a capacidade
ainda não está totalmente integrada.

### Modelo de capacidade

Padrão mínimo:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Padrão de teste de contrato (`src/plugins/contracts/registry.ts` expõe consultas de
responsabilidade, como `providerContractPluginIds`; os testes verificam se a lista
`contracts.videoGenerationProviders` de um plugin corresponde ao que ele realmente registra):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

Isso mantém a regra simples:

- o núcleo é responsável pelo contrato da capacidade e pela orquestração
- os plugins de fornecedores são responsáveis pelas implementações específicas dos fornecedores
- os plugins de recurso/canal consomem auxiliares de runtime
- os testes de contrato mantêm as responsabilidades explícitas

## Relacionados

- [Arquitetura de plugins](/pt-BR/plugins/architecture) — modelo público de capacidades e formatos
- [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths)
- [Configuração do SDK de plugins](/pt-BR/plugins/sdk-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
