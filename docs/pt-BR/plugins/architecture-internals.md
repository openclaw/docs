---
read_when:
    - Implementando ganchos de tempo de execução de provedores, ciclo de vida de canais ou conjuntos de pacotes
    - Depuração da ordem de carregamento de Plugin ou do estado do registro
    - Adicionar uma nova capacidade de Plugin ou Plugin de mecanismo de contexto
summary: 'Detalhes internos da arquitetura de Plugin: pipeline de carregamento, registro, hooks de tempo de execução, rotas HTTP e tabelas de referência'
title: Detalhes internos da arquitetura de Plugin
x-i18n:
    generated_at: "2026-05-10T19:40:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41a28b83759906df693a00f3a20237bb7b91905eb948ff7bb354608e7997119
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para o modelo público de capacidades, formatos de Plugin e contratos de
propriedade/execução, consulte [Arquitetura de Plugin](/pt-BR/plugins/architecture). Esta página é a
referência para os mecanismos internos: pipeline de carregamento, registro, hooks de runtime,
rotas HTTP do Gateway, caminhos de importação e tabelas de esquema.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de plugins
2. lê manifestos de pacotes nativos ou compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega módulos nativos habilitados: módulos empacotados compilados usam um carregador nativo;
   código-fonte TypeScript local de terceiros usa o fallback emergencial Jiti
7. chama hooks nativos `register(api)` e coleta registros no registro de plugins
8. expõe o registro a comandos/superfícies de runtime

<Note>
`activate` é um alias legado de `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins empacotados usam `register`; prefira `register` para novos plugins.
</Note>

As barreiras de segurança acontecem **antes** da execução de runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do plugin, o caminho pode ser gravado por qualquer usuário ou a
propriedade do caminho parece suspeita para plugins não empacotados.

Candidatos bloqueados permanecem vinculados ao respectivo id de plugin para diagnósticos. Se a configuração
ainda referenciar esse id, a validação relata o plugin como presente, mas bloqueado,
e aponta de volta para o aviso de segurança de caminho em vez de tratar a entrada de configuração
como obsoleta.

### Comportamento com manifesto em primeiro lugar

O manifesto é a fonte da verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/Skills/esquema de configuração declarados ou capacidades do pacote
- validar `plugins.entries.<id>.config`
- complementar rótulos/placeholders da UI de Controle
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
comportamento real, como hooks, ferramentas, comandos ou fluxos de provedor.

Blocos opcionais `activation` e `setup` do manifesto permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de configuração;
eles não substituem o registro de runtime, `register(...)` nem `setupEntry`.
Os primeiros consumidores de ativação ao vivo agora usam dicas de comando, canal e provedor do manifesto
para restringir o carregamento de plugins antes de materialização mais ampla do registro:

- o carregamento da CLI restringe para plugins que são donos do comando primário solicitado
- a configuração/resolução de plugin de canal restringe para plugins que são donos do
  id de canal solicitado
- a configuração/resolução de runtime explícita de provedor restringe para plugins que são donos do
  id de provedor solicitado
- o planejamento de inicialização do Gateway usa `activation.onStartup` para importações explícitas
  de inicialização e opt-outs de inicialização; plugins sem metadados de inicialização carregam apenas
  por meio de gatilhos de ativação mais restritos

Pré-carregamentos de runtime no momento da solicitação que pedem o escopo amplo `all` ainda derivam um
conjunto explícito de ids de plugin efetivos a partir da configuração, planejamento de inicialização, canais
configurados, slots e regras de habilitação automática. Se esse conjunto derivado estiver vazio, o OpenClaw
carrega um registro de runtime vazio em vez de ampliar para todos os plugins descobríveis.

O planejador de ativação expõe uma API somente de ids para chamadores existentes e uma
API de plano para novos diagnósticos. Entradas de plano informam por que um plugin foi selecionado,
separando dicas explícitas do planejador `activation.*` de fallback de propriedade do manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks. Essa separação de motivo é o limite de compatibilidade:
metadados existentes de plugin continuam funcionando, enquanto novo código pode detectar dicas amplas
ou comportamento de fallback sem alterar a semântica de carregamento de runtime.

A descoberta de configuração agora prefere ids pertencentes ao descritor, como `setup.providers` e
`setup.cliBackends`, para restringir plugins candidatos antes de recorrer a
`setup-api` para plugins que ainda precisam de hooks de runtime no momento da configuração. Listas de
configuração de provedores usam `providerAuthChoices` do manifesto, escolhas de configuração derivadas
do descritor e metadados do catálogo de instalação sem carregar o runtime do provedor. `setup.requiresRuntime: false`
explícito é um corte somente de descritor; `requiresRuntime` omitido mantém o fallback legado de setup-api
por compatibilidade. Se mais de um plugin descoberto declarar o mesmo provedor de configuração normalizado
ou id de backend de CLI, a busca de configuração recusa o dono ambíguo em vez de depender da
ordem de descoberta. Quando o runtime de configuração executa, os diagnósticos do registro relatam
desvio entre `setup.providers` / `setup.cliBackends` e os provedores ou backends de CLI
registrados por setup-api sem bloquear plugins legados.

### Limite de cache de plugins

O OpenClaw não armazena em cache resultados de descoberta de plugins nem dados diretos do registro de manifesto
por janelas de tempo de relógio. Instalações, edições de manifesto e alterações de caminhos de carregamento
devem ficar visíveis na próxima leitura explícita de metadados ou reconstrução de snapshot.
O parser do arquivo de manifesto pode manter um cache limitado de assinatura de arquivo, indexado pelo
caminho do manifesto aberto, inode, tamanho e timestamps; esse cache apenas evita
reprocessar bytes inalterados e não deve armazenar em cache respostas de descoberta, registro, dono ou
política.

O caminho rápido seguro de metadados é propriedade explícita de objeto, não um cache oculto.
Caminhos críticos de inicialização do Gateway devem passar o `PluginMetadataSnapshot` atual, a
`PluginLookUpTable` derivada ou um registro explícito de manifesto pela cadeia de chamadas.
Validação de configuração, habilitação automática de inicialização, bootstrap de plugin e seleção de provedor
podem reutilizar esses objetos enquanto eles representam a configuração atual e o inventário de plugins.
A busca de configuração ainda reconstrói metadados de manifesto sob demanda, a menos que o caminho específico
de configuração receba um registro explícito de manifesto; mantenha isso como um fallback de caminho frio
em vez de adicionar caches ocultos de busca. Quando a entrada mudar, reconstrua e substitua o snapshot
em vez de alterá-lo ou manter cópias históricas.
Views sobre o registro ativo de plugins e helpers de bootstrap de canais empacotados
devem ser recomputadas a partir do registro/raiz atual. Mapas de curta duração são aceitáveis
dentro de uma chamada para deduplicar trabalho ou proteger reentrada; eles não devem se tornar caches
de metadados de processo.

Para carregamento de plugins, a camada de cache persistente é o carregamento de runtime. Ela pode reutilizar
estado do carregador quando código ou artefatos instalados são de fato carregados, como:

- `PluginLoaderCacheState` e registros compatíveis de runtime ativo
- caches jiti/módulo e caches de carregador de superfície pública usados para evitar importar
  a mesma superfície de runtime repetidamente
- caches de sistema de arquivos para artefatos de plugins instalados
- mapas de curta duração por chamada para normalização de caminho ou resolução de duplicatas

Esses caches são detalhes de implementação do plano de dados. Eles não devem responder
perguntas do plano de controle como "qual plugin é dono deste provedor?", a menos que o
chamador tenha solicitado deliberadamente o carregamento de runtime.

Não adicione caches persistentes ou por relógio para:

- resultados de descoberta
- registros diretos de manifesto
- registros de manifesto reconstruídos a partir do índice de plugins instalados
- busca de dono de provedor, supressão de modelo, política de provedor ou metadados de artefato
  público
- qualquer outra resposta derivada de manifesto em que um manifesto, índice instalado
  ou caminho de carregamento alterado deva ficar visível na próxima leitura de metadados

Chamadores que reconstroem metadados de manifesto a partir do índice persistido de plugins instalados
reconstroem esse registro sob demanda. O índice instalado é estado durável do plano-fonte;
ele não é um cache oculto de metadados em processo.

## Modelo de registro

Plugins carregados não alteram diretamente globais aleatórios do core. Eles se registram em um
registro central de plugins.

O registro acompanha:

- registros de plugin (identidade, fonte, origem, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- manipuladores RPC do Gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos pertencentes a plugins

Recursos do core então leem desse registro em vez de falar diretamente com módulos de plugin.
Isso mantém o carregamento unidirecional:

- módulo de plugin -> registro no registro
- runtime do core -> consumo do registro

Essa separação importa para a manutenibilidade. Ela significa que a maioria das superfícies do core só
precisa de um ponto de integração: "ler o registro", não "tratar cada módulo de plugin como caso especial".

## Callbacks de vinculação de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma solicitação de vinculação
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
- `binding`: a vinculação resolvida para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de desvinculação, id do remetente e
  metadados da conversa

Este callback é apenas uma notificação. Ele não altera quem tem permissão para vincular uma
conversa, e executa depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provedor

Plugins de provedor têm três camadas:

- **Metadados de manifesto** para busca barata antes do runtime:
  `setup.providers[].envVars`, compatibilidade obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hooks de tempo de configuração**: `catalog` (`discovery` legado) mais
  `applyConfigDefaults`.
- **Hooks de runtime**: mais de 40 hooks opcionais cobrindo autenticação, resolução de modelo,
  encapsulamento de stream, níveis de thinking, política de replay e endpoints de uso. Consulte
  a lista completa em [Ordem e uso dos hooks](#hook-order-and-usage).

O OpenClaw ainda é dono do loop genérico de agente, failover, tratamento de transcrição e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de provedor
sem precisar de um transporte de inferência totalmente customizado.

Use `setup.providers[].envVars` do manifesto quando o provedor tiver credenciais baseadas em env
que caminhos genéricos de autenticação/status/seletor de modelos devam ver sem
carregar o runtime do plugin. `providerAuthEnvVars` obsoleto ainda é lido pelo
adaptador de compatibilidade durante a janela de depreciação, e plugins não empacotados
que o usam recebem um diagnóstico de manifesto. Use `providerAuthAliases` do manifesto
quando um id de provedor deve reutilizar variáveis de ambiente, perfis de autenticação,
autenticação baseada em configuração e escolha de onboarding por chave de API de outro id de provedor. Use
`providerAuthChoices` do manifesto quando superfícies de CLI de onboarding/escolha de autenticação devem conhecer
o id de escolha do provedor, rótulos de grupo e ligação simples de autenticação por uma flag
sem carregar o runtime do provedor. Mantenha `envVars` do runtime do provedor
para dicas voltadas a operadores, como rótulos de onboarding ou variáveis de configuração de
client-id/client-secret OAuth.

Use `channelEnvVars` do manifesto quando um canal tiver autenticação ou configuração orientada por env que
fallback genérico de shell-env, verificações de configuração/status ou prompts de configuração devam ver
sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para plugins de modelo/provedor, o OpenClaw chama hooks nesta ordem aproximada.
A coluna "Quando usar" é o guia rápido de decisão.
Campos de provedor somente de compatibilidade que o OpenClaw não chama mais, como
`ProviderPlugin.capabilities` e `suppressBuiltInModel`, são intencionalmente
omitidos aqui.

| #   | Gancho                            | O que faz                                                                                                      | Quando usar                                                                                                                                     |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                    | O provedor possui um catálogo ou padrões de URL base                                                                                             |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração pertencentes ao provedor durante a materialização da configuração        | Os padrões dependem do modo de autenticação, do ambiente ou da semântica da família de modelos do provedor                                        |
| --  | _(consulta de modelo integrada)_  | OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                  | _(não é um gancho de Plugin)_                                                                                                                    |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de pré-visualização de IDs de modelo antes da consulta                            | O provedor é responsável pela limpeza de aliases antes da resolução canônica do modelo                                                           |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo                        | O provedor é responsável pela limpeza de transporte para IDs de provedor personalizados na mesma família de transporte                           |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                       | O provedor precisa de limpeza de configuração que deve ficar com o Plugin; auxiliares agrupados da família Google também cobrem entradas compatíveis de configuração do Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo aos provedores de configuração                 | O provedor precisa de correções de metadados de uso de streaming nativo orientadas pelo endpoint                                                  |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de ambiente para provedores de configuração antes do carregamento da autenticação de runtime | O provedor tem resolução de chave de API por marcador de ambiente pertencente ao provedor; `amazon-bedrock` também tem aqui um resolvedor integrado de marcador de ambiente AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/auto-hospedada ou baseada em configuração sem persistir texto simples                 | O provedor pode operar com um marcador de credencial sintético/local                                                                              |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis de autenticação externos pertencentes ao provedor; o `persistence` padrão é `runtime-only` para credenciais pertencentes à CLI/app | O provedor reutiliza credenciais de autenticação externas sem persistir tokens de atualização copiados; declare `contracts.externalAuthProviders` no manifesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders de perfil sintético armazenados atrás de autenticação baseada em ambiente/configuração     | O provedor armazena perfis placeholder sintéticos que não devem vencer por precedência                                                           |
| 11  | `resolveDynamicModel`             | Fallback síncrono para IDs de modelo pertencentes ao provedor que ainda não estão no registro local             | O provedor aceita IDs arbitrários de modelos upstream                                                                                             |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono; depois `resolveDynamicModel` é executado novamente                                     | O provedor precisa de metadados de rede antes de resolver IDs desconhecidos                                                                       |
| 13  | `normalizeResolvedModel`          | Reescrita final antes que o executor incorporado use o modelo resolvido                                        | O provedor precisa de reescritas de transporte, mas ainda usa um transporte do núcleo                                                            |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos de fornecedor por trás de outro transporte compatível           | O provedor reconhece seus próprios modelos em transportes de proxy sem assumir o provedor                                                        |
| 15  | `normalizeToolSchemas`            | Normaliza esquemas de ferramentas antes que o executor incorporado os veja                                     | O provedor precisa de limpeza de esquema da família de transporte                                                                                 |
| 16  | `inspectToolSchemas`              | Expõe diagnósticos de esquema pertencentes ao provedor após a normalização                                     | O provedor quer avisos de palavras-chave sem ensinar regras específicas de provedor ao núcleo                                                    |
| 17  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo versus marcado                                                | O provedor precisa de raciocínio/saída final marcada em vez de campos nativos                                                                    |
| 18  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes dos wrappers genéricos de opção de stream                       | O provedor precisa de parâmetros de requisição padrão ou limpeza de parâmetros por provedor                                                       |
| 19  | `createStreamFn`                  | Substitui totalmente o caminho normal de stream por um transporte personalizado                                | O provedor precisa de um protocolo de fio personalizado, não apenas um wrapper                                                                   |
| 20  | `wrapStreamFn`                    | Wrapper de stream depois que os wrappers genéricos são aplicados                                               | O provedor precisa de wrappers de compatibilidade de cabeçalhos/corpo/modelo de requisição sem um transporte personalizado                       |
| 21  | `resolveTransportTurnState`       | Anexa cabeçalhos ou metadados nativos de transporte por turno                                                  | O provedor quer que transportes genéricos enviem identidade de turno nativa do provedor                                                          |
| 22  | `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos nativos de WebSocket ou política de espera de sessão                                          | O provedor quer que transportes WS genéricos ajustem cabeçalhos de sessão ou política de fallback                                                |
| 23  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado se torna a string `apiKey` de runtime                | O provedor armazena metadados extras de autenticação e precisa de um formato de token de runtime personalizado                                    |
| 24  | `refreshOAuth`                    | Sobrescrita de atualização OAuth para endpoints de atualização personalizados ou política de falha de atualização | O provedor não se encaixa nos atualizadores `pi-ai` compartilhados                                                                               |
| 25  | `buildAuthDoctorHint`             | Dica de reparo anexada quando a atualização OAuth falha                                                        | O provedor precisa de orientação de reparo de autenticação pertencente ao provedor após falha de atualização                                     |
| 26  | `matchesContextOverflowError`     | Correspondedor de estouro da janela de contexto pertencente ao provedor                                        | O provedor tem erros brutos de estouro que heurísticas genéricas não identificariam                                                              |
| 27  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provedor                                                    | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                                        |
| 28  | `isCacheTtlEligible`              | Política de cache de prompt para provedores de proxy/backhaul                                                  | O provedor precisa de controle de TTL de cache específico de proxy                                                                               |
| 29  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação de autenticação ausente                                       | O provedor precisa de uma dica de recuperação de autenticação ausente específica do provedor                                                     |
| 30  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                                | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                                   |
| 31  | `resolveThinkingProfile`          | Conjunto de níveis `/think` específico do modelo, rótulos de exibição e padrão                                | O provedor expõe uma escala de thinking personalizada ou rótulo binário para modelos selecionados                                                 |
| 32  | `isBinaryThinking`                | Gancho de compatibilidade de alternância de raciocínio ligado/desligado                                        | O provedor expõe apenas thinking binário ligado/desligado                                                                                        |
| 33  | `supportsXHighThinking`           | Gancho de compatibilidade com suporte a raciocínio `xhigh`                                                     | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                                      |
| 34  | `resolveDefaultThinkingLevel`     | Gancho de compatibilidade de nível `/think` padrão                                                             | O provedor é responsável pela política `/think` padrão para uma família de modelos                                                               |
| 35  | `isModernModelRef`                | Correspondedor de modelo moderno para filtros de perfil ao vivo e seleção de smoke                             | O provedor é responsável pela correspondência de modelo preferido ao vivo/smoke                                                                  |
| 36  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime imediatamente antes da inferência             | O provedor precisa de uma troca de token ou credencial de requisição de curta duração                                                            |
| 37  | `resolveUsageAuth`                | Resolver credenciais de uso/cobrança para `/usage` e superfícies de status relacionadas                                     | O provedor precisa de análise personalizada de tokens de uso/cota ou de uma credencial de uso diferente                                                               |
| 38  | `fetchUsageSnapshot`              | Buscar e normalizar snapshots de uso/cota específicos do provedor depois que a autenticação for resolvida                             | O provedor precisa de um endpoint de uso específico do provedor ou de um analisador de payload                                                                           |
| 39  | `createEmbeddingProvider`         | Criar um adaptador de embeddings controlado pelo provedor para memória/busca                                                     | O comportamento de embeddings de memória pertence ao Plugin do provedor                                                                                    |
| 40  | `buildReplayPolicy`               | Retornar uma política de repetição que controla o tratamento da transcrição para o provedor                                        | O provedor precisa de uma política de transcrição personalizada (por exemplo, remoção de blocos de pensamento)                                                               |
| 41  | `sanitizeReplayHistory`           | Reescrever o histórico de repetição após a limpeza genérica da transcrição                                                        | O provedor precisa de reescritas de repetição específicas do provedor além dos auxiliares compartilhados de Compaction                                                             |
| 42  | `validateReplayTurns`             | Validação final dos turnos de repetição ou remodelagem antes do executor incorporado                                           | O transporte do provedor precisa de validação de turnos mais rigorosa após a sanitização genérica                                                                    |
| 43  | `onModelSelected`                 | Executar efeitos colaterais pós-seleção controlados pelo provedor                                                                 | O provedor precisa de telemetria ou estado controlado pelo provedor quando um modelo se torna ativo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
Plugin de provedor correspondente e, em seguida, passam por outros Plugins de
provedor compatíveis com hooks até que um deles realmente altere o ID do modelo
ou o transporte/configuração. Isso mantém shims de provedor para
alias/compatibilidade funcionando sem exigir que o chamador saiba qual Plugin
incluído é dono da reescrita. Se nenhum hook de provedor reescrever uma entrada
de configuração compatível da família Google, o normalizador de configuração do
Google incluído ainda aplica essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de fio totalmente personalizado ou de um
executor de solicitação personalizado, isso é uma classe diferente de extensão.
Esses hooks são para comportamento de provedor que ainda roda no loop normal de
inferência do OpenClaw.

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
catálogo, à autenticação, ao raciocínio, à reprodução e às necessidades de uso
de cada fornecedor. O conjunto autoritativo de hooks fica com cada Plugin em
`extensions/`; esta página ilustra os formatos em vez de espelhar a lista.

<AccordionGroup>
  <Accordion title="Provedores de catálogo de passagem direta">
    OpenRouter, Kilocode, Z.AI, xAI registram `catalog` mais
    `resolveDynamicModel` / `prepareDynamicModel` para que possam expor IDs de
    modelos upstream antes do catálogo estático do OpenClaw.
  </Accordion>
  <Accordion title="Provedores de OAuth e endpoint de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinam
    `prepareRuntimeAuth` ou `formatApiKey` com `resolveUsageAuth` +
    `fetchUsageSnapshot` para serem donos da troca de tokens e da integração de
    `/usage`.
  </Accordion>
  <Accordion title="Famílias de limpeza de reprodução e transcrição">
    Famílias nomeadas compartilhadas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permitem que provedores
    optem pela política de transcrição via `buildReplayPolicy`, em vez de cada
    Plugin reimplementar a limpeza.
  </Accordion>
  <Accordion title="Provedores apenas de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registram apenas `catalog` e usam o loop de inferência
    compartilhado.
  </Accordion>
  <Accordion title="Auxiliares de stream específicos da Anthropic">
    Cabeçalhos beta, `/fast` / `serviceTier` e `context1m` ficam dentro da
    borda pública `api.ts` / `contract-api.ts` do Plugin da Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) em vez do SDK
    genérico.
  </Accordion>
</AccordionGroup>

## Auxiliares de runtime

Plugins podem acessar auxiliares selecionados do núcleo via `api.runtime`. Para TTS:

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
- Usa a configuração core `messages.tts` e a seleção de provedor.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem reamostrar/codificar para provedores.
- `listVoices` é opcional por provedor. Use-o para seletores de voz ou fluxos de configuração de propriedade do fornecedor.
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
- Use provedores de fala para comportamento de síntese de propriedade do fornecedor.
- A entrada legada `edge` da Microsoft é normalizada para o ID de provedor `microsoft`.
- O modelo de propriedade preferido é orientado por empresa: um Plugin de fornecedor pode ser dono
  de provedores de texto, fala, imagem e mídia futura à medida que o OpenClaw adiciona esses
  contratos de capacidade.

Para entendimento de imagem/áudio/vídeo, Plugins registram um provedor tipado
de entendimento de mídia em vez de um pacote genérico de chave/valor:

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

- Mantenha orquestração, fallback, configuração e conexão de canais no núcleo.
- Mantenha o comportamento do fornecedor no Plugin de provedor.
- A expansão aditiva deve continuar tipada: novos métodos opcionais, novos campos
  de resultado opcionais, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o núcleo é dono do contrato de capacidade e do auxiliar de runtime
  - Plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - Plugins de recurso/canal consomem `api.runtime.videoGeneration.*`

Para auxiliares de runtime de entendimento de mídia, Plugins podem chamar:

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

Para transcrição de áudio, Plugins podem usar o runtime de entendimento de mídia
ou o alias de STT mais antigo:

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
  entendimento de imagem/áudio/vídeo.
- Usa a configuração de áudio de entendimento de mídia do núcleo (`tools.media.audio`) e a ordem de fallback de provedores.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não compatível).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidade.

Plugins também podem iniciar execuções de subagente em segundo plano por meio de `api.runtime.subagent`:

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
- Para execuções de fallback de propriedade do Plugin, operadores devem optar explicitamente com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir Plugins confiáveis a alvos canônicos `provider/model` específicos, ou `"*"` para permitir qualquer alvo explicitamente.
- Execuções de subagente de Plugins não confiáveis ainda funcionam, mas solicitações de substituição são rejeitadas em vez de fazer fallback silenciosamente.
- Sessões de subagente criadas por Plugin são marcadas com o ID do Plugin criador. O fallback `api.runtime.subagent.deleteSession(...)` pode excluir apenas essas sessões de propriedade; a exclusão arbitrária de sessão ainda requer uma solicitação de Gateway com escopo de administrador.

Para pesquisa na web, Plugins podem consumir o auxiliar de runtime compartilhado em vez de
acessar a fiação de ferramentas do agente:

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

- Mantenha seleção de provedor, resolução de credenciais e semântica compartilhada de solicitação no núcleo.
- Use provedores de pesquisa na web para transportes de pesquisa específicos de fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para Plugins de recurso/canal que precisam de comportamento de pesquisa sem depender do wrapper de ferramenta do agente.

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

Campos de rota:

- `path`: caminho da rota sob o servidor HTTP do Gateway.
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway, ou `"plugin"` para autenticação/verificação de webhook gerenciada pelo Plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo Plugin substitua seu próprio registro de rota existente.
- `handler`: retorna `true` quando a rota processou a solicitação.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento de plugin. Use `api.registerHttpRoute(...)` em vez disso.
- Rotas de Plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com níveis de `auth` diferentes são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de autenticação.
- Rotas com `auth: "plugin"` **não** recebem escopos de runtime de operador automaticamente. Elas são para webhooks/verificação de assinatura gerenciados pelo plugin, não para chamadas privilegiadas de auxiliares do Gateway.
- Rotas com `auth: "gateway"` são executadas dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém escopos de runtime de rotas de plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis que carregam identidade (por exemplo, `trusted-proxy` ou `gateway.auth.mode = "none"` em um ingresso privado) respeitam `x-openclaw-scopes` apenas quando o cabeçalho está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas requisições de rota de plugin que carregam identidade, o escopo de runtime volta para `operator.write`
- Regra prática: não presuma que uma rota de plugin com autenticação de gateway seja uma superfície administrativa implícita. Se sua rota precisa de comportamento apenas para administradores, exija um modo de autenticação que carregue identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.

## Caminhos de importação do SDK de Plugin

Use subcaminhos estreitos do SDK em vez do barrel raiz monolítico `openclaw/plugin-sdk`
ao criar novos plugins. Subcaminhos principais:

| Subcaminho                          | Finalidade                                         |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivos de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Auxiliares de entrada/build de canal               |
| `openclaw/plugin-sdk/core`          | Auxiliares compartilhados genéricos e contrato guarda-chuva |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |

Plugins de canal escolhem entre uma família de pontos de integração estreitos — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve se consolidar
em um único contrato `approvalCapability`, em vez de misturar campos de
plugin não relacionados. Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

Auxiliares de runtime e configuração ficam em subcaminhos `*-runtime` focados correspondentes
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` etc.). Prefira `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
em vez do barrel amplo de compatibilidade `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` são shims de compatibilidade obsoletos para
plugins mais antigos. Código novo deve importar primitivos genéricos mais estreitos em vez disso.
</Info>

Pontos de entrada internos do repositório (por raiz de pacote de plugin incluído):

- `index.js` — entrada do plugin incluído
- `api.js` — barrel de auxiliares/tipos
- `runtime-api.js` — barrel apenas de runtime
- `setup-entry.js` — entrada de plugin de configuração

Plugins externos devem importar apenas subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe `src/*` do pacote de outro plugin a partir do core ou de outro plugin.
Pontos de entrada carregados por fachada preferem o snapshot ativo de configuração de runtime quando ele
existe e, em seguida, recorrem ao arquivo de configuração resolvido no disco.

Subcaminhos específicos de capacidades, como `image-generation`, `media-understanding`
e `speech`, existem porque plugins incluídos os usam hoje. Eles não são
contratos externos automaticamente congelados de longo prazo — verifique a página de
referência relevante do SDK ao depender deles.

## Esquemas de ferramentas de mensagem

Plugins devem ser donos das contribuições de esquema `describeMessageTool(...)` específicas de canal
para primitivos que não sejam mensagens, como reações, leituras e enquetes.
A apresentação compartilhada de envio deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos do provedor para botões, componentes, blocos ou cartões.
Consulte [Apresentação de Mensagem](/pt-BR/plugins/message-presentation) para o contrato,
regras de fallback, mapeamento de provedores e checklist do autor de plugin.

Plugins capazes de enviar declaram o que conseguem renderizar por meio de capacidades de mensagem:

- `presentation` para blocos de apresentação semântica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O core decide se renderiza a apresentação nativamente ou a degrada para texto.
Não exponha escapes de UI nativos do provedor a partir da ferramenta de mensagem genérica.
Auxiliares obsoletos do SDK para esquemas nativos legados continuam exportados para plugins
de terceiros existentes, mas novos plugins não devem usá-los.

## Resolução de alvo de canal

Plugins de canal devem ser donos da semântica de alvo específica de canal. Mantenha o host
de saída compartilhado genérico e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um alvo normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca no diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve ir direto para resolução semelhante a id em vez de busca no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando
  o core precisa de uma resolução final pertencente ao provedor após a normalização ou após
  uma falha no diretório.
- `messaging.resolveOutboundSessionRoute(...)` é responsável pela construção de rota de sessão
  específica do provedor depois que um alvo é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes
  de pesquisar pares/grupos.
- Use `looksLikeId` para verificações de "tratar isto como um id de alvo explícito/nativo".
- Use `resolveTarget` para fallback de normalização específico do provedor, não para
  busca ampla no diretório.
- Mantenha ids nativos do provedor, como ids de chat, ids de thread, JIDs, handles e ids de sala,
  dentro de valores `target` ou parâmetros específicos do provedor, não em campos genéricos
  do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
plugin e reutilizar os auxiliares compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isto quando um canal precisar de pares/grupos baseados em configuração, como:

- pares de DM orientados por lista de permissões
- mapas de canal/grupo configurados
- fallbacks de diretório estático com escopo de conta

Os auxiliares compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consultas
- aplicação de limite
- auxiliares de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

A inspeção de conta específica de canal e a normalização de id devem permanecer na
implementação do plugin.

## Catálogos de provedores

Plugins de provedor podem definir catálogos de modelo para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para múltiplas entradas de provedor

Use `catalog` quando o plugin for dono de ids de modelo específicos do provedor, padrões de URL base
ou metadados de modelo protegidos por autenticação.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos
provedores implícitos integrados do OpenClaw:

- `simple`: provedores simples orientados por chave de API ou env
- `profile`: provedores que aparecem quando existem perfis de autenticação
- `paired`: provedores que sintetizam várias entradas de provedor relacionadas
- `late`: última passagem, após outros provedores implícitos

Provedores posteriores vencem em colisões de chave, então plugins podem substituir intencionalmente uma
entrada de provedor integrada com o mesmo id de provedor.

Plugins também podem publicar linhas de modelo somente leitura por meio de
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Este é o caminho futuro para superfícies de listagem/ajuda/seletor e dá suporte a linhas
`text`, `image_generation`, `video_generation` e `music_generation`.
Plugins de provedor continuam donos de chamadas de endpoint ao vivo, troca de tokens e
mapeamento de resposta do fornecedor; o core é dono do formato comum de linha, rótulos de origem e
formatação de ajuda de ferramentas de mídia. Registros de provedor de geração de mídia sintetizam linhas
de catálogo estático automaticamente a partir de `defaultModel`, `models` e `capabilities`.

Compatibilidade:

- `discovery` ainda funciona como um alias legado, mas emite um aviso de obsolescência
- se `catalog` e `discovery` estiverem registrados, o OpenClaw usa `catalog`
- `augmentModelCatalog` está obsoleto; provedores incluídos devem publicar
  linhas suplementares por meio de `registerModelCatalogProvider`

## Inspeção somente leitura de canal

Se seu plugin registra um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode presumir que credenciais
  estão totalmente materializadas e pode falhar rapidamente quando segredos obrigatórios estão ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de doctor/reparo de configuração
  não devem precisar materializar credenciais de runtime apenas para
  descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
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

Isso permite que comandos somente leitura relatem "configurado, mas indisponível neste caminho de comando"
em vez de travar ou informar incorretamente que a conta não está configurada.

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

Cada entrada vira um plugin. Se o pacote listar várias extensões, o id do plugin
vira `name/<fileBase>`.

Se seu plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Barreira de segurança: cada entrada `openclaw.extensions` deve permanecer dentro do diretório do plugin
após a resolução de symlink. Entradas que escapam do diretório do pacote são
rejeitadas.

Nota de segurança: `openclaw plugins install` instala dependências de plugin com um
`npm install --omit=dev --ignore-scripts` local do projeto (sem scripts de ciclo de vida,
sem dependências de desenvolvimento em runtime), ignorando configurações herdadas de instalação global do npm.
Mantenha árvores de dependências de plugin "pure JS/TS" e evite pacotes que exigem
builds `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve apenas de configuração.
Quando o OpenClaw precisa de superfícies de configuração para um plugin de canal desabilitado, ou
quando um plugin de canal está habilitado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso mantém a inicialização e a configuração mais leves
quando a entrada principal do seu plugin também conecta ferramentas, hooks ou outro código apenas de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode optar um plugin de canal pelo mesmo caminho `setupEntry` durante a fase de inicialização
pré-listen do Gateway, mesmo quando o canal já está configurado.

Use isso somente quando `setupEntry` cobrir totalmente a superfície de inicialização que deve existir
antes que o Gateway comece a escutar. Na prática, isso significa que a entrada de setup
deve registrar toda capacidade pertencente ao canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que devem estar disponíveis antes que o Gateway comece a escutar
- quaisquer métodos, ferramentas ou serviços do Gateway que devem existir durante essa mesma janela

Se sua entrada completa ainda possuir qualquer capacidade de inicialização obrigatória, não habilite
esta flag. Mantenha o plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais integrados também podem publicar auxiliares de superfície de contrato somente de setup que o núcleo
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual de
promoção de setup é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O núcleo usa essa superfície quando precisa promover uma configuração legada de canal de conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
Matrix é o exemplo integrado atual: ele move somente chaves de auth/bootstrap para uma
conta promovida nomeada quando contas nomeadas já existem, e pode preservar uma
chave de conta padrão não canônica configurada em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de setup mantêm preguiçosa a descoberta de superfície de contrato integrada. O tempo
de importação permanece leve; a superfície de promoção é carregada somente no primeiro uso em vez de
entrar novamente na inicialização de canal integrado na importação do módulo.

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

Plugins de canal podem anunciar metadados de setup/descoberta via `openclaw.channel` e
dicas de instalação via `openclaw.install`. Isso mantém o catálogo do núcleo sem dados.

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

- `detailLabel`: rótulo secundário para superfícies de catálogo/status mais ricas
- `docsLabel`: substitui o texto do link para o link da documentação
- `preferOver`: ids de plugin/canal de prioridade menor que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de setup/configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: inclui o canal no fluxo padrão de início rápido `allowFrom`
- `forceAccountBinding`: exige vinculação explícita de conta mesmo quando existe somente uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca de sessão ao resolver destinos de anúncio

O OpenClaw também pode mesclar **catálogos de canais externos** (por exemplo, uma
exportação de registro MPM). Coloque um arquivo JSON em um destes caminhos:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

Entradas geradas do catálogo de canais e entradas do catálogo de instalação de provedores expõem
fatos normalizados de fonte de instalação ao lado do bloco bruto `openclaw.install`. Os
fatos normalizados identificam se a especificação npm é uma versão exata ou um
seletor flutuante, se os metadados de integridade esperados estão presentes e se um caminho de
fonte local também está disponível. Quando a identidade do catálogo/pacote é conhecida, os
fatos normalizados avisam se o nome do pacote npm analisado diverge dessa identidade.
Eles também avisam quando `defaultChoice` é inválido ou aponta para uma fonte que
não está disponível, e quando metadados de integridade npm estão presentes sem uma fonte npm
válida. Consumidores devem tratar `installSource` como um campo opcional aditivo para que
entradas criadas manualmente e shims de catálogo não precisem sintetizá-lo.
Isso permite que onboarding e diagnósticos expliquem o estado do plano de fontes sem
importar o runtime do plugin.

Entradas npm externas oficiais devem preferir um `npmSpec` exato mais
`expectedIntegrity`. Nomes simples de pacotes e dist-tags ainda funcionam por
compatibilidade, mas exibem avisos do plano de fontes para que o catálogo possa avançar
para instalações fixadas e verificadas por integridade sem quebrar plugins existentes.
Quando o onboarding instala a partir de um caminho de catálogo local, ele registra uma entrada de índice de
plugin gerenciado com `source: "path"` e um `sourcePath` relativo ao workspace
quando possível. O caminho absoluto de carregamento operacional permanece em
`plugins.load.paths`; o registro de instalação evita duplicar caminhos locais da estação de trabalho
em configurações de longa duração. Isso mantém instalações de desenvolvimento local visíveis para
diagnósticos do plano de fontes sem adicionar uma segunda superfície bruta de divulgação de caminho do sistema de arquivos.
O índice de plugins persistido `plugins/installs.json` é a fonte da verdade de instalação
e pode ser atualizado sem carregar módulos de runtime de plugin. Seu mapa `installRecords`
é durável mesmo quando o manifesto de um plugin está ausente ou inválido; seu array
`plugins` é uma visualização reconstruível de manifestos.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto controlam a orquestração de contexto de sessão para ingestão, montagem
e Compaction. Registre-os a partir do seu plugin com
`api.registerContextEngine(id, factory)` e selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline padrão de contexto
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

A factory `ctx` expõe valores opcionais `config`, `agentDir` e `workspaceDir`
para inicialização no momento da construção.

Se seu mecanismo **não** controla o algoritmo de Compaction, mantenha `compact()`
implementado e delegue explicitamente:

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

## Adicionar uma nova capacidade

Quando um plugin precisa de comportamento que não se encaixa na API atual, não contorne
o sistema de plugins com um acesso privado interno. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato do núcleo
   Decida qual comportamento compartilhado o núcleo deve controlar: política, fallback, mesclagem de configuração,
   ciclo de vida, semântica voltada ao canal e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície de
   capacidade tipada útil.
3. conecte núcleo + consumidores de canal/recurso
   Canais e plugins de recurso devem consumir a nova capacidade por meio do núcleo,
   não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedores
   Plugins de fornecedores então registram seus backends para a capacidade.
5. adicione cobertura de contrato
   Adicione testes para que a propriedade e o formato de registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar codificado rigidamente para a visão de mundo de um
provedor. Consulte o [Livro de Receitas de Capacidades](/pt-BR/plugins/adding-capabilities)
para uma checklist concreta de arquivos e um exemplo desenvolvido.

### Checklist de capacidades

Quando você adiciona uma nova capacidade, a implementação geralmente deve tocar estas
superfícies em conjunto:

- tipos de contrato do núcleo em `src/<capability>/types.ts`
- helper de runner/runtime do núcleo em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- fiação do registro de plugins em `src/plugins/registry.ts`
- exposição do runtime de plugin em `src/plugins/runtime/*` quando plugins de recurso/canal
  precisam consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação para operadores/plugins em `docs/`

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

- o núcleo controla o contrato da capacidade + orquestração
- plugins de fornecedores controlam implementações de fornecedores
- plugins de recurso/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita

## Relacionados

- [Arquitetura de plugins](/pt-BR/plugins/architecture) — modelo e formatos públicos de capacidades
- [Subcaminhos do Plugin SDK](/pt-BR/plugins/sdk-subpaths)
- [Setup do Plugin SDK](/pt-BR/plugins/sdk-setup)
- [Criar plugins](/pt-BR/plugins/building-plugins)
