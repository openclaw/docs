---
read_when:
    - Implementando hooks de runtime de provedores, ciclo de vida de canais ou pacotes de pacotes
    - Depurando a ordem de carregamento de plugins ou o estado do registro
    - Adicionando uma nova capacidade de plugin ou plugin de mecanismo de contexto
summary: 'Internos da arquitetura de Plugin: pipeline de carregamento, registro, hooks de runtime, rotas HTTP e tabelas de referência'
title: Internos da arquitetura de Plugin
x-i18n:
    generated_at: "2026-06-27T17:44:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para o modelo público de recursos, formatos de plugin e contratos de propriedade/execução, consulte [Arquitetura de Plugin](/pt-BR/plugins/architecture). Esta página é a referência para os mecanismos internos: pipeline de carregamento, registro, hooks de runtime, rotas HTTP do Gateway, caminhos de importação e tabelas de esquema.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes de plugins candidatas
2. lê manifestos de bundles nativos ou compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugins (`plugins.enabled`, `allow`, `deny`, `entries`, `slots`, `load.paths`)
5. decide a ativação de cada candidato
6. carrega módulos nativos habilitados: módulos empacotados integrados usam um carregador nativo; código-fonte TypeScript local de terceiros usa o fallback emergencial Jiti
7. chama hooks nativos `register(api)` e coleta registros no registro de plugins
8. expõe o registro a comandos/superfícies de runtime

<Note>
`activate` é um alias legado para `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins empacotados usam `register`; prefira `register` para novos plugins.
</Note>

As barreiras de segurança acontecem **antes** da execução de runtime. Candidatos são bloqueados quando a entrada escapa da raiz do plugin, o caminho é gravável por todos, ou a propriedade do caminho parece suspeita para plugins não empacotados.

Candidatos bloqueados continuam vinculados ao respectivo id de plugin para diagnóstico. Se a configuração ainda referenciar esse id, a validação relata o plugin como presente, mas bloqueado, e aponta de volta para o aviso de segurança de caminho em vez de tratar a entrada de configuração como obsoleta.

### Comportamento com manifesto primeiro

O manifesto é a fonte de verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/skills/esquema de configuração declarados ou recursos do bundle
- validar `plugins.entries.<id>.config`
- complementar rótulos/placeholders da Control UI
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e setup sem carregar o runtime do plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra o comportamento real, como hooks, ferramentas, comandos ou fluxos de provedor.

Blocos opcionais de manifesto `activation` e `setup` ficam no plano de controle. Eles são descritores apenas de metadados para planejamento de ativação e descoberta de setup; não substituem o registro de runtime, `register(...)` nem `setupEntry`. Os primeiros consumidores de ativação ativa agora usam dicas de comando, canal e provedor do manifesto para restringir o carregamento de plugins antes da materialização mais ampla do registro:

- o carregamento da CLI restringe aos plugins que possuem o comando primário solicitado
- a resolução de setup/plugin de canal restringe aos plugins que possuem o id de canal solicitado
- a resolução explícita de setup/runtime de provedor restringe aos plugins que possuem o id de provedor solicitado
- o planejamento de inicialização do Gateway usa `activation.onStartup` para importações explícitas na inicialização e opt-outs de inicialização; plugins sem metadados de inicialização carregam apenas por acionadores de ativação mais restritos

Pré-carregamentos de runtime em tempo de solicitação que pedem o escopo amplo `all` ainda derivam um conjunto efetivo explícito de ids de plugin a partir da configuração, do planejamento de inicialização, dos canais configurados, slots e regras de ativação automática. Se esse conjunto derivado estiver vazio, o OpenClaw carrega um registro de runtime vazio em vez de ampliar para todos os plugins detectáveis.

O planejador de ativação expõe tanto uma API somente com ids para chamadores existentes quanto uma API de plano para novos diagnósticos. Entradas de plano relatam por que um plugin foi selecionado, separando dicas explícitas do planejador `activation.*` da propriedade de manifesto de fallback, como `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hooks. Essa separação de motivo é o limite de compatibilidade: metadados de plugin existentes continuam funcionando, enquanto código novo pode detectar dicas amplas ou comportamento de fallback sem alterar a semântica de carregamento de runtime.

A descoberta de setup agora prefere ids pertencentes a descritores, como `setup.providers` e `setup.cliBackends`, para restringir plugins candidatos antes de cair para `setup-api` para plugins que ainda precisam de hooks de runtime em tempo de setup. Listas de setup de provedores usam `providerAuthChoices` do manifesto, escolhas de setup derivadas de descritores e metadados do catálogo de instalação sem carregar o runtime do provedor. `setup.requiresRuntime: false` explícito é um corte somente por descritor; `requiresRuntime` omitido mantém o fallback legado de setup-api para compatibilidade. Se mais de um plugin descoberto reivindicar o mesmo id normalizado de provedor de setup ou backend de CLI, a busca de setup recusa o proprietário ambíguo em vez de depender da ordem de descoberta. Quando o runtime de setup é executado, os diagnósticos do registro relatam divergência entre `setup.providers` / `setup.cliBackends` e os provedores ou backends de CLI registrados por setup-api sem bloquear plugins legados.

### Limite do cache de plugins

O OpenClaw não armazena em cache resultados de descoberta de plugins nem dados diretos do registro de manifestos por janelas de relógio. Instalações, edições de manifesto e alterações de caminhos de carregamento devem ficar visíveis na próxima leitura explícita de metadados ou reconstrução de snapshot. O parser de arquivo de manifesto pode manter um cache limitado por assinatura de arquivo, indexado pelo caminho aberto do manifesto, inode, tamanho e timestamps; esse cache apenas evita reanalisar bytes inalterados e não deve armazenar em cache respostas de descoberta, registro, proprietário ou política.

O caminho rápido seguro para metadados é propriedade explícita de objeto, não um cache oculto. Caminhos críticos de inicialização do Gateway devem passar o `PluginMetadataSnapshot`, a `PluginLookUpTable` derivada ou um registro de manifesto explícito atual pela cadeia de chamadas. Validação de configuração, ativação automática na inicialização, bootstrap de plugins e seleção de provedores podem reutilizar esses objetos enquanto eles representarem a configuração e o inventário de plugins atuais. A busca de setup ainda reconstrói metadados de manifesto sob demanda, a menos que o caminho específico de setup receba um registro de manifesto explícito; mantenha isso como fallback de caminho frio em vez de adicionar caches ocultos de busca. Quando a entrada mudar, reconstrua e substitua o snapshot em vez de mutá-lo ou manter cópias históricas.
Visualizações sobre o registro ativo de plugins e helpers de bootstrap de canais empacotados devem ser recalculadas a partir do registro/raiz atual. Mapas de vida curta são aceitáveis dentro de uma chamada para deduplicar trabalho ou proteger reentrada; eles não devem se tornar caches de metadados de processo.

Para carregamento de plugins, a camada de cache persistente é o carregamento de runtime. Ela pode reutilizar estado do carregador quando código ou artefatos instalados são realmente carregados, como:

- `PluginLoaderCacheState` e registros de runtime ativos compatíveis
- caches de jiti/módulos e caches de carregador de superfície pública usados para evitar importar repetidamente a mesma superfície de runtime
- caches de sistema de arquivos para artefatos de plugin instalados
- mapas de vida curta por chamada para normalização de caminhos ou resolução de duplicatas

Esses caches são detalhes de implementação do plano de dados. Eles não devem responder a perguntas do plano de controle, como “qual plugin possui este provedor?”, a menos que o chamador tenha pedido deliberadamente carregamento de runtime.

Não adicione caches persistentes ou por relógio para:

- resultados de descoberta
- registros diretos de manifestos
- registros de manifestos reconstruídos a partir do índice de plugins instalados
- busca de proprietário de provedor, supressão de modelo, política de provedor ou metadados de artefato público
- qualquer outra resposta derivada de manifesto em que um manifesto, índice instalado ou caminho de carregamento alterado deva ficar visível na próxima leitura de metadados

Chamadores que reconstroem metadados de manifesto a partir do índice persistido de plugins instalados reconstroem esse registro sob demanda. O índice instalado é estado durável do plano de origem; ele não é um cache oculto de metadados em processo.

## Modelo de registro

Plugins carregados não alteram diretamente globais aleatórios do core. Eles se registram em um registro central de plugins.

O registro acompanha:

- registros de plugin (identidade, fonte, origem, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- handlers RPC do gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos pertencentes a plugins

Recursos do core então leem desse registro em vez de falar diretamente com módulos de plugin. Isso mantém o carregamento em uma só direção:

- módulo de plugin -> registro no registry
- runtime do core -> consumo do registry

Essa separação é importante para a manutenibilidade. Significa que a maioria das superfícies do core precisa de apenas um ponto de integração: “ler o registro”, não “tratar cada módulo de plugin como caso especial”.

## Callbacks de vinculação de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma solicitação de vinculação for aprovada ou negada:

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
- `request`: o resumo da solicitação original, dica de desvinculação, id do remetente e metadados da conversa

Esse callback é apenas uma notificação. Ele não altera quem tem permissão para vincular uma conversa e roda depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provedores

Plugins de provedor têm três camadas:

- **Metadados do manifesto** para consulta barata antes do runtime:
  `setup.providers[].envVars`, compatibilidade obsoleta `providerAuthEnvVars`, `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hooks em tempo de configuração**: `catalog` (`discovery` legado) mais `applyConfigDefaults`.
- **Hooks de runtime**: mais de 40 hooks opcionais que cobrem autenticação, resolução de modelo, encapsulamento de stream, níveis de raciocínio, política de replay e endpoints de uso. Veja a lista completa em [Ordem e uso dos hooks](#hook-order-and-usage).

O OpenClaw ainda possui o loop genérico do agente, failover, tratamento de transcritos e política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de provedor sem precisar de um transporte de inferência totalmente customizado.

Use `setup.providers[].envVars` do manifesto quando o provedor tiver credenciais baseadas em env que caminhos genéricos de autenticação/status/seletor de modelos devam ver sem carregar o runtime do plugin. O `providerAuthEnvVars` obsoleto ainda é lido pelo adaptador de compatibilidade durante a janela de depreciação, e plugins não empacotados que o usam recebem um diagnóstico de manifesto. Use `providerAuthAliases` do manifesto quando um id de provedor deve reutilizar variáveis env, perfis de autenticação, autenticação apoiada por configuração e escolha de onboarding por chave de API de outro id de provedor. Use `providerAuthChoices` do manifesto quando superfícies de CLI de onboarding/escolha de autenticação devem conhecer o id de escolha do provedor, rótulos de grupo e fiação simples de autenticação por uma única flag sem carregar o runtime do provedor. Mantenha `envVars` de runtime do provedor para dicas voltadas ao operador, como rótulos de onboarding ou variáveis de setup de client-id/client-secret OAuth.

Use `channelEnvVars` do manifesto quando um canal tiver autenticação ou setup orientado por env que fallback genérico de shell-env, verificações de configuração/status ou prompts de setup devam ver sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para plugins de modelo/provedor, o OpenClaw chama hooks nesta ordem aproximada.
A coluna “Quando usar” é o guia rápido de decisão.
Campos de provedor somente de compatibilidade que o OpenClaw não chama mais, como `ProviderPlugin.capabilities` e `suppressBuiltInModel`, são intencionalmente não listados aqui.

| #   | Hook                              | O que faz                                                                                                               | Quando usar                                                                                                                                                      |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                             | O provedor possui um catálogo ou padrões de URL base                                                                                                             |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração pertencentes ao provedor durante a materialização da configuração                 | Os padrões dependem do modo de autenticação, do ambiente ou da semântica de família de modelos do provedor                                                        |
| --  | _(busca de modelo integrada)_     | OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                           | _(não é um hook de Plugin)_                                                                                                                                      |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de prévia de IDs de modelo antes da busca                                                  | O provedor é responsável pela limpeza de aliases antes da resolução canônica do modelo                                                                            |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo                                 | O provedor é responsável pela limpeza de transporte para IDs de provedor personalizados na mesma família de transporte                                            |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                                | O provedor precisa de limpeza de configuração que deve ficar com o Plugin; helpers integrados da família Google também garantem entradas de configuração Google compatíveis |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo aos provedores de configuração                          | O provedor precisa de correções de metadados de uso de streaming nativo guiadas pelo endpoint                                                                     |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de ambiente para provedores de configuração antes do carregamento da autenticação de runtime | Os provedores expõem seus próprios hooks de resolução de chave de API por marcador de ambiente                                                                    |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/auto-hospedada ou baseada em configuração sem persistir texto simples                          | O provedor pode operar com um marcador de credencial sintética/local                                                                                              |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis de autenticação externa pertencentes ao provedor; o `persistence` padrão é `runtime-only` para credenciais pertencentes à CLI/app | O provedor reutiliza credenciais de autenticação externa sem persistir tokens de atualização copiados; declare `contracts.externalAuthProviders` no manifesto     |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders de perfis sintéticos armazenados atrás de autenticação baseada em ambiente/configuração             | O provedor armazena perfis sintéticos de placeholder que não devem vencer a precedência                                                                           |
| 11  | `resolveDynamicModel`             | Fallback síncrono para IDs de modelo pertencentes ao provedor que ainda não estão no registro local                      | O provedor aceita IDs arbitrários de modelos upstream                                                                                                            |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono; depois `resolveDynamicModel` executa novamente                                                  | O provedor precisa de metadados de rede antes de resolver IDs desconhecidos                                                                                       |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o executor incorporado usar o modelo resolvido                                                 | O provedor precisa de reescritas de transporte, mas ainda usa um transporte central                                                                               |
| 14  | `normalizeToolSchemas`            | Normaliza esquemas de ferramentas antes que o executor incorporado os veja                                              | O provedor precisa de limpeza de esquema da família de transporte                                                                                                 |
| 15  | `inspectToolSchemas`              | Expõe diagnósticos de esquema pertencentes ao provedor após a normalização                                              | O provedor quer avisos de palavras-chave sem ensinar regras específicas de provedor ao núcleo                                                                     |
| 16  | `resolveReasoningOutputMode`      | Seleciona o contrato de saída de raciocínio nativo versus marcado                                                       | O provedor precisa de raciocínio/saída final marcados em vez de campos nativos                                                                                    |
| 17  | `prepareExtraParams`              | Normalização de parâmetros de solicitação antes dos wrappers genéricos de opção de stream                               | O provedor precisa de parâmetros de solicitação padrão ou limpeza de parâmetros por provedor                                                                      |
| 18  | `createStreamFn`                  | Substitui totalmente o caminho normal de stream por um transporte personalizado                                         | O provedor precisa de um protocolo de fio personalizado, não apenas um wrapper                                                                                    |
| 20  | `wrapStreamFn`                    | Wrapper de stream depois que os wrappers genéricos são aplicados                                                       | O provedor precisa de wrappers de compatibilidade de cabeçalhos/corpo/modelo da solicitação sem um transporte personalizado                                      |
| 21  | `resolveTransportTurnState`       | Anexa cabeçalhos ou metadados nativos de transporte por turno                                                           | O provedor quer que transportes genéricos enviem identidade de turno nativa do provedor                                                                           |
| 22  | `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos nativos de WebSocket ou política de resfriamento de sessão                                             | O provedor quer que transportes WS genéricos ajustem cabeçalhos de sessão ou política de fallback                                                                |
| 23  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado se torna a string `apiKey` de runtime                        | O provedor armazena metadados extras de autenticação e precisa de um formato de token de runtime personalizado                                                   |
| 24  | `refreshOAuth`                    | Substituição de atualização OAuth para endpoints de atualização personalizados ou política de falha de atualização       | O provedor não se encaixa nos atualizadores compartilhados do OpenClaw                                                                                            |
| 25  | `buildAuthDoctorHint`             | Dica de reparo anexada quando a atualização OAuth falha                                                                 | O provedor precisa de orientação de reparo de autenticação pertencente ao provedor após falha de atualização                                                      |
| 26  | `matchesContextOverflowError`     | Correspondedor de estouro de janela de contexto pertencente ao provedor                                                | O provedor tem erros brutos de estouro que heurísticas genéricas não detectariam                                                                                  |
| 27  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provedor                                                            | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                                                         |
| 28  | `isCacheTtlEligible`              | Política de cache de prompt para provedores de proxy/backhaul                                                          | O provedor precisa de controle de TTL de cache específico de proxy                                                                                                |
| 29  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação de autenticação ausente                                               | O provedor precisa de uma dica de recuperação de autenticação ausente específica do provedor                                                                      |
| 30  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                                        | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                                                    |
| 31  | `resolveThinkingProfile`          | Conjunto de níveis `/think` específico do modelo, rótulos de exibição e padrão                                         | O provedor expõe uma escala de thinking personalizada ou rótulo binário para modelos selecionados                                                                 |
| 32  | `isBinaryThinking`                | Hook de compatibilidade de alternância de raciocínio ligado/desligado                                                  | O provedor expõe apenas thinking binário ligado/desligado                                                                                                        |
| 33  | `supportsXHighThinking`           | Hook de compatibilidade de suporte a raciocínio `xhigh`                                                                | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                                                      |
| 34  | `resolveDefaultThinkingLevel`     | Hook de compatibilidade do nível `/think` padrão                                                                       | O provedor é responsável pela política padrão de `/think` para uma família de modelos                                                                             |
| 35  | `isModernModelRef`                | Correspondedor de modelo moderno para filtros de perfil ao vivo e seleção de smoke                                     | O provedor é responsável pela correspondência de modelo preferido ao vivo/smoke                                                                                   |
| 36  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime pouco antes da inferência                             | O provedor precisa de uma troca de token ou credencial de solicitação de curta duração                                                                            |
| 37  | `resolveUsageAuth`                | Resolve credenciais de uso/cobrança para `/usage` e superfícies de status relacionadas                                 | O provedor precisa de análise personalizada de token de uso/cota ou de uma credencial de uso diferente                                                            |
| 38  | `fetchUsageSnapshot`              | Buscar e normalizar snapshots de uso/cota específicos do provedor depois que a autenticação é resolvida        | O provedor precisa de um endpoint de uso específico do provedor ou de um analisador de payload                                                |
| 39  | `createEmbeddingProvider`         | Criar um adaptador de embeddings pertencente ao provedor para memória/busca                                    | O comportamento de embeddings de memória pertence ao Plugin do provedor                                                                       |
| 40  | `buildReplayPolicy`               | Retornar uma política de replay que controla o tratamento de transcrições para o provedor                      | O provedor precisa de uma política de transcrição personalizada (por exemplo, remoção de blocos de pensamento)                                |
| 41  | `sanitizeReplayHistory`           | Reescrever o histórico de replay depois da limpeza genérica de transcrições                                    | O provedor precisa de reescritas de replay específicas do provedor além dos auxiliares compartilhados de Compaction                            |
| 42  | `validateReplayTurns`             | Validação final dos turnos de replay ou remodelagem antes do executor incorporado                              | O transporte do provedor precisa de validação de turnos mais rigorosa depois da sanitização genérica                                           |
| 43  | `onModelSelected`                 | Executar efeitos colaterais pós-seleção pertencentes ao provedor                                               | O provedor precisa de telemetria ou estado pertencente ao provedor quando um modelo se torna ativo                                             |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
plugin de provedor correspondente e, em seguida, avançam para outros plugins de
provedor compatíveis com hooks até que um deles realmente altere o id do modelo
ou o transporte/configuração. Isso mantém os shims de alias/compatibilidade de
provedor funcionando sem exigir que o chamador saiba qual plugin incluído é
dono da reescrita. Se nenhum hook de provedor reescrever uma entrada de
configuração compatível da família Google, o normalizador de configuração
incluído do Google ainda aplica essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de transmissão totalmente personalizado
ou de um executor de requisições personalizado, isso é uma classe diferente de
extensão. Esses hooks são para comportamento de provedor que ainda roda no loop
normal de inferência do OpenClaw.

`resolveUsageAuth` decide se o OpenClaw deve chamar `fetchUsageSnapshot` ou
recorrer à resolução genérica de credenciais para superfícies de uso/status.
Retorne `{ token, accountId? }` quando o provedor tiver uma credencial de uso,
retorne `{ handled: true }` quando a autenticação de uso pertencente ao provedor
tiver tratado a requisição e precisar suprimir o fallback genérico de chave de
API/OAuth, e retorne `null` ou `undefined` quando o provedor não tiver tratado a
autenticação de uso.

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

Plugins de provedor incluídos combinam os hooks acima para se ajustar às
necessidades de catálogo, autenticação, raciocínio, replay e uso de cada
fornecedor. O conjunto autoritativo de hooks fica com cada plugin em
`extensions/`; esta página ilustra os formatos em vez de espelhar a lista.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI e xAI registram `catalog` mais
    `resolveDynamicModel` / `prepareDynamicModel` para poder expor ids de
    modelos upstream antes do catálogo estático do OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi e z.ai combinam
    `prepareRuntimeAuth` ou `formatApiKey` com `resolveUsageAuth` +
    `fetchUsageSnapshot` para serem donos da troca de token e da integração
    com `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Famílias nomeadas compartilhadas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permitem que provedores
    optem pela política de transcrição via `buildReplayPolicy` em vez de cada
    plugin reimplementar a limpeza.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registram apenas `catalog` e usam o loop de inferência
    compartilhado.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Cabeçalhos beta, `/fast` / `serviceTier` e `context1m` ficam dentro do
    ponto de contato público `api.ts` / `contract-api.ts` do plugin da
    Anthropic (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), e não no SDK
    genérico.
  </Accordion>
</AccordionGroup>

## Auxiliares de runtime

Plugins podem acessar auxiliares selecionados do core via `api.runtime`. Para TTS:

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

- `textToSpeech` retorna o payload normal de saída de TTS do core para superfícies de arquivo/nota de voz.
- Usa a configuração `messages.tts` do core e a seleção de provedor.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins precisam reamostrar/codificar para provedores.
- `listVoices` é opcional por provedor. Use-o para seletores de voz ou fluxos de configuração pertencentes ao fornecedor.
- Listagens de vozes podem incluir metadados mais ricos, como localidade, gênero e tags de personalidade para seletores conscientes de provedor.
- OpenAI e ElevenLabs são compatíveis com telefonia hoje. Microsoft não é.

Plugins também podem registrar provedores de fala via `api.registerSpeechProvider(...)`.

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

- Mantenha a política, o fallback e a entrega de respostas de TTS no core.
- Use provedores de fala para comportamento de síntese pertencente ao fornecedor.
- A entrada legada `edge` da Microsoft é normalizada para o id de provedor `microsoft`.
- O modelo de propriedade preferido é orientado por empresa: um plugin de
  fornecedor pode ser dono de provedores de texto, fala, imagem e mídia futura
  conforme o OpenClaw adiciona esses contratos de capacidade.

Para compreensão de imagem/áudio/vídeo, plugins registram um provedor tipado de
compreensão de mídia em vez de um recipiente genérico de chave/valor:

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

- Mantenha orquestração, fallback, configuração e ligação de canais no core.
- Mantenha o comportamento do fornecedor no plugin de provedor.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos
  campos opcionais de resultado, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core é dono do contrato de capacidade e do auxiliar de runtime
  - plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - plugins de recurso/canal consomem `api.runtime.videoGeneration.*`

Para auxiliares de runtime de compreensão de mídia, plugins podem chamar:

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
  model: "gpt-5.5",
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

Para transcrição de áudio, plugins podem usar o runtime de compreensão de mídia
ou o alias STT mais antigo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Observações:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferida para
  compreensão de imagem/áudio/vídeo.
- `extractStructuredWithModel(...)` é o ponto de contato voltado a plugins para
  extração limitada, pertencente ao provedor e centrada em imagem. Inclua pelo
  menos uma entrada de imagem; entradas de texto são contexto suplementar.
  plugins de produto são donos de suas rotas e esquemas, enquanto o OpenClaw é
  dono da fronteira de provedor/runtime.
- Usa a configuração de áudio de compreensão de mídia do core (`tools.media.audio`) e a ordem de fallback de provedores.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/sem suporte).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidade.

Plugins também podem iniciar execuções de subagentes em segundo plano por meio de `api.runtime.subagent`:

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

- `provider` e `model` são substituições opcionais por execução, não alterações persistentes de sessão.
- O OpenClaw só honra esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback pertencentes a plugins, operadores precisam optar por isso com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a destinos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer destino.
- Execuções de subagentes de plugins não confiáveis ainda funcionam, mas solicitações de substituição são rejeitadas em vez de cair silenciosamente no fallback.
- Sessões de subagente criadas por plugins são marcadas com o id do plugin criador. O fallback `api.runtime.subagent.deleteSession(...)` pode excluir apenas essas sessões de propriedade dele; a exclusão arbitrária de sessões ainda exige uma requisição Gateway com escopo de administrador.

Para pesquisa na web, plugins podem consumir o auxiliar de runtime compartilhado
em vez de acessar a ligação da ferramenta do agente:

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

Plugins também podem registrar provedores de pesquisa na web via
`api.registerWebSearchProvider(...)`.

Observações:

- Mantenha seleção de provedor, resolução de credenciais e semântica de requisição compartilhada no core.
- Use provedores de pesquisa na web para transportes de pesquisa específicos de fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para plugins de recurso/canal que precisam de comportamento de pesquisa sem depender do wrapper da ferramenta do agente.

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
- `listProviders(...)`: lista os provedores de geração de imagens disponíveis e suas capacidades.

## Rotas HTTP do Gateway

Plugins podem expor endpoints HTTP com `api.registerHttpRoute(...)`.

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

- `path`: caminho da rota sob o servidor HTTP do Gateway.
- `auth`: obrigatório. Use `"gateway"` para exigir a autenticação normal do Gateway, ou `"plugin"` para autenticação/verificação de Webhook gerenciada pelo Plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo Plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a solicitação.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento do Plugin. Use `api.registerHttpRoute(...)` em vez disso.
- As rotas do Plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um Plugin não pode substituir a rota de outro Plugin.
- Rotas sobrepostas com níveis de `auth` diferentes são rejeitadas. Mantenha cadeias de passagem `exact`/`prefix` apenas no mesmo nível de auth.
- Rotas com `auth: "plugin"` **não** recebem escopos de runtime do operador automaticamente. Elas são para Webhooks/verificação de assinatura gerenciados pelo Plugin, não para chamadas privilegiadas de auxiliares do Gateway.
- Rotas com `auth: "gateway"` rodam dentro de um escopo de runtime de solicitação do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém os escopos de runtime de rotas do Plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo, `trusted-proxy` ou `gateway.auth.mode = "none"` em um ingresso privado) respeitam `x-openclaw-scopes` somente quando o cabeçalho está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas solicitações de rota do Plugin com identidade, o escopo de runtime volta para `operator.write`
- Regra prática: não assuma que uma rota de Plugin autenticada pelo Gateway é uma superfície administrativa implícita. Se sua rota precisar de comportamento exclusivo para administradores, exija um modo de autenticação com identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.

## Caminhos de importação do SDK de Plugin

Use subcaminhos estreitos do SDK em vez do barrel raiz monolítico `openclaw/plugin-sdk`
ao criar novos plugins. Subcaminhos principais:

| Subcaminho                          | Finalidade                                         |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivos de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Auxiliares de entrada/build de canal               |
| `openclaw/plugin-sdk/core`          | Auxiliares compartilhados genéricos e contrato guarda-chuva |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |

Plugins de canal escolhem a partir de uma família de limites estreitos — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve se consolidar
em um único contrato `approvalCapability` em vez de misturar campos de Plugin
não relacionados. Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

Auxiliares de runtime e configuração vivem sob subcaminhos `*-runtime` focados
correspondentes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` etc.). Prefira `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
em vez do barrel amplo de compatibilidade `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
pequenas fachadas auxiliares de canal, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` são shims de compatibilidade obsoletos para
plugins mais antigos. Código novo deve importar primitivos genéricos mais estreitos em vez disso.
</Info>

Pontos de entrada internos do repositório (por raiz de pacote de Plugin empacotado):

- `index.js` — entrada do Plugin empacotado
- `api.js` — barrel de auxiliares/tipos
- `runtime-api.js` — barrel somente de runtime
- `setup-entry.js` — entrada de Plugin de setup

Plugins externos devem importar apenas subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe `src/*` do pacote de outro Plugin a partir do core ou de outro Plugin.
Pontos de entrada carregados por fachada preferem o snapshot ativo de configuração de runtime quando um
existe e, em seguida, recorrem ao arquivo de configuração resolvido em disco.

Subcaminhos específicos de capacidade, como `image-generation`, `media-understanding`
e `speech`, existem porque plugins empacotados os usam hoje. Eles não são
contratos externos automaticamente congelados de longo prazo — consulte a página de referência
do SDK relevante ao depender deles.

## Esquemas de ferramentas de mensagem

Plugins devem possuir contribuições de esquema `describeMessageTool(...)` específicas de canal
para primitivos que não são mensagens, como reações, leituras e enquetes.
A apresentação compartilhada de envio deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos do provedor para botão, componente, bloco ou cartão.
Consulte [Apresentação de Mensagem](/pt-BR/plugins/message-presentation) para o contrato,
regras de fallback, mapeamento de provedor e checklist do autor de Plugin.

Plugins com capacidade de envio declaram o que conseguem renderizar por meio de capacidades de mensagem:

- `presentation` para blocos de apresentação semântica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O core decide se renderiza a apresentação nativamente ou a degrada para texto.
Não exponha escapes de UI nativa do provedor a partir da ferramenta genérica de mensagens.
Auxiliares obsoletos do SDK para esquemas nativos legados permanecem exportados para plugins
de terceiros existentes, mas novos plugins não devem usá-los.

## Resolução de destino de canal

Plugins de canal devem possuir a semântica de destino específica do canal. Mantenha o host
compartilhado de saída genérico e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da consulta ao diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve ir direto para a resolução semelhante a id em vez da busca no diretório.
- `messaging.targetResolver.reservedLiterals` lista palavras simples que são
  referências de canal/sessão para esse provedor. A resolução preserva entradas de
  diretório configuradas antes de rejeitar literais reservados e, então, falha de forma fechada em uma
  ausência no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do Plugin quando
  o core precisa de uma resolução final pertencente ao provedor após a normalização ou após uma
  ausência no diretório.
- `messaging.resolveOutboundSessionRoute(...)` possui a construção de rota de sessão
  específica do provedor depois que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes
  de pesquisar pares/grupos.
- Use `looksLikeId` para verificações de "trate isto como um id de destino explícito/nativo".
- Use `resolveTarget` para fallback de normalização específico do provedor, não para
  busca ampla no diretório.
- Mantenha ids nativos do provedor, como ids de chat, ids de thread, JIDs, handles e ids de sala
  dentro de valores `target` ou parâmetros específicos do provedor, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
Plugin e reutilizar os auxiliares compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isto quando um canal precisar de pares/grupos baseados em configuração, como:

- pares de DM orientados por allowlist
- mapas configurados de canal/grupo
- fallbacks de diretório estático com escopo de conta

Os auxiliares compartilhados em `directory-runtime` tratam apenas de operações genéricas:

- filtragem de consultas
- aplicação de limite
- auxiliares de desduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

A inspeção de conta específica do canal e a normalização de id devem permanecer na
implementação do Plugin.

## Catálogos de provedores

Plugins de provedor podem definir catálogos de modelos para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para várias entradas de provedor

Use `catalog` quando o Plugin possuir ids de modelo específicos do provedor, padrões de URL base
ou metadados de modelo protegidos por autenticação.

`catalog.order` controla quando o catálogo de um Plugin é mesclado em relação aos provedores
implícitos integrados do OpenClaw:

- `simple`: provedores simples por chave de API ou env
- `profile`: provedores que aparecem quando existem perfis de autenticação
- `paired`: provedores que sintetizam várias entradas de provedor relacionadas
- `late`: última passagem, após outros provedores implícitos

Provedores posteriores vencem em colisão de chave, então plugins podem substituir intencionalmente uma
entrada de provedor integrada pelo mesmo id de provedor.

Plugins também podem publicar linhas de modelo somente leitura por meio de
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Este é o caminho futuro para superfícies de listagem/ajuda/seletor e oferece suporte a
linhas `text`, `image_generation`, `video_generation` e `music_generation`.
Plugins de provedor ainda possuem chamadas de endpoint ao vivo, troca de token e
mapeamento de resposta do fornecedor; o core possui o formato comum de linha, rótulos de origem e
formatação de ajuda para ferramentas de mídia. Registros de provedores de geração de mídia sintetizam linhas
de catálogo estático automaticamente a partir de `defaultModel`, `models` e `capabilities`.

Compatibilidade:

- `discovery` ainda funciona como alias legado, mas emite um aviso de depreciação
- se tanto `catalog` quanto `discovery` forem registrados, o OpenClaw usa `catalog`
- `augmentModelCatalog` está obsoleto; provedores empacotados devem publicar
  linhas suplementares por meio de `registerModelCatalogProvider`

## Inspeção de canal somente leitura

Se seu Plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que as credenciais
  estão totalmente materializadas e pode falhar rapidamente quando segredos obrigatórios estão ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de reparo
  de doctor/configuração não devem precisar materializar credenciais de runtime apenas para
  descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas o estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status de credencial quando relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para relatar disponibilidade
  somente leitura. Retornar `tokenStatus: "available"` (e o campo de origem correspondente)
  é suficiente para comandos de estilo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura relatem "configurado, mas indisponível neste caminho de
comando" em vez de travar ou relatar incorretamente a conta como não configurada.

## Pacotes de pacotes

Um diretório de Plugin pode incluir um `package.json` com `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Cada entrada se torna um Plugin. Se o pacote listar várias extensões, o id do Plugin
se torna `name/<fileBase>`.

Se seu Plugin importar deps npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Guardrail de segurança: toda entrada `openclaw.extensions` deve permanecer dentro do diretório do Plugin
após a resolução de symlinks. Entradas que escapam do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala as dependências do plugin com um
`npm install --omit=dev --ignore-scripts` local do projeto (sem scripts de ciclo de vida,
sem dependências de desenvolvimento em tempo de execução), ignorando configurações globais herdadas de instalação do npm.
Mantenha as árvores de dependência de plugins como "JS/TS puro" e evite pacotes que exigem
builds de `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve somente de configuração.
Quando o OpenClaw precisa de superfícies de configuração para um plugin de canal desabilitado, ou
quando um plugin de canal está habilitado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso torna a inicialização e a configuração mais leves
quando a entrada principal do seu plugin também conecta ferramentas, hooks ou outro código
somente de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode fazer um plugin de canal optar pelo mesmo caminho de `setupEntry` durante a fase
de inicialização pré-escuta do Gateway, mesmo quando o canal já está configurado.

Use isso somente quando `setupEntry` cobre totalmente a superfície de inicialização que deve existir
antes de o Gateway começar a escutar. Na prática, isso significa que a entrada de configuração
deve registrar toda capacidade pertencente ao canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes de o Gateway começar a escutar
- quaisquer métodos, ferramentas ou serviços do Gateway que precisem existir durante essa mesma janela

Se a sua entrada completa ainda possui qualquer capacidade de inicialização obrigatória, não habilite
esta flag. Mantenha o plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais empacotados também podem publicar helpers de superfície de contrato somente de configuração que o núcleo
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual de
promoção de configuração é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O núcleo usa essa superfície quando precisa promover uma configuração legada de canal com conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
Matrix é o exemplo empacotado atual: ele move apenas chaves de autenticação/bootstrap para uma
conta promovida nomeada quando contas nomeadas já existem, e pode preservar uma
chave de conta padrão não canônica configurada em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de configuração mantêm preguiçosa a descoberta de superfície de contrato empacotada. O tempo
de importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso, em vez de
entrar novamente na inicialização de canal empacotado na importação do módulo.

Quando essas superfícies de inicialização incluem métodos RPC do Gateway, mantenha-os em um
prefixo específico do plugin. Namespaces administrativos do núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre resolvem
para `operator.admin`, mesmo que um plugin solicite um escopo mais restrito.

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

Plugins de canal podem anunciar metadados de configuração/descoberta via `openclaw.channel` e
dicas de instalação via `openclaw.install`. Isso mantém os dados do catálogo fora do núcleo.

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

- `detailLabel`: rótulo secundário para superfícies mais ricas de catálogo/status
- `docsLabel`: substitui o texto do link para o link da documentação
- `preferOver`: ids de plugin/canal de prioridade menor que esta entrada do catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal de seletores interativos de configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos para compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: faz o canal optar pelo fluxo padrão de início rápido `allowFrom`
- `forceAccountBinding`: exige vinculação explícita de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca de sessão ao resolver alvos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canais** (por exemplo, uma exportação de
registro MPM). Coloque um arquivo JSON em um destes caminhos:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O analisador também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

Entradas geradas do catálogo de canais e entradas do catálogo de instalação de provedores expõem
fatos normalizados da fonte de instalação ao lado do bloco bruto `openclaw.install`. Os
fatos normalizados identificam se a especificação npm é uma versão exata ou um seletor
flutuante, se os metadados de integridade esperados estão presentes e se um caminho de origem
local também está disponível. Quando a identidade de catálogo/pacote é conhecida, os
fatos normalizados avisam se o nome do pacote npm analisado diverge dessa identidade.
Eles também avisam quando `defaultChoice` é inválido ou aponta para uma fonte que
não está disponível, e quando metadados de integridade npm estão presentes sem uma fonte npm
válida. Consumidores devem tratar `installSource` como um campo opcional aditivo, para que
entradas construídas manualmente e shims de catálogo não precisem sintetizá-lo.
Isso permite que onboarding e diagnósticos expliquem o estado do plano de origem sem
importar o runtime do plugin.

Entradas npm externas oficiais devem preferir um `npmSpec` exato mais
`expectedIntegrity`. Nomes de pacote simples e dist-tags ainda funcionam para
compatibilidade, mas exibem avisos do plano de origem para que o catálogo possa avançar
para instalações fixadas e verificadas por integridade sem quebrar plugins existentes.
Quando o onboarding instala a partir de um caminho de catálogo local, ele registra uma entrada
gerenciada de índice de plugins com `source: "path"` e um `sourcePath` relativo ao workspace
quando possível. O caminho absoluto de carregamento operacional permanece em
`plugins.load.paths`; o registro de instalação evita duplicar caminhos locais de estação de trabalho
em configurações de longa duração. Isso mantém instalações de desenvolvimento local visíveis para
diagnósticos do plano de origem sem adicionar uma segunda superfície bruta de divulgação de caminho
do sistema de arquivos. A linha SQLite persistida `installed_plugin_index` é a fonte
da verdade de instalação e pode ser atualizada sem carregar módulos de runtime de plugins.
Seu mapa `installRecords` é durável mesmo quando um manifesto de plugin está ausente ou
inválido; seu payload `plugins` é uma visão de manifesto reconstruível.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto são donos da orquestração de contexto de sessão para ingestão, montagem
e Compaction. Registre-os a partir do seu plugin com
`api.registerContextEngine(id, factory)`, depois selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisa substituir ou estender o pipeline de contexto padrão
em vez de apenas adicionar busca de memória ou hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

O `ctx` da factory expõe valores opcionais `config`, `agentDir` e `workspaceDir`
para inicialização em tempo de construção.

`assemble()` pode retornar `contextProjection` quando o harness ativo tem uma
thread persistente de backend. Omita-o para projeção legada por turno. Retorne
`{ mode: "thread_bootstrap", epoch }` quando o contexto montado deve ser
injetado uma vez em uma thread de backend e reutilizado até que a época mude. Altere
a época depois que o contexto semântico do mecanismo mudar, como após uma passagem de
Compaction pertencente ao mecanismo. Hosts podem preservar metadados de chamadas de ferramenta, formato
de entrada e resultados redigidos de ferramentas em uma projeção thread-bootstrap, para que novas
threads de backend mantenham continuidade de ferramentas sem copiar payloads brutos que
possam conter segredos.

Se o seu mecanismo **não** possui o algoritmo de Compaction, mantenha `compact()`
implementado e delegue-o explicitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

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
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Adicionando uma nova capacidade

Quando um plugin precisa de comportamento que não se encaixa na API atual, não contorne
o sistema de plugins com um acesso privado. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato do núcleo
   Decida qual comportamento compartilhado o núcleo deve possuir: política, fallback, mesclagem de configuração,
   ciclo de vida, semântica voltada para canais e formato de helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada
   de capacidade que seja útil.
3. conecte consumidores do núcleo + canal/recurso
   Canais e plugins de recurso devem consumir a nova capacidade por meio do núcleo,
   não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedores
   Plugins de fornecedores então registram seus backends contra a capacidade.
5. adicione cobertura de contrato
   Adicione testes para que a propriedade e o formato de registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar codificado rigidamente para a visão de mundo
de um único provedor. Consulte o [Livro de receitas de capacidades](/pt-BR/plugins/adding-capabilities)
para uma checklist concreta de arquivos e um exemplo trabalhado.

### Checklist de capacidade

Quando você adiciona uma nova capacidade, a implementação geralmente deve tocar estas
superfícies em conjunto:

- tipos de contrato do núcleo em `src/<capability>/types.ts`
- helper de executor/runtime do núcleo em `src/<capability>/runtime.ts`
- superfície de registro da API de plugins em `src/plugins/types.ts`
- conexão do registro de plugins em `src/plugins/registry.ts`
- exposição de runtime de plugin em `src/plugins/runtime/*` quando plugins de recurso/canal
  precisam consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação para operador/plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso geralmente é um sinal de que a capacidade
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

Padrão de teste de contrato:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Isso mantém a regra simples:

- o core possui o contrato de capacidade + orquestração
- plugins de fornecedores possuem implementações de fornecedores
- plugins de recurso/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita

## Relacionados

- [Arquitetura de Plugin](/pt-BR/plugins/architecture) — modelo e formatos públicos de capacidade
- [Subcaminhos do Plugin SDK](/pt-BR/plugins/sdk-subpaths)
- [Configuração do Plugin SDK](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
