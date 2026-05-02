---
read_when:
    - Implementando ganchos de tempo de execução de provedores, ciclo de vida de canais ou conjuntos de pacotes
    - Depuração da ordem de carregamento do Plugin ou do estado do registro
    - Adicionar uma nova capacidade de Plugin ou um Plugin de mecanismo de contexto
summary: 'Aspectos internos da arquitetura de Plugin: pipeline de carregamento, registro, ganchos de tempo de execução, rotas HTTP e tabelas de referência'
title: Aspectos internos da arquitetura de Plugin
x-i18n:
    generated_at: "2026-05-02T20:50:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec593518e51f68ce617d5bc4e55cede2188e9247f863364a9ea956e50ca2675
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para o modelo público de capacidades, formatos de Plugin e contratos de propriedade/execução, consulte [Arquitetura de Plugin](/pt-BR/plugins/architecture). Esta página é a referência para os mecanismos internos: pipeline de carregamento, registro, hooks de runtime, rotas HTTP do Gateway, caminhos de importação e tabelas de esquema.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de plugins
2. lê manifestos de bundles nativos ou compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega módulos nativos habilitados: módulos empacotados integrados usam um carregador nativo;
   código-fonte TypeScript local de terceiros usa o fallback emergencial Jiti
7. chama hooks nativos `register(api)` e coleta registros no registro de plugins
8. expõe o registro para comandos/superfícies de runtime

<Note>
`activate` é um alias legado de `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins integrados usam `register`; prefira `register` para novos plugins.
</Note>

Os gates de segurança acontecem **antes** da execução de runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do Plugin, o caminho é gravável por todos ou a
propriedade do caminho parece suspeita para plugins não integrados.

### Comportamento manifest-first

O manifesto é a fonte da verdade do plano de controle. O OpenClaw o usa para:

- identificar o Plugin
- descobrir canais/skills/esquema de configuração declarados ou capacidades do bundle
- validar `plugins.entries.<id>.config`
- enriquecer rótulos/placeholders da Control UI
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do Plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
comportamento real, como hooks, ferramentas, comandos ou fluxos de provider.

Blocos opcionais `activation` e `setup` do manifesto permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de configuração;
eles não substituem o registro de runtime, `register(...)` ou `setupEntry`.
Os primeiros consumidores de ativação ao vivo agora usam dicas de comando, canal e provider do manifesto
para restringir o carregamento de plugins antes de uma materialização mais ampla do registro:

- o carregamento da CLI restringe para plugins que são proprietários do comando primário solicitado
- a configuração/resolução de Plugin de canal restringe para plugins que são proprietários do
  id de canal solicitado
- a configuração/resolução explícita de runtime de provider restringe para plugins que são proprietários do
  id de provider solicitado
- o planejamento de inicialização do Gateway usa `activation.onStartup` para importações explícitas
  de inicialização e opt-outs de inicialização; plugins sem metadados de inicialização carregam somente
  por meio de gatilhos de ativação mais restritos

Preloads de runtime em tempo de solicitação que pedem o escopo amplo `all` ainda derivam um
conjunto explícito efetivo de ids de plugins a partir da configuração, planejamento de inicialização, canais
configurados, slots e regras de habilitação automática. Se esse conjunto derivado estiver vazio, o OpenClaw
carrega um registro de runtime vazio em vez de ampliar para todo Plugin descobrível.

O planejador de ativação expõe tanto uma API somente de ids para chamadores existentes quanto uma
API de plano para novos diagnósticos. Entradas de plano informam por que um Plugin foi selecionado,
separando dicas explícitas do planejador `activation.*` do fallback de propriedade do manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks. Essa separação de motivo é o limite de compatibilidade:
metadados existentes de Plugin continuam funcionando, enquanto código novo pode detectar dicas amplas
ou comportamento de fallback sem alterar a semântica de carregamento de runtime.

A descoberta de configuração agora prefere ids pertencentes ao descritor, como `setup.providers` e
`setup.cliBackends`, para restringir plugins candidatos antes de recorrer a
`setup-api` para plugins que ainda precisam de hooks de runtime no tempo de configuração. Listas de
configuração de provider usam `providerAuthChoices` do manifesto, escolhas de configuração derivadas de descritor
e metadados de catálogo de instalação sem carregar o runtime do provider. `setup.requiresRuntime: false`
explícito é um corte somente de descritor; `requiresRuntime` omitido mantém o fallback legado
de setup-api por compatibilidade. Se mais de um Plugin descoberto reivindicar o mesmo provider de configuração
normalizado ou id de backend de CLI, a busca de configuração recusa o proprietário ambíguo em vez de depender da
ordem de descoberta. Quando o runtime de configuração é executado, os diagnósticos do registro informam
divergência entre `setup.providers` / `setup.cliBackends` e os providers ou backends de CLI
registrados por setup-api sem bloquear plugins legados.

### Limite de cache de Plugin

O OpenClaw não armazena em cache resultados de descoberta de Plugin nem dados diretos do registro de manifesto
por janelas de relógio. Instalações, edições de manifesto e mudanças de caminho de carregamento
devem ficar visíveis na próxima leitura explícita de metadados ou reconstrução de snapshot.
O analisador do arquivo de manifesto pode manter um cache limitado de assinatura de arquivo, indexado pelo
caminho do manifesto aberto, inode, tamanho e timestamps; esse cache apenas evita
reanalisar bytes inalterados e não deve armazenar em cache respostas de descoberta, registro, proprietário ou
política.

O caminho rápido seguro de metadados é propriedade explícita de objeto, não um cache oculto.
Caminhos quentes de inicialização do Gateway devem passar o `PluginMetadataSnapshot` atual, a
`PluginLookUpTable` derivada ou um registro de manifesto explícito pela cadeia de chamadas.
Validação de configuração, habilitação automática de inicialização, bootstrap de Plugin e seleção de provider
podem reutilizar esses objetos enquanto eles representarem a configuração atual e o inventário de plugins.
A busca de configuração ainda reconstrói metadados de manifesto sob demanda, a menos que o caminho específico
de configuração receba um registro de manifesto explícito; mantenha isso como fallback de caminho frio em vez de
adicionar caches ocultos de busca. Quando a entrada mudar, reconstrua e substitua o snapshot em vez de
modificá-lo ou manter cópias históricas.
Views sobre o registro ativo de plugins e helpers de bootstrap de canais integrados
devem ser recalculados a partir do registro/raiz atual. Mapas de vida curta são aceitáveis
dentro de uma chamada para deduplicar trabalho ou proteger reentrada; eles não devem se tornar caches
de metadados do processo.

Para carregamento de Plugin, a camada de cache persistente é o carregamento de runtime. Ela pode reutilizar
estado do carregador quando código ou artefatos instalados são de fato carregados, como:

- `PluginLoaderCacheState` e registros de runtime ativos compatíveis
- caches de jiti/módulo e caches de carregador de superfície pública usados para evitar importar
  repetidamente a mesma superfície de runtime
- caches de sistema de arquivos para artefatos instalados de Plugin
- mapas de vida curta por chamada para normalização de caminhos ou resolução de duplicatas

Esses caches são detalhes de implementação do plano de dados. Eles não devem responder a
perguntas do plano de controle, como "qual Plugin é proprietário deste provider?", a menos que o
chamador tenha solicitado deliberadamente carregamento de runtime.

Não adicione caches persistentes ou baseados em relógio para:

- resultados de descoberta
- registros diretos de manifesto
- registros de manifesto reconstruídos a partir do índice de plugins instalados
- busca de proprietário de provider, supressão de modelo, política de provider ou metadados
  de artefato público
- qualquer outra resposta derivada de manifesto em que um manifesto alterado, índice instalado
  ou caminho de carregamento deva estar visível na próxima leitura de metadados

Chamadores que reconstroem metadados de manifesto a partir do índice persistido de plugins instalados
reconstroem esse registro sob demanda. O índice instalado é estado durável do plano de origem;
ele não é um cache oculto de metadados em processo.

## Modelo de registro

Plugins carregados não modificam diretamente globais aleatórios do core. Eles se registram em um
registro central de plugins.

O registro rastreia:

- registros de Plugin (identidade, fonte, origem, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- providers
- manipuladores RPC do Gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos pertencentes a Plugin

Recursos do core então leem desse registro em vez de falar diretamente com módulos de Plugin.
Isso mantém o carregamento em mão única:

- módulo de Plugin -> registro no registro
- runtime do core -> consumo do registro

Essa separação importa para a manutenibilidade. Ela significa que a maioria das superfícies do core só
precisa de um ponto de integração: "ler o registro", não "tratar especialmente todo módulo de Plugin".

## Callbacks de vinculação de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma solicitação de vínculo
for aprovada ou negada:

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
- `binding`: o vínculo resolvido para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de desvinculação, id do remetente e
  metadados da conversa

Este callback é somente de notificação. Ele não altera quem tem permissão para vincular uma
conversa, e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provider

Plugins de provider têm três camadas:

- **Metadados de manifesto** para busca barata pré-runtime:
  `setup.providers[].envVars`, compatibilidade obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hooks em tempo de configuração**: `catalog` (`discovery` legado) mais
  `applyConfigDefaults`.
- **Hooks de runtime**: mais de 40 hooks opcionais cobrindo autenticação, resolução de modelo,
  encapsulamento de stream, níveis de pensamento, política de replay e endpoints de uso. Consulte
  a lista completa em [Ordem e uso de hooks](#hook-order-and-usage).

O OpenClaw ainda é proprietário do loop genérico de agente, failover, tratamento de transcript e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de provider
sem precisar de um transporte de inferência totalmente personalizado.

Use `setup.providers[].envVars` do manifesto quando o provider tiver credenciais baseadas em env
que caminhos genéricos de autenticação/status/seletor de modelos devem ver sem
carregar o runtime do Plugin. `providerAuthEnvVars` obsoleto ainda é lido pelo
adaptador de compatibilidade durante a janela de depreciação, e plugins não integrados
que o usam recebem um diagnóstico de manifesto. Use `providerAuthAliases` do manifesto
quando um id de provider deve reutilizar vars de env, perfis de autenticação,
autenticação respaldada por configuração e escolha de onboarding por chave de API de outro id de provider. Use
`providerAuthChoices` do manifesto quando superfícies de CLI de onboarding/escolha de autenticação devem conhecer o
id de escolha do provider, rótulos de grupo e configuração simples de autenticação com uma flag, sem
carregar o runtime do provider. Mantenha `envVars` do runtime de provider para dicas voltadas ao operador,
como rótulos de onboarding ou vars de configuração de client-id/client-secret de OAuth.

Use `channelEnvVars` do manifesto quando um canal tiver autenticação ou configuração orientada por env que
fallback genérico de env de shell, verificações de configuração/status ou prompts de configuração devem ver
sem carregar o runtime do canal.

### Ordem e uso de hooks

Para plugins de modelo/provider, o OpenClaw chama hooks nesta ordem aproximada.
A coluna "Quando usar" é o guia rápido de decisão.
Campos de provider somente de compatibilidade que o OpenClaw não chama mais, como
`ProviderPlugin.capabilities` e `suppressBuiltInModel`, são intencionalmente
não listados aqui.

| #   | Gancho                           | O que faz                                                                                                      | Quando usar                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                    | O provedor possui um catálogo ou padrões de URL base                                                                                          |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração pertencentes ao provedor durante a materialização da configuração        | Os padrões dependem do modo de autenticação, do ambiente ou da semântica da família de modelos do provedor                                    |
| --  | _(consulta de modelo integrada)_  | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                | _(não é um gancho de Plugin)_                                                                                                                 |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de prévia de IDs de modelo antes da consulta                                      | O provedor é responsável pela limpeza de aliases antes da resolução canônica do modelo                                                        |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família de provedores antes da montagem genérica do modelo                      | O provedor é responsável pela limpeza de transporte para IDs de provedor personalizados na mesma família de transporte                         |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                       | O provedor precisa de limpeza de configuração que deve viver com o Plugin; helpers da família Google incluídos também dão suporte a entradas compatíveis de configuração do Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo aos provedores de configuração                  | O provedor precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                                |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de ambiente para provedores de configuração antes do carregamento de autenticação de runtime | O provedor tem resolução de chave de API por marcador de ambiente pertencente ao provedor; `amazon-bedrock` também tem um resolvedor integrado de marcador de ambiente da AWS aqui |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/auto-hospedada ou baseada em configuração sem persistir texto simples                  | O provedor pode operar com um marcador de credencial sintética/local                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis de autenticação externa pertencentes ao provedor; o padrão de `persistence` é `runtime-only` para credenciais pertencentes à CLI/app | O provedor reutiliza credenciais de autenticação externa sem persistir tokens de atualização copiados; declare `contracts.externalAuthProviders` no manifesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa espaços reservados de perfis sintéticos armazenados atrás de autenticação baseada em ambiente/configuração | O provedor armazena perfis sintéticos de espaço reservado que não devem ter precedência                                                       |
| 11  | `resolveDynamicModel`             | Fallback síncrono para IDs de modelo pertencentes ao provedor que ainda não estão no registro local             | O provedor aceita IDs arbitrários de modelos upstream                                                                                         |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono, então `resolveDynamicModel` executa novamente                                         | O provedor precisa de metadados de rede antes de resolver IDs desconhecidos                                                                   |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o executor embutido usar o modelo resolvido                                           | O provedor precisa de reescritas de transporte, mas ainda usa um transporte do núcleo                                                         |
| 14  | `contributeResolvedModelCompat`   | Contribui sinalizadores de compatibilidade para modelos de fornecedor atrás de outro transporte compatível      | O provedor reconhece seus próprios modelos em transportes proxy sem assumir o controle do provedor                                             |
| 15  | `normalizeToolSchemas`            | Normaliza esquemas de ferramentas antes de o executor embutido vê-los                                          | O provedor precisa de limpeza de esquema da família de transporte                                                                              |
| 16  | `inspectToolSchemas`              | Expõe diagnósticos de esquema pertencentes ao provedor após a normalização                                     | O provedor quer avisos de palavras-chave sem ensinar regras específicas de provedor ao núcleo                                                  |
| 17  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo versus marcado                                                | O provedor precisa de raciocínio/saída final marcada em vez de campos nativos                                                                 |
| 18  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes dos wrappers genéricos de opção de stream                       | O provedor precisa de parâmetros de requisição padrão ou limpeza de parâmetros por provedor                                                    |
| 19  | `createStreamFn`                  | Substitui totalmente o caminho normal de stream por um transporte personalizado                                | O provedor precisa de um protocolo de fio personalizado, não apenas um wrapper                                                                |
| 20  | `wrapStreamFn`                    | Wrapper de stream depois que os wrappers genéricos são aplicados                                               | O provedor precisa de wrappers de compatibilidade de cabeçalhos/corpo/modelo de requisição sem um transporte personalizado                     |
| 21  | `resolveTransportTurnState`       | Anexa cabeçalhos ou metadados nativos de transporte por turno                                                  | O provedor quer que transportes genéricos enviem identidade de turno nativa do provedor                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos WebSocket nativos ou política de resfriamento de sessão                                       | O provedor quer que transportes WS genéricos ajustem cabeçalhos de sessão ou política de fallback                                             |
| 23  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado se torna a string `apiKey` de runtime                | O provedor armazena metadados extras de autenticação e precisa de um formato personalizado de token de runtime                                 |
| 24  | `refreshOAuth`                    | Substituição de atualização OAuth para endpoints de atualização personalizados ou política de falha de atualização | O provedor não se encaixa nos atualizadores compartilhados `pi-ai`                                                                            |
| 25  | `buildAuthDoctorHint`             | Dica de reparo anexada quando a atualização OAuth falha                                                        | O provedor precisa de orientação de reparo de autenticação pertencente ao provedor após falha de atualização                                   |
| 26  | `matchesContextOverflowError`     | Correspondência de estouro da janela de contexto pertencente ao provedor                                       | O provedor tem erros brutos de estouro que heurísticas genéricas não detectariam                                                              |
| 27  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provedor                                                    | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                                     |
| 28  | `isCacheTtlEligible`              | Política de cache de prompt para provedores proxy/backhaul                                                     | O provedor precisa de controle de TTL de cache específico de proxy                                                                            |
| 29  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação de autenticação ausente                                       | O provedor precisa de uma dica de recuperação de autenticação ausente específica do provedor                                                   |
| 30  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                                | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                                |
| 31  | `resolveThinkingProfile`          | Conjunto de níveis `/think` específicos do modelo, rótulos de exibição e padrão                               | O provedor expõe uma escala de pensamento personalizada ou rótulo binário para modelos selecionados                                           |
| 32  | `isBinaryThinking`                | Gancho de compatibilidade de alternância de raciocínio ligado/desligado                                        | O provedor expõe apenas pensamento binário ligado/desligado                                                                                   |
| 33  | `supportsXHighThinking`           | Gancho de compatibilidade de suporte a raciocínio `xhigh`                                                      | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                                   |
| 34  | `resolveDefaultThinkingLevel`     | Gancho de compatibilidade de nível `/think` padrão                                                             | O provedor é responsável pela política padrão de `/think` para uma família de modelos                                                         |
| 35  | `isModernModelRef`                | Correspondência de modelo moderno para filtros de perfil ao vivo e seleção de smoke                            | O provedor é responsável pela correspondência de modelos preferidos ao vivo/smoke                                                             |
| 36  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime logo antes da inferência                     | O provedor precisa de uma troca de token ou credencial de requisição de curta duração                                                         |
| 37  | `resolveUsageAuth`                | Resolver credenciais de uso/cobrança para `/usage` e superfícies de status relacionadas                                     | O provedor precisa de análise personalizada de token de uso/cota ou de uma credencial de uso diferente                                                               |
| 38  | `fetchUsageSnapshot`              | Buscar e normalizar snapshots de uso/cota específicos do provedor depois que a autenticação é resolvida                             | O provedor precisa de um endpoint de uso específico do provedor ou de um analisador de carga útil                                                                           |
| 39  | `createEmbeddingProvider`         | Criar um adaptador de embeddings pertencente ao provedor para memória/busca                                                     | O comportamento de embeddings de memória pertence ao Plugin do provedor                                                                                    |
| 40  | `buildReplayPolicy`               | Retornar uma política de replay que controla o tratamento de transcrições para o provedor                                        | O provedor precisa de uma política de transcrição personalizada (por exemplo, remoção de blocos de pensamento)                                                               |
| 41  | `sanitizeReplayHistory`           | Reescrever o histórico de replay após a limpeza genérica da transcrição                                                        | O provedor precisa de reescritas de replay específicas do provedor além dos auxiliares compartilhados de Compaction                                                             |
| 42  | `validateReplayTurns`             | Validação final de turnos de replay ou remodelagem antes do executor incorporado                                           | O transporte do provedor precisa de validação de turnos mais rigorosa após a sanitização genérica                                                                    |
| 43  | `onModelSelected`                 | Executar efeitos colaterais pós-seleção pertencentes ao provedor                                                                 | O provedor precisa de telemetria ou estado pertencente ao provedor quando um modelo se torna ativo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` verificam primeiro o
plugin de provedor correspondente e depois passam por outros plugins de provedor
com suporte a hooks até que um deles realmente altere o ID do modelo ou o
transporte/configuração. Isso mantém shims de alias/compatibilidade de provedor
funcionando sem exigir que o chamador saiba qual plugin incluído é dono da
reescrita. Se nenhum hook de provedor reescrever uma entrada de configuração
compatível da família Google, o normalizador de configuração Google incluído
ainda aplicará essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de rede totalmente personalizado ou de um
executor de solicitação personalizado, isso é uma classe diferente de extensão.
Esses hooks são para comportamento de provedor que ainda roda no loop de
inferência normal do OpenClaw.

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

Plugins de provedor incluídos combinam os hooks acima para se ajustar ao
catálogo, à autenticação, ao raciocínio, ao replay e às necessidades de uso de
cada fornecedor. O conjunto autoritativo de hooks fica com cada plugin em
`extensions/`; esta página ilustra os formatos em vez de espelhar a lista.

<AccordionGroup>
  <Accordion title="Provedores de catálogo com repasse">
    OpenRouter, Kilocode, Z.AI, xAI registram `catalog` mais
    `resolveDynamicModel` / `prepareDynamicModel` para poder expor IDs de
    modelos upstream antes do catálogo estático do OpenClaw.
  </Accordion>
  <Accordion title="Provedores de endpoints de OAuth e uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinam
    `prepareRuntimeAuth` ou `formatApiKey` com `resolveUsageAuth` +
    `fetchUsageSnapshot` para serem donos da troca de tokens e da integração
    com `/usage`.
  </Accordion>
  <Accordion title="Famílias de replay e limpeza de transcrição">
    Famílias nomeadas compartilhadas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permitem que provedores
    adotem política de transcrição via `buildReplayPolicy` em vez de cada plugin
    reimplementar a limpeza.
  </Accordion>
  <Accordion title="Provedores somente de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registram apenas `catalog` e usam o loop de inferência compartilhado.
  </Accordion>
  <Accordion title="Helpers de stream específicos da Anthropic">
    Cabeçalhos beta, `/fast` / `serviceTier` e `context1m` ficam dentro da
    superfície pública `api.ts` / `contract-api.ts` do plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) em vez do SDK
    genérico.
  </Accordion>
</AccordionGroup>

## Helpers de runtime

Plugins podem acessar helpers selecionados do núcleo via `api.runtime`. Para TTS:

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

- `textToSpeech` retorna o payload normal de saída de TTS do núcleo para superfícies de arquivo/nota de voz.
- Usa a configuração `messages.tts` do núcleo e a seleção de provedor.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem reamostrar/codificar para provedores.
- `listVoices` é opcional por provedor. Use-o para seletores de voz ou fluxos de configuração pertencentes ao fornecedor.
- Listagens de voz podem incluir metadados mais ricos, como localidade, gênero e tags de personalidade para seletores cientes do provedor.
- OpenAI e ElevenLabs oferecem suporte a telefonia hoje. Microsoft não.

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

- Mantenha política de TTS, fallback e entrega de resposta no núcleo.
- Use provedores de fala para comportamento de síntese pertencente ao fornecedor.
- A entrada legada `edge` da Microsoft é normalizada para o ID de provedor `microsoft`.
- O modelo de propriedade preferido é orientado à empresa: um plugin de fornecedor pode ser dono
  de provedores de texto, fala, imagem e mídia futura conforme o OpenClaw adiciona esses
  contratos de capacidade.

Para compreensão de imagem/áudio/vídeo, plugins registram um provedor tipado de
compreensão de mídia em vez de um pacote genérico de chave/valor:

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

- Mantenha orquestração, fallback, configuração e ligação de canais no núcleo.
- Mantenha o comportamento do fornecedor no plugin de provedor.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos
  opcionais de resultado, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o núcleo é dono do contrato de capacidade e do helper de runtime
  - plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - plugins de recurso/canal consomem `api.runtime.videoGeneration.*`

Para helpers de runtime de compreensão de mídia, plugins podem chamar:

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
```

Para transcrição de áudio, plugins podem usar o runtime de compreensão de mídia
ou o alias STT mais antigo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional quando o MIME não puder ser inferido de forma confiável:
  mime: "audio/ogg",
});
```

Observações:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferida para
  compreensão de imagem/áudio/vídeo.
- Usa a configuração de áudio de compreensão de mídia do núcleo (`tools.media.audio`) e a ordem de fallback de provedores.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não compatível).
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

- `provider` e `model` são substituições opcionais por execução, não mudanças persistentes de sessão.
- O OpenClaw só respeita esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback pertencentes a plugins, operadores devem optar por habilitar com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a destinos canônicos `provider/model` específicos, ou `"*"` para permitir explicitamente qualquer destino.
- Execuções de subagente de plugins não confiáveis ainda funcionam, mas solicitações de substituição são rejeitadas em vez de cair silenciosamente no fallback.
- Sessões de subagente criadas por plugins são marcadas com o ID do plugin criador. O fallback `api.runtime.subagent.deleteSession(...)` pode excluir apenas essas sessões pertencentes a ele; exclusão arbitrária de sessão ainda requer uma solicitação Gateway com escopo de administrador.

Para busca na web, plugins podem consumir o helper de runtime compartilhado em vez de
acessar diretamente a ligação de ferramentas do agente:

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

Plugins também podem registrar provedores de busca na web via
`api.registerWebSearchProvider(...)`.

Observações:

- Mantenha seleção de provedor, resolução de credenciais e semântica compartilhada de solicitações no núcleo.
- Use provedores de busca na web para transportes de busca específicos de fornecedores.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para plugins de recurso/canal que precisam de comportamento de busca sem depender do wrapper de ferramenta do agente.

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

- `generate(...)`: gera uma imagem usando a cadeia configurada de provedores de geração de imagem.
- `listProviders(...)`: lista provedores de geração de imagem disponíveis e suas capacidades.

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

- `path`: caminho da rota no servidor HTTP do gateway.
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway, ou `"plugin"` para autenticação/verificação de webhook gerenciada pelo plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver processado a solicitação.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento de Plugin. Use `api.registerHttpRoute(...)` em vez disso.
- Rotas de Plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um Plugin não pode substituir a rota de outro Plugin.
- Rotas sobrepostas com níveis de `auth` diferentes são rejeitadas. Mantenha cadeias de fallback `exact`/`prefix` apenas no mesmo nível de autenticação.
- Rotas `auth: "plugin"` **não** recebem escopos de runtime de operador automaticamente. Elas são para Webhooks/verificação de assinatura gerenciados pelo Plugin, não para chamadas privilegiadas de auxiliares do Gateway.
- Rotas `auth: "gateway"` executam dentro de um escopo de runtime de solicitação do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer de segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém escopos de runtime de rotas de Plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis que carregam identidade (por exemplo, `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) honram `x-openclaw-scopes` somente quando o cabeçalho está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas solicitações de rota de Plugin que carregam identidade, o escopo de runtime volta para `operator.write`
- Regra prática: não assuma que uma rota de Plugin com autenticação de Gateway seja uma superfície administrativa implícita. Se sua rota precisa de comportamento exclusivo para administradores, exija um modo de autenticação que carregue identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.

## Caminhos de importação do SDK de Plugin

Use subcaminhos estreitos do SDK em vez do barrel raiz monolítico `openclaw/plugin-sdk`
ao criar novos Plugins. Subcaminhos principais:

| Subcaminho                          | Finalidade                                         |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivos de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Auxiliares de entrada/build de canal               |
| `openclaw/plugin-sdk/core`          | Auxiliares compartilhados genéricos e contrato guarda-chuva |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |

Plugins de canal escolhem entre uma família de seams estreitos — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve se consolidar
em um contrato `approvalCapability`, em vez de misturar campos de Plugin
não relacionados. Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

Auxiliares de runtime e configuração ficam em subcaminhos `*-runtime` focados
correspondentes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefira `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
em vez do barrel amplo de compatibilidade `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` estão obsoletos como shims de compatibilidade para
Plugins mais antigos. Novo código deve importar primitivos genéricos mais estreitos.
</Info>

Pontos de entrada internos do repositório (por raiz de pacote de Plugin empacotado):

- `index.js` — entrada de Plugin empacotado
- `api.js` — barrel de auxiliares/tipos
- `runtime-api.js` — barrel somente de runtime
- `setup-entry.js` — entrada de Plugin de configuração

Plugins externos devem importar apenas subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe o `src/*` de outro pacote de Plugin a partir do core ou de outro Plugin.
Pontos de entrada carregados por fachada preferem o snapshot de configuração de runtime ativo quando ele
existe, depois recorrem ao arquivo de configuração resolvido em disco.

Subcaminhos específicos de capacidade, como `image-generation`, `media-understanding`
e `speech`, existem porque Plugins empacotados os usam hoje. Eles não são
automaticamente contratos externos congelados de longo prazo — confira a página de referência
do SDK relevante ao depender deles.

## Esquemas da ferramenta de mensagem

Plugins devem possuir contribuições de esquema `describeMessageTool(...)` específicas de canal
para primitivos que não são mensagens, como reações, leituras e enquetes.
A apresentação compartilhada de envio deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos do provedor para botões, componentes, blocos ou cards.
Consulte [Apresentação de Mensagem](/pt-BR/plugins/message-presentation) para o contrato,
as regras de fallback, o mapeamento de provedores e a checklist do autor do Plugin.

Plugins capazes de enviar declaram o que conseguem renderizar por meio de capacidades de mensagem:

- `presentation` para blocos semânticos de apresentação (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O core decide se renderiza a apresentação nativamente ou a degrada para texto.
Não exponha escapes de UI nativa do provedor pela ferramenta genérica de mensagem.
Auxiliares obsoletos do SDK para esquemas nativos legados continuam exportados para Plugins
de terceiros existentes, mas novos Plugins não devem usá-los.

## Resolução de destinos de canal

Plugins de canal devem possuir semânticas de destino específicas do canal. Mantenha o host
de saída compartilhado genérico e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da consulta ao diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve ir direto para resolução com aparência de id em vez de busca no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do Plugin quando
  o core precisa de uma resolução final de propriedade do provedor após a normalização ou após uma
  falha no diretório.
- `messaging.resolveOutboundSessionRoute(...)` possui a construção de rota de sessão
  específica do provedor assim que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes de
  pesquisar pares/grupos.
- Use `looksLikeId` para verificações de "tratar isto como um id de destino explícito/nativo".
- Use `resolveTarget` para fallback de normalização específico do provedor, não para
  busca ampla no diretório.
- Mantenha ids nativos do provedor, como ids de chat, ids de thread, JIDs, handles e ids
  de sala dentro de valores `target` ou parâmetros específicos do provedor, não em campos
  genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
Plugin e reutilizar os auxiliares compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isto quando um canal precisar de pares/grupos baseados em configuração, como:

- pares de DM orientados por lista de permissões
- mapas de canais/grupos configurados
- fallbacks de diretório estático com escopo de conta

Os auxiliares compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consultas
- aplicação de limites
- auxiliares de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta e normalização de ids específicas de canal devem permanecer na
implementação do Plugin.

## Catálogos de provedores

Plugins de provedor podem definir catálogos de modelos para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para várias entradas de provedor

Use `catalog` quando o Plugin possuir ids de modelo específicos do provedor, padrões
de URL base ou metadados de modelo protegidos por autenticação.

`catalog.order` controla quando o catálogo de um Plugin é mesclado em relação aos
provedores implícitos integrados do OpenClaw:

- `simple`: provedores simples orientados por chave de API ou env
- `profile`: provedores que aparecem quando perfis de autenticação existem
- `paired`: provedores que sintetizam várias entradas de provedor relacionadas
- `late`: última passagem, após outros provedores implícitos

Provedores posteriores vencem em colisões de chave, então Plugins podem substituir
intencionalmente uma entrada de provedor integrada com o mesmo id de provedor.

Compatibilidade:

- `discovery` ainda funciona como um alias legado
- se `catalog` e `discovery` forem registrados, o OpenClaw usa `catalog`

## Inspeção de canal somente leitura

Se seu Plugin registra um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que credenciais
  estão totalmente materializadas e falhar rapidamente quando segredos obrigatórios estiverem ausentes.
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

Isso permite que comandos somente leitura relatem "configurado, mas indisponível neste caminho
de comando" em vez de falhar ou reportar incorretamente a conta como não configurada.

## Packs de pacote

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

Cada entrada se torna um Plugin. Se o pack listar várias extensões, o id do Plugin
se torna `name/<fileBase>`.

Se seu Plugin importa dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Proteção de segurança: toda entrada `openclaw.extensions` deve permanecer dentro do diretório
do Plugin após a resolução de symlink. Entradas que escapam do diretório do pacote são
rejeitadas.

Nota de segurança: `openclaw plugins install` instala dependências de Plugin com um
`npm install --omit=dev --ignore-scripts` local do projeto (sem scripts de ciclo de vida,
sem dependências de desenvolvimento em runtime), ignorando configurações globais herdadas de instalação npm.
Mantenha árvores de dependência de Plugin "JS/TS puras" e evite pacotes que exigem
builds `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve somente de configuração.
Quando o OpenClaw precisa de superfícies de configuração para um Plugin de canal desativado, ou
quando um Plugin de canal está ativado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do Plugin. Isso mantém a inicialização e a configuração mais leves
quando a entrada principal do seu Plugin também conecta ferramentas, hooks ou outro código
somente de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode fazer um Plugin de canal optar pelo mesmo caminho `setupEntry` durante a fase de inicialização
pré-escuta do Gateway, mesmo quando o canal já está configurado.

Use isso apenas quando `setupEntry` cobre totalmente a superfície de inicialização que deve existir
antes que o Gateway comece a escutar. Na prática, isso significa que a entrada de configuração
deve registrar toda capacidade de propriedade do canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que devem estar disponíveis antes que o Gateway comece a escutar
- quaisquer métodos, ferramentas ou serviços do Gateway que devem existir durante essa mesma janela

Se sua entrada completa ainda possuir alguma capacidade de inicialização obrigatória, não habilite
esta flag. Mantenha o Plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais empacotados também podem publicar auxiliares de superfície de contrato somente de configuração que o core
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual de
promoção de configuração é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O núcleo usa essa superfície quando precisa promover uma configuração legada de canal de conta única para `channels.<id>.accounts.*` sem carregar a entrada completa do Plugin. Matrix é o exemplo integrado atual: ele move apenas chaves de autenticação/bootstrap para uma conta promovida nomeada quando contas nomeadas já existem, e pode preservar uma chave de conta padrão não canônica configurada em vez de sempre criar `accounts.default`.

Esses adaptadores de patch de configuração mantêm a descoberta de superfície de contrato integrada lazy. O tempo de importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso, em vez de reentrar na inicialização do canal integrado na importação do módulo.

Quando essas superfícies de inicialização incluem métodos RPC do Gateway, mantenha-os em um prefixo específico do Plugin. Namespaces administrativos do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre resolvem para `operator.admin`, mesmo que um Plugin solicite um escopo mais estreito.

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

Plugins de canal podem anunciar metadados de configuração/descoberta via `openclaw.channel` e dicas de instalação via `openclaw.install`. Isso mantém o catálogo do núcleo livre de dados.

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

- `detailLabel`: rótulo secundário para superfícies mais completas de catálogo/status
- `docsLabel`: substitui o texto do link para o link da documentação
- `preferOver`: IDs de Plugin/canal de menor prioridade que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos para compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: opta o canal para o fluxo padrão de início rápido `allowFrom`
- `forceAccountBinding`: exige vinculação explícita de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca de sessão ao resolver destinos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canais** (por exemplo, uma exportação de registro MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O analisador também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

Entradas geradas do catálogo de canais e entradas do catálogo de instalação de provedores expõem fatos normalizados de fonte de instalação junto ao bloco bruto `openclaw.install`. Os fatos normalizados identificam se a especificação npm é uma versão exata ou um seletor flutuante, se metadados de integridade esperados estão presentes e se um caminho de origem local também está disponível. Quando a identidade do catálogo/pacote é conhecida, os fatos normalizados avisam se o nome do pacote npm analisado diverge dessa identidade. Eles também avisam quando `defaultChoice` é inválido ou aponta para uma fonte indisponível, e quando metadados de integridade npm estão presentes sem uma fonte npm válida. Consumidores devem tratar `installSource` como um campo opcional aditivo para que entradas criadas manualmente e shims de catálogo não precisem sintetizá-lo. Isso permite que onboarding e diagnósticos expliquem o estado do plano de fontes sem importar o runtime do Plugin.

Entradas npm oficiais externas devem preferir um `npmSpec` exato mais `expectedIntegrity`. Nomes simples de pacote e dist-tags ainda funcionam por compatibilidade, mas exibem avisos do plano de fontes para que o catálogo possa avançar para instalações fixadas e verificadas por integridade sem quebrar Plugins existentes. Quando o onboarding instala a partir de um caminho de catálogo local, ele registra uma entrada gerenciada de índice de Plugins com `source: "path"` e um `sourcePath` relativo ao workspace quando possível. O caminho operacional absoluto de carregamento permanece em `plugins.load.paths`; o registro de instalação evita duplicar caminhos de estações de trabalho locais em configurações duradouras. Isso mantém instalações de desenvolvimento local visíveis para diagnósticos do plano de fontes sem adicionar uma segunda superfície bruta de divulgação de caminho do sistema de arquivos. O índice de Plugins persistido em `plugins/installs.json` é a fonte da verdade de instalação e pode ser atualizado sem carregar módulos de runtime de Plugin. Seu mapa `installRecords` é durável mesmo quando um manifesto de Plugin está ausente ou é inválido; seu array `plugins` é uma visão reconstruível de manifestos.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto controlam a orquestração de contexto de sessão para ingestão, montagem e Compaction. Registre-os a partir do seu Plugin com `api.registerContextEngine(id, factory)` e então selecione o mecanismo ativo com `plugins.slots.contextEngine`.

Use isso quando seu Plugin precisar substituir ou estender o pipeline de contexto padrão, em vez de apenas adicionar busca de memória ou hooks.

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

A factory `ctx` expõe valores opcionais de `config`, `agentDir` e `workspaceDir` para inicialização em tempo de construção.

Se o seu mecanismo **não** controla o algoritmo de Compaction, mantenha `compact()` implementado e delegue explicitamente:

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

Quando um Plugin precisa de um comportamento que não se encaixa na API atual, não contorne o sistema de Plugins com um acesso privado interno. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato do núcleo
   Decida qual comportamento compartilhado o núcleo deve controlar: política, fallback, mesclagem de configuração, ciclo de vida, semântica voltada ao canal e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de Plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada de capacidade que seja útil.
3. conecte consumidores do núcleo + canal/recurso
   Canais e Plugins de recurso devem consumir a nova capacidade por meio do núcleo, não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedores
   Plugins de fornecedor então registram seus backends na capacidade.
5. adicione cobertura de contrato
   Adicione testes para que a propriedade e o formato de registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw se mantém opinativo sem ficar hardcoded à visão de mundo de um único provedor. Consulte o [Livro de receitas de capacidades](/pt-BR/plugins/architecture) para uma checklist concreta de arquivos e um exemplo trabalhado.

### Checklist de capacidade

Quando você adiciona uma nova capacidade, a implementação geralmente deve tocar estas superfícies em conjunto:

- tipos de contrato do núcleo em `src/<capability>/types.ts`
- helper de executor/runtime do núcleo em `src/<capability>/runtime.ts`
- superfície de registro da API de Plugin em `src/plugins/types.ts`
- conexão do registro de Plugins em `src/plugins/registry.ts`
- exposição de runtime de Plugin em `src/plugins/runtime/*` quando Plugins de recurso/canal precisam consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação de operador/Plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso geralmente é um sinal de que a capacidade ainda não está totalmente integrada.

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

- o núcleo controla o contrato de capacidade + a orquestração
- Plugins de fornecedor controlam implementações de fornecedor
- Plugins de recurso/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita

## Relacionados

- [Arquitetura de Plugins](/pt-BR/plugins/architecture) — modelo e formatos públicos de capacidade
- [Subcaminhos do SDK de Plugins](/pt-BR/plugins/sdk-subpaths)
- [Configuração do SDK de Plugins](/pt-BR/plugins/sdk-setup)
- [Criando Plugins](/pt-BR/plugins/building-plugins)
