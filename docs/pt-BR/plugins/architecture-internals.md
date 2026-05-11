---
read_when:
    - Implementando ganchos de tempo de execução de provedores, ciclo de vida de canais ou conjuntos de pacotes
    - Depuração da ordem de carregamento de Plugins ou do estado do registro
    - Adicionando uma nova capacidade de Plugin ou um Plugin de mecanismo de contexto
summary: 'Componentes internos da arquitetura de Plugin: pipeline de carregamento, registro, ganchos de tempo de execução, rotas HTTP e tabelas de referência'
title: Detalhes internos da arquitetura de Plugin
x-i18n:
    generated_at: "2026-05-11T20:32:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para o modelo público de capacidades, formatos de plugin e contratos de
propriedade/execução, consulte [Arquitetura de plugins](/pt-BR/plugins/architecture).
Esta página é a referência para a mecânica interna: pipeline de carregamento,
registro, hooks de runtime, rotas HTTP do Gateway, caminhos de importação e
tabelas de schema.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de plugin
2. lê manifestos de bundles nativos ou compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega módulos nativos habilitados: módulos embutidos compilados usam um carregador nativo;
   código-fonte TypeScript local de terceiros usa o fallback emergencial do Jiti
7. chama hooks nativos `register(api)` e coleta registros no registro de plugins
8. expõe o registro a comandos/superfícies de runtime

<Note>
`activate` é um alias legado de `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins embutidos usam `register`; prefira `register` para novos plugins.
</Note>

Os gates de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do plugin, o caminho tem permissão de escrita para todos ou a
propriedade do caminho parece suspeita para plugins não embutidos.

Candidatos bloqueados continuam vinculados ao seu id de plugin para diagnósticos. Se a configuração
ainda referencia esse id, a validação relata o plugin como presente, mas bloqueado,
e aponta de volta para o aviso de segurança de caminho, em vez de tratar a entrada de configuração
como obsoleta.

### Comportamento orientado pelo manifesto

O manifesto é a fonte da verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/skills/schema de configuração declarados ou capacidades de bundle
- validar `plugins.entries.<id>.config`
- complementar rótulos/placeholders da UI de Controle
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
o comportamento real, como hooks, ferramentas, comandos ou fluxos de provedor.

Blocos opcionais `activation` e `setup` no manifesto permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de setup;
não substituem registro em runtime, `register(...)` nem `setupEntry`.
Os primeiros consumidores de ativação ao vivo agora usam dicas de comando, canal e provedor do manifesto
para restringir o carregamento de plugins antes de uma materialização mais ampla do registro:

- o carregamento da CLI restringe aos plugins que são donos do comando primário solicitado
- a resolução de setup/plugin de canal restringe aos plugins que são donos do
  id de canal solicitado
- a resolução explícita de setup/runtime de provedor restringe aos plugins que são donos do
  id de provedor solicitado
- o planejamento de inicialização do Gateway usa `activation.onStartup` para importações explícitas
  de inicialização e opt-outs de inicialização; plugins sem metadados de inicialização carregam apenas
  por gatilhos de ativação mais restritos

Preloads de runtime no momento da requisição que pedem o escopo amplo `all` ainda derivam um
conjunto efetivo explícito de ids de plugin a partir da configuração, planejamento de inicialização, canais
configurados, slots e regras de auto-habilitação. Se esse conjunto derivado estiver vazio, o OpenClaw
carrega um registro de runtime vazio em vez de ampliar para todos os plugins descobríveis.

O planejador de ativação expõe tanto uma API somente de ids para chamadores existentes quanto uma
API de plano para novos diagnósticos. Entradas de plano relatam por que um plugin foi selecionado,
separando dicas explícitas do planejador `activation.*` de fallback de propriedade do manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks. Essa separação de motivo é o limite de compatibilidade:
metadados existentes de plugin continuam funcionando, enquanto código novo pode detectar dicas amplas
ou comportamento de fallback sem alterar a semântica de carregamento em runtime.

A descoberta de setup agora prefere ids de propriedade de descritor, como `setup.providers` e
`setup.cliBackends`, para restringir plugins candidatos antes de fazer fallback para
`setup-api` para plugins que ainda precisam de hooks de runtime em tempo de setup. Listas de
setup de provedor usam `providerAuthChoices` do manifesto, escolhas de setup derivadas de descritor
e metadados de catálogo de instalação sem carregar o runtime do provedor. `setup.requiresRuntime: false`
explícito é um corte somente de descritor; `requiresRuntime` omitido mantém o fallback legado de
setup-api por compatibilidade. Se mais de um plugin descoberto reivindicar o mesmo provedor de setup
normalizado ou id de backend da CLI, a busca de setup recusa o proprietário ambíguo em vez de depender
da ordem de descoberta. Quando o runtime de setup é executado, diagnósticos do registro relatam
desvio entre `setup.providers` / `setup.cliBackends` e os provedores ou backends da CLI
registrados por setup-api sem bloquear plugins legados.

### Limite de cache de plugin

O OpenClaw não armazena em cache resultados de descoberta de plugins nem dados diretos de registro de manifesto
por trás de janelas de relógio. Instalações, edições de manifesto e alterações de caminho de carregamento
devem ficar visíveis na próxima leitura explícita de metadados ou reconstrução de snapshot.
O parser de arquivo de manifesto pode manter um cache limitado por assinatura de arquivo, indexado pelo
caminho do manifesto aberto, inode, tamanho e timestamps; esse cache apenas evita
reprocessar bytes inalterados e não deve armazenar em cache respostas de descoberta, registro, proprietário ou
política.

O caminho rápido seguro de metadados é a propriedade explícita de objetos, não um cache oculto.
Caminhos quentes de inicialização do Gateway devem passar o `PluginMetadataSnapshot` atual, a
`PluginLookUpTable` derivada ou um registro explícito de manifesto pela cadeia de chamadas.
Validação de configuração, auto-habilitação na inicialização, bootstrap de plugin e seleção de provedor
podem reutilizar esses objetos enquanto eles representam a configuração e o inventário de plugins atuais.
A busca de setup ainda reconstrói metadados de manifesto sob demanda, a menos que o caminho de setup
específico receba um registro explícito de manifesto; mantenha isso como fallback de caminho frio, em vez de
adicionar caches ocultos de busca. Quando a entrada mudar, reconstrua e substitua o snapshot em vez de
mutá-lo ou manter cópias históricas.
Views sobre o registro de plugins ativo e helpers de bootstrap de canal embutido
devem ser recalculados a partir do registro/raiz atual. Mapas de curta duração são aceitáveis
dentro de uma chamada para deduplicar trabalho ou proteger reentrada; eles não devem se tornar caches de
metadados do processo.

Para carregamento de plugins, a camada de cache persistente é o carregamento em runtime. Ela pode reutilizar
estado do carregador quando código ou artefatos instalados são de fato carregados, como:

- `PluginLoaderCacheState` e registros de runtime ativos compatíveis
- caches de jiti/módulo e caches de carregador de superfície pública usados para evitar importar
  repetidamente a mesma superfície de runtime
- caches de filesystem para artefatos de plugin instalados
- mapas de curta duração por chamada para normalização de caminhos ou resolução de duplicatas

Esses caches são detalhes de implementação do plano de dados. Eles não devem responder
perguntas do plano de controle, como "qual plugin é dono deste provedor?", a menos que o
chamador tenha pedido deliberadamente carregamento em runtime.

Não adicione caches persistentes ou de relógio para:

- resultados de descoberta
- registros diretos de manifesto
- registros de manifesto reconstruídos a partir do índice de plugins instalados
- busca de proprietário de provedor, supressão de modelo, política de provedor ou metadados de artefato
  público
- qualquer outra resposta derivada de manifesto em que uma alteração de manifesto, índice instalado
  ou caminho de carregamento deva ficar visível na próxima leitura de metadados

Chamadores que reconstroem metadados de manifesto a partir do índice persistido de plugins instalados
reconstroem esse registro sob demanda. O índice instalado é estado durável do plano de fonte;
não é um cache oculto de metadados em processo.

## Modelo de registro

Plugins carregados não alteram diretamente globais aleatórios do core. Eles registram em um
registro central de plugins.

O registro acompanha:

- registros de plugin (identidade, origem de código, origem, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- manipuladores RPC do gateway
- rotas HTTP
- registradores da CLI
- serviços em segundo plano
- comandos pertencentes a plugins

Recursos do core então leem a partir desse registro, em vez de falar diretamente com módulos de plugin.
Isso mantém o carregamento em mão única:

- módulo de plugin -> registro no registro
- runtime do core -> consumo do registro

Essa separação importa para a manutenibilidade. Significa que a maioria das superfícies do core precisa de apenas
um ponto de integração: "ler o registro", não "tratar cada módulo de plugin como caso especial".

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

Este callback é apenas uma notificação. Ele não altera quem tem permissão para vincular uma
conversa, e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provedor

Plugins de provedor têm três camadas:

- **Metadados de manifesto** para busca barata antes do runtime:
  `setup.providers[].envVars`, compatibilidade obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hooks em tempo de configuração**: `catalog` (`discovery` legado) mais
  `applyConfigDefaults`.
- **Hooks de runtime**: mais de 40 hooks opcionais cobrindo autenticação, resolução de modelo,
  encapsulamento de stream, níveis de raciocínio, política de replay e endpoints de uso. Consulte
  a lista completa em [Ordem e uso de hooks](#hook-order-and-usage).

O OpenClaw ainda é dono do loop genérico do agente, failover, tratamento de transcript e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de provedor
sem precisar de um transporte de inferência totalmente personalizado.

Use `setup.providers[].envVars` do manifesto quando o provedor tiver credenciais baseadas em env
que caminhos genéricos de autenticação/status/seletor de modelo devam ver sem
carregar o runtime do plugin. O `providerAuthEnvVars` obsoleto ainda é lido pelo
adaptador de compatibilidade durante a janela de descontinuação, e plugins não embutidos
que o usam recebem um diagnóstico de manifesto. Use `providerAuthAliases` do manifesto
quando um id de provedor deve reutilizar as env vars, perfis de autenticação,
autenticação baseada em configuração e escolha de onboarding por chave de API de outro id de provedor. Use
`providerAuthChoices` do manifesto quando superfícies de CLI de onboarding/escolha de autenticação devem conhecer o
id de escolha do provedor, rótulos de grupo e ligação simples de autenticação por uma flag sem
carregar o runtime do provedor. Mantenha `envVars` de runtime do provedor para dicas voltadas
ao operador, como rótulos de onboarding ou vars de setup de client-id/client-secret de OAuth.

Use `channelEnvVars` do manifesto quando um canal tiver autenticação ou setup orientado por env que
fallback genérico de shell-env, verificações de configuração/status ou prompts de setup devam ver
sem carregar o runtime do canal.

### Ordem e uso de hooks

Para plugins de modelo/provedor, o OpenClaw chama hooks nesta ordem aproximada.
A coluna "Quando usar" é o guia rápido de decisão.
Campos de provedor somente de compatibilidade que o OpenClaw não chama mais, como
`ProviderPlugin.capabilities` e `suppressBuiltInModel`, intencionalmente não estão
listados aqui.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                                       |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                    | O provedor possui um catálogo ou padrões de URL base                                                                                              |
| 2   | `applyConfigDefaults`             | Aplica padrões de configuração global pertencentes ao provedor durante a materialização da configuração         | Os padrões dependem do modo de autenticação, ambiente ou semântica de família de modelos do provedor                                               |
| --  | _(consulta de modelo integrada)_  | OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                   | _(não é um hook de Plugin)_                                                                                                                       |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de prévia de ID de modelo antes da consulta                                        | O provedor possui a limpeza de aliases antes da resolução canônica do modelo                                                                      |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo                         | O provedor possui a limpeza de transporte para IDs de provedores personalizados na mesma família de transporte                                    |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de tempo de execução/provedor                              | O provedor precisa de limpeza de configuração que deve ficar com o Plugin; helpers agrupados da família Google também dão suporte a entradas de configuração Google compatíveis |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo aos provedores de configuração                  | O provedor precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                                    |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de ambiente para provedores de configuração antes do carregamento da autenticação em tempo de execução | O provedor tem resolução de chave de API por marcador de ambiente pertencente ao provedor; `amazon-bedrock` também tem aqui um resolvedor integrado de marcador de ambiente da AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/auto-hospedada ou baseada em configuração sem persistir texto simples                  | O provedor pode operar com um marcador de credencial sintética/local                                                                               |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis de autenticação externa pertencentes ao provedor; o padrão de `persistence` é `runtime-only` para credenciais pertencentes à CLI/app | O provedor reutiliza credenciais de autenticação externa sem persistir tokens de atualização copiados; declare `contracts.externalAuthProviders` no manifesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Reduz a precedência de espaços reservados de perfis sintéticos armazenados em favor de autenticação baseada em ambiente/configuração | O provedor armazena perfis sintéticos de espaço reservado que não devem vencer em precedência                                                     |
| 11  | `resolveDynamicModel`             | Fallback síncrono para IDs de modelos pertencentes ao provedor que ainda não estão no registro local            | O provedor aceita IDs arbitrários de modelos upstream                                                                                             |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono; em seguida, `resolveDynamicModel` executa novamente                                    | O provedor precisa de metadados de rede antes de resolver IDs desconhecidos                                                                        |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o executor embutido usar o modelo resolvido                                            | O provedor precisa de reescritas de transporte, mas ainda usa um transporte do core                                                               |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos de fornecedores por trás de outro transporte compatível         | O provedor reconhece seus próprios modelos em transportes de proxy sem assumir o controle do provedor                                             |
| 15  | `normalizeToolSchemas`            | Normaliza esquemas de ferramentas antes de o executor embutido vê-los                                           | O provedor precisa de limpeza de esquema da família de transporte                                                                                  |
| 16  | `inspectToolSchemas`              | Expõe diagnósticos de esquema pertencentes ao provedor após a normalização                                      | O provedor quer avisos de palavras-chave sem ensinar regras específicas de provedor ao core                                                       |
| 17  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo vs marcado                                                     | O provedor precisa de raciocínio/saída final marcados em vez de campos nativos                                                                    |
| 18  | `prepareExtraParams`              | Normalização de parâmetros de solicitação antes de wrappers genéricos de opções de stream                       | O provedor precisa de parâmetros de solicitação padrão ou limpeza de parâmetros por provedor                                                      |
| 19  | `createStreamFn`                  | Substitui completamente o caminho normal de stream por um transporte personalizado                              | O provedor precisa de um protocolo de comunicação personalizado, não apenas um wrapper                                                            |
| 20  | `wrapStreamFn`                    | Wrapper de stream após a aplicação dos wrappers genéricos                                                       | O provedor precisa de wrappers de compatibilidade de cabeçalhos/corpo/modelo da solicitação sem um transporte personalizado                       |
| 21  | `resolveTransportTurnState`       | Anexa cabeçalhos ou metadados de transporte nativos por turno                                                   | O provedor quer que transportes genéricos enviem identidade de turno nativa do provedor                                                           |
| 22  | `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos WebSocket nativos ou política de resfriamento de sessão                                        | O provedor quer que transportes WS genéricos ajustem cabeçalhos de sessão ou política de fallback                                                 |
| 23  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado vira a string `apiKey` em tempo de execução          | O provedor armazena metadados extras de autenticação e precisa de um formato personalizado de token em tempo de execução                          |
| 24  | `refreshOAuth`                    | Substituição de atualização OAuth para endpoints de atualização personalizados ou política de falha de atualização | O provedor não se encaixa nos atualizadores `pi-ai` compartilhados                                                                                |
| 25  | `buildAuthDoctorHint`             | Dica de reparo anexada quando a atualização OAuth falha                                                         | O provedor precisa de orientação de reparo de autenticação pertencente ao provedor após falha de atualização                                      |
| 26  | `matchesContextOverflowError`     | Correspondente de estouro de janela de contexto pertencente ao provedor                                         | O provedor tem erros brutos de estouro que heurísticas genéricas deixariam passar                                                                 |
| 27  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provedor                                                     | O provedor consegue mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                                     |
| 28  | `isCacheTtlEligible`              | Política de cache de prompt para provedores de proxy/backhaul                                                   | O provedor precisa de controle de elegibilidade de TTL de cache específico de proxy                                                               |
| 29  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação de autenticação ausente                                        | O provedor precisa de uma dica de recuperação de autenticação ausente específica do provedor                                                      |
| 30  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                                | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                                    |
| 31  | `resolveThinkingProfile`          | Conjunto de níveis `/think` específico do modelo, rótulos de exibição e padrão                                 | O provedor expõe uma escala de thinking personalizada ou rótulo binário para modelos selecionados                                                 |
| 32  | `isBinaryThinking`                | Hook de compatibilidade de alternância de raciocínio ligado/desligado                                           | O provedor expõe apenas thinking binário ligado/desligado                                                                                         |
| 33  | `supportsXHighThinking`           | Hook de compatibilidade de suporte a raciocínio `xhigh`                                                        | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                                       |
| 34  | `resolveDefaultThinkingLevel`     | Hook de compatibilidade do nível `/think` padrão                                                               | O provedor possui a política padrão de `/think` para uma família de modelos                                                                      |
| 35  | `isModernModelRef`                | Correspondente de modelo moderno para filtros de perfil ao vivo e seleção de smoke                             | O provedor possui a correspondência de modelo preferido para live/smoke                                                                          |
| 36  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de tempo de execução logo antes da inferência            | O provedor precisa de uma troca de token ou credencial de solicitação de curta duração                                                            |
| 37  | `resolveUsageAuth`                | Resolver credenciais de uso/cobrança para `/usage` e superfícies de status relacionadas                                     | O provedor precisa de análise personalizada de token de uso/cota ou de uma credencial de uso diferente                                                               |
| 38  | `fetchUsageSnapshot`              | Buscar e normalizar instantâneos de uso/cota específicos do provedor depois que a autenticação for resolvida                             | O provedor precisa de um endpoint de uso específico do provedor ou de um analisador de carga útil                                                                           |
| 39  | `createEmbeddingProvider`         | Criar um adaptador de embeddings pertencente ao provedor para memória/busca                                                     | O comportamento de embeddings de memória pertence ao Plugin do provedor                                                                                    |
| 40  | `buildReplayPolicy`               | Retornar uma política de repetição que controla o tratamento da transcrição para o provedor                                        | O provedor precisa de uma política de transcrição personalizada (por exemplo, remoção de blocos de raciocínio)                                                               |
| 41  | `sanitizeReplayHistory`           | Reescrever o histórico de repetição após a limpeza genérica da transcrição                                                        | O provedor precisa de reescritas de repetição específicas do provedor além dos auxiliares compartilhados de compaction                                                             |
| 42  | `validateReplayTurns`             | Validação final dos turnos de repetição ou reformatação antes do executor embutido                                           | O transporte do provedor precisa de validação de turnos mais rigorosa após a sanitização genérica                                                                    |
| 43  | `onModelSelected`                 | Executar efeitos colaterais pós-seleção pertencentes ao provedor                                                                 | O provedor precisa de telemetria ou estado pertencente ao provedor quando um modelo se torna ativo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` verificam primeiro o
plugin de provedor correspondente e, em seguida, percorrem outros plugins de
provedor com suporte a hooks até que um deles realmente altere o ID do modelo ou
o transporte/configuração. Isso mantém shims de provedor de alias/compatibilidade
funcionando sem exigir que o chamador saiba qual plugin empacotado é responsável
pela reescrita. Se nenhum hook de provedor reescrever uma entrada de configuração
compatível da família Google, o normalizador de configuração Google empacotado
ainda aplica essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de conexão totalmente personalizado ou de
um executor de solicitação personalizado, isso é uma classe diferente de
extensão. Esses hooks são para comportamento de provedor que ainda é executado no
loop normal de inferência do OpenClaw.

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

Plugins de provedor empacotados combinam os hooks acima para se ajustar ao
catálogo, à autenticação, ao raciocínio, à repetição e às necessidades de uso de
cada fornecedor. O conjunto autoritativo de hooks fica com cada plugin em
`extensions/`; esta página ilustra os formatos, em vez de espelhar a lista.

<AccordionGroup>
  <Accordion title="Provedores de catálogo de passagem">
    OpenRouter, Kilocode, Z.AI, xAI registram `catalog` mais
    `resolveDynamicModel` / `prepareDynamicModel` para poderem expor IDs de
    modelos upstream antes do catálogo estático do OpenClaw.
  </Accordion>
  <Accordion title="Provedores de OAuth e endpoint de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinam
    `prepareRuntimeAuth` ou `formatApiKey` com `resolveUsageAuth` +
    `fetchUsageSnapshot` para controlar a troca de tokens e a integração de
    `/usage`.
  </Accordion>
  <Accordion title="Famílias de repetição e limpeza de transcrição">
    Famílias nomeadas compartilhadas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permitem que provedores
    adotem políticas de transcrição via `buildReplayPolicy`, em vez de cada
    plugin reimplementar a limpeza.
  </Accordion>
  <Accordion title="Provedores somente de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registram apenas `catalog` e usam o loop de inferência
    compartilhado.
  </Accordion>
  <Accordion title="Auxiliares de stream específicos da Anthropic">
    Cabeçalhos beta, `/fast` / `serviceTier` e `context1m` ficam dentro da
    fronteira pública `api.ts` / `contract-api.ts` do plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`), e não no
    SDK genérico.
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
- Usa a configuração principal `messages.tts` e a seleção de provedor.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem reamostrar/codificar para provedores.
- `listVoices` é opcional por provedor. Use-o para seletores de voz ou fluxos de configuração controlados pelo fornecedor.
- Listagens de voz podem incluir metadados mais ricos, como localidade, gênero e tags de personalidade para seletores cientes do provedor.
- OpenAI e ElevenLabs oferecem suporte a telefonia hoje. Microsoft não oferece.

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

- Mantenha a política de TTS, fallback e entrega de respostas no núcleo.
- Use provedores de fala para comportamento de síntese controlado pelo fornecedor.
- A entrada legada `edge` da Microsoft é normalizada para o ID de provedor `microsoft`.
- O modelo de propriedade preferido é orientado por empresa: um plugin de fornecedor
  pode ser responsável por provedores de texto, fala, imagem e mídia futura conforme
  o OpenClaw adiciona esses contratos de capacidade.

Para entendimento de imagem/áudio/vídeo, plugins registram um provedor tipado de
entendimento de mídia em vez de um pacote genérico de chave/valor:

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

- Mantenha orquestração, fallback, configuração e fiação de canais no núcleo.
- Mantenha o comportamento do fornecedor no plugin de provedor.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos
  campos opcionais de resultado, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o núcleo é responsável pelo contrato de capacidade e pelo auxiliar de runtime
  - plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - plugins de recurso/canal consomem `api.runtime.videoGeneration.*`

Para auxiliares de runtime de entendimento de mídia, plugins podem chamar:

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

Para transcrição de áudio, plugins podem usar o runtime de entendimento de mídia
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
  entendimento de imagem/áudio/vídeo.
- `extractStructuredWithModel(...)` é a fronteira voltada a plugins para extração
  limitada, controlada pelo provedor e orientada primeiro por imagem. Inclua pelo
  menos uma entrada de imagem; entradas de texto são contexto suplementar.
  plugins de produto são responsáveis por suas rotas e esquemas, enquanto o
  OpenClaw é responsável pela fronteira de provedor/runtime.
- Usa a configuração principal de áudio de entendimento de mídia (`tools.media.audio`) e a ordem de fallback de provedores.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/sem suporte).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como um alias de compatibilidade.

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

- `provider` e `model` são substituições opcionais por execução, não alterações persistentes da sessão.
- O OpenClaw honra esses campos de substituição apenas para chamadores confiáveis.
- Para execuções de fallback controladas por plugin, operadores devem optar por habilitá-las com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos específicos de `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de plugins não confiáveis ainda funcionam, mas solicitações de substituição são rejeitadas em vez de cair silenciosamente em fallback.
- Sessões de subagente criadas por plugins são marcadas com o ID do plugin criador. O fallback `api.runtime.subagent.deleteSession(...)` pode excluir apenas essas sessões próprias; a exclusão arbitrária de sessão ainda exige uma solicitação do Gateway com escopo de administrador.

Para pesquisa na web, plugins podem consumir o auxiliar de runtime compartilhado
em vez de acessar a fiação de ferramentas do agente:

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

- Mantenha a seleção de provedor, resolução de credenciais e semântica compartilhada de solicitação no núcleo.
- Use provedores de pesquisa na web para transportes de pesquisa específicos de fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para plugins de recurso/canal que precisam de comportamento de pesquisa sem depender do wrapper de ferramenta do agente.

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

- `path`: caminho da rota sob o servidor HTTP do gateway.
- `auth`: obrigatório. Use `"gateway"` para exigir a autenticação normal do gateway, ou `"plugin"` para autenticação/verificação de webhook gerenciada pelo plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorna `true` quando a rota tratou a solicitação.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento do plugin. Use `api.registerHttpRoute(...)` em vez disso.
- As rotas de Plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com níveis de `auth` diferentes são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` somente no mesmo nível de auth.
- Rotas `auth: "plugin"` **não** recebem escopos de runtime do operador automaticamente. Elas são para webhooks/verificação de assinatura gerenciados pelo plugin, não para chamadas privilegiadas de auxiliares do Gateway.
- Rotas `auth: "gateway"` são executadas dentro de um escopo de runtime de solicitação do Gateway, mas esse escopo é intencionalmente conservador:
  - auth bearer de segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém os escopos de runtime de rotas de plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis que carregam identidade (por exemplo, `trusted-proxy` ou `gateway.auth.mode = "none"` em um ingresso privado) respeitam `x-openclaw-scopes` somente quando o cabeçalho está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas solicitações de rota de plugin que carregam identidade, o escopo de runtime volta para `operator.write`
- Regra prática: não presuma que uma rota de plugin com auth de gateway seja uma superfície administrativa implícita. Se sua rota precisar de comportamento exclusivo de administrador, exija um modo de auth que carregue identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.

## Caminhos de importação do SDK de Plugin

Use subcaminhos estreitos do SDK em vez do barrel raiz monolítico `openclaw/plugin-sdk`
ao criar novos plugins. Subcaminhos principais:

| Subcaminho                         | Finalidade                                         |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Primitivas de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core` | Auxiliares de entrada/build de canal               |
| `openclaw/plugin-sdk/core`         | Auxiliares compartilhados genéricos e contrato guarda-chuva |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |

Plugins de canal escolhem entre uma família de seams estreitas — `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve se consolidar
em um único contrato `approvalCapability`, em vez de misturar campos de plugin
não relacionados. Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

Auxiliares de runtime e configuração ficam sob subcaminhos focados `*-runtime`
correspondentes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` etc.). Prefira `config-contracts`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
em vez do amplo barrel de compatibilidade `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` são shims de compatibilidade obsoletos para
plugins mais antigos. Código novo deve importar primitivas genéricas mais estreitas.
</Info>

Pontos de entrada internos do repo (por raiz de pacote de plugin incluído):

- `index.js` — entrada de plugin incluído
- `api.js` — barrel de auxiliares/tipos
- `runtime-api.js` — barrel somente de runtime
- `setup-entry.js` — entrada de plugin de setup

Plugins externos devem importar somente subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe `src/*` de outro pacote de plugin a partir do core ou de outro plugin.
Pontos de entrada carregados por fachada preferem o snapshot ativo de configuração de runtime quando ele
existe e, depois, recorrem ao arquivo de configuração resolvido no disco.

Subcaminhos específicos de capacidade, como `image-generation`, `media-understanding`
e `speech`, existem porque plugins incluídos os usam hoje. Eles não são
contratos externos automaticamente congelados no longo prazo — verifique a página
de referência do SDK relevante ao depender deles.

## Esquemas da ferramenta de mensagem

Plugins devem ser donos das contribuições de esquema `describeMessageTool(...)`
específicas de canal para primitivas que não são mensagens, como reações, leituras e enquetes.
A apresentação compartilhada de envio deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos de provedor para botões, componentes, blocos ou cards.
Consulte [Apresentação de Mensagens](/pt-BR/plugins/message-presentation) para o contrato,
as regras de fallback, o mapeamento de provedores e a checklist para autores de plugin.

Plugins capazes de envio declaram o que podem renderizar por meio de capacidades de mensagem:

- `presentation` para blocos de apresentação semânticos (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O core decide se renderiza a apresentação nativamente ou a degrada para texto.
Não exponha saídas de escape de UI nativas de provedor a partir da ferramenta genérica de mensagem.
Auxiliares obsoletos do SDK para esquemas nativos legados continuam exportados para plugins
de terceiros existentes, mas novos plugins não devem usá-los.

## Resolução de destino de canal

Plugins de canal devem ser donos da semântica de destino específica do canal. Mantenha o host
de saída compartilhado genérico e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da consulta ao diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve ir direto para resolução semelhante a id em vez de busca no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando
  o core precisa de uma resolução final pertencente ao provedor após a normalização ou após uma
  falha no diretório.
- `messaging.resolveOutboundSessionRoute(...)` é dono da construção de rota de sessão
  específica do provedor depois que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes
  de pesquisar pares/grupos.
- Use `looksLikeId` para verificações de "trate isto como um id de destino explícito/nativo".
- Use `resolveTarget` para fallback de normalização específico do provedor, não para
  busca ampla no diretório.
- Mantenha ids nativos de provedor, como ids de chat, ids de thread, JIDs, handles e ids de sala,
  dentro de valores `target` ou parâmetros específicos de provedor, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
plugin e reutilizar os auxiliares compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isto quando um canal precisar de pares/grupos baseados em configuração, como:

- pares de DM orientados por lista de permissões
- mapas de canal/grupo configurados
- fallbacks de diretório estático com escopo de conta

Os auxiliares compartilhados em `directory-runtime` lidam somente com operações genéricas:

- filtragem de consultas
- aplicação de limite
- auxiliares de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

A inspeção de conta específica de canal e a normalização de id devem permanecer na
implementação do plugin.

## Catálogos de provedores

Plugins de provedor podem definir catálogos de modelos para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para várias entradas de provedor

Use `catalog` quando o plugin for dono de ids de modelo específicos do provedor, padrões de URL base
ou metadados de modelo protegidos por auth.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos provedores implícitos
integrados do OpenClaw:

- `simple`: provedores simples orientados por chave de API ou env
- `profile`: provedores que aparecem quando perfis de auth existem
- `paired`: provedores que sintetizam várias entradas de provedor relacionadas
- `late`: última passagem, após outros provedores implícitos

Provedores posteriores vencem em colisão de chave, então plugins podem substituir intencionalmente uma
entrada de provedor integrada com o mesmo id de provedor.

Plugins também podem publicar linhas de modelo somente leitura por meio de
`api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`. Este é o caminho futuro para superfícies de lista/ajuda/seletor e oferece suporte a
linhas `text`, `image_generation`, `video_generation` e `music_generation`.
Plugins de provedor continuam donos de chamadas de endpoint em tempo real, troca de tokens e mapeamento de
respostas de fornecedor; o core é dono do formato comum de linha, dos rótulos de origem e da formatação de
ajuda de ferramentas de mídia. Registros de provedores de geração de mídia sintetizam linhas de catálogo
estático automaticamente a partir de `defaultModel`, `models` e `capabilities`.

Compatibilidade:

- `discovery` ainda funciona como alias legado, mas emite um aviso de obsolescência
- se `catalog` e `discovery` forem registrados, o OpenClaw usa `catalog`
- `augmentModelCatalog` está obsoleto; provedores incluídos devem publicar
  linhas suplementares por meio de `registerModelCatalogProvider`

## Inspeção de canal somente leitura

Se seu plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Motivo:

- `resolveAccount(...)` é o caminho de runtime. Ele pode presumir que as credenciais
  estão totalmente materializadas e falhar rapidamente quando segredos necessários estão ausentes.
- Caminhos de comandos somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de reparo de doctor/config,
  não devem precisar materializar credenciais de runtime apenas para
  descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status de credenciais quando relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para relatar disponibilidade
  somente leitura. Retornar `tokenStatus: "available"` (e o campo de origem correspondente)
  é suficiente para comandos no estilo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura relatem "configurado, mas indisponível neste caminho
de comando" em vez de travar ou informar incorretamente que a conta não está configurada.

## Pacotes de pacotes

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

Cada entrada se torna um plugin. Se o pacote listar várias extensions, o id do plugin
se torna `name/<fileBase>`.

Se seu plugin importar deps do npm, instale-as nesse diretório para que
`node_modules` fique disponível (`npm install` / `pnpm install`).

Medida de segurança: cada entrada `openclaw.extensions` deve permanecer dentro do diretório do plugin
após a resolução de symlink. Entradas que escapam do diretório do pacote são
rejeitadas.

Nota de segurança: `openclaw plugins install` instala dependências de plugin com um
`npm install --omit=dev --ignore-scripts` local ao projeto (sem scripts de ciclo de vida,
sem dependências dev em runtime), ignorando configurações globais herdadas de instalação do npm.
Mantenha árvores de dependências de plugin "JS/TS puro" e evite pacotes que exijam
builds `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve somente de setup.
Quando o OpenClaw precisa de superfícies de setup para um plugin de canal desativado, ou
quando um plugin de canal está habilitado mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso torna a inicialização e o setup mais leves
quando a entrada principal do seu plugin também conecta ferramentas, hooks ou outro código
somente de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode fazer um plugin de canal optar pelo mesmo caminho `setupEntry` durante a fase de inicialização
pré-listen do gateway, mesmo quando o canal já está configurado.

Use isto somente quando `setupEntry` cobrir completamente a superfície de inicialização que deve existir
antes que o gateway comece a escutar. Na prática, isso significa que a entrada de configuração
deve registrar toda capability pertencente ao canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que devem estar disponíveis antes que o gateway comece a escutar
- quaisquer métodos, ferramentas ou serviços do gateway que devem existir durante essa mesma janela

Se a sua entrada completa ainda possui alguma capability de inicialização obrigatória, não habilite
esta flag. Mantenha o plugin no comportamento padrão e deixe que o OpenClaw carregue a
entrada completa durante a inicialização.

Canais empacotados também podem publicar helpers de superfície de contrato somente de configuração que o core
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual de
promoção de configuração é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O core usa essa superfície quando precisa promover uma configuração legada de canal com conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
Matrix é o exemplo empacotado atual: ele move somente chaves de auth/bootstrap para uma
conta promovida nomeada quando contas nomeadas já existem, e pode preservar uma
chave de conta padrão não canônica configurada em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de configuração mantêm lazy a descoberta de superfície de contrato empacotada. O tempo de
importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso em vez de
reentrar na inicialização do canal empacotado na importação do módulo.

Quando essas superfícies de inicialização incluírem métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces administrativos do core (`config.*`,
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
dicas de instalação via `openclaw.install`. Isso mantém o catálogo do core sem dados.

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
- `preferOver`: ids de plugin/canal de prioridade mais baixa que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como capaz de markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal de seletores interativos de configuração/ajuste quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos para compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: inclui o canal no fluxo padrão de quickstart `allowFrom`
- `forceAccountBinding`: exige vinculação explícita de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca de sessão ao resolver destinos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canais** (por exemplo, uma exportação de
registro MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

Entradas geradas do catálogo de canais e entradas do catálogo de instalação de provedores expõem
fatos normalizados da fonte de instalação ao lado do bloco bruto `openclaw.install`. Os
fatos normalizados identificam se a especificação npm é uma versão exata ou um seletor
flutuante, se metadados de integridade esperados estão presentes e se um caminho de
fonte local também está disponível. Quando a identidade do catálogo/pacote é conhecida, os
fatos normalizados alertam se o nome do pacote npm analisado diverge dessa identidade.
Eles também alertam quando `defaultChoice` é inválido ou aponta para uma fonte que
não está disponível, e quando metadados de integridade npm estão presentes sem uma fonte npm
válida. Consumidores devem tratar `installSource` como um campo opcional aditivo para que
entradas criadas manualmente e shims de catálogo não precisem sintetizá-lo.
Isso permite que onboarding e diagnósticos expliquem o estado do plano de fonte sem
importar o runtime do plugin.

Entradas npm externas oficiais devem preferir um `npmSpec` exato mais
`expectedIntegrity`. Nomes de pacotes simples e dist-tags ainda funcionam para
compatibilidade, mas exibem avisos de plano de fonte para que o catálogo possa avançar
para instalações fixadas e verificadas por integridade sem quebrar plugins existentes.
Quando o onboarding instala a partir de um caminho de catálogo local, ele registra uma entrada
de índice de plugin gerenciado com `source: "path"` e um `sourcePath` relativo ao workspace
quando possível. O caminho de carregamento operacional absoluto permanece em
`plugins.load.paths`; o registro de instalação evita duplicar caminhos da estação de trabalho local
na configuração de longa duração. Isso mantém instalações de desenvolvimento local visíveis para
diagnósticos de plano de fonte sem adicionar uma segunda superfície bruta de divulgação de caminho do sistema de arquivos.
O índice de plugins persistido em `plugins/installs.json` é a fonte da verdade de instalação
e pode ser atualizado sem carregar módulos de runtime de plugin.
Seu mapa `installRecords` é durável mesmo quando um manifesto de plugin está ausente ou
inválido; seu array `plugins` é uma visualização de manifesto reconstruível.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto são responsáveis pela orquestração do contexto de sessão para ingestão, montagem
e compaction. Registre-os a partir do seu plugin com
`api.registerContextEngine(id, factory)`, depois selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isto quando seu plugin precisar substituir ou estender o pipeline de contexto padrão
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
para inicialização em tempo de construção.

Se o seu mecanismo **não** for responsável pelo algoritmo de compaction, mantenha `compact()`
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

## Adicionando uma nova capability

Quando um plugin precisar de comportamento que não se encaixa na API atual, não contorne
o sistema de plugins com um acesso privado interno. Adicione a capability ausente.

Sequência recomendada:

1. defina o contrato do core
   Decida qual comportamento compartilhado o core deve possuir: política, fallback, mesclagem de configuração,
   ciclo de vida, semântica voltada a canais e formato de helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada
   de capability útil.
3. conecte o core + consumidores de canal/funcionalidade
   Canais e plugins de funcionalidade devem consumir a nova capability por meio do core,
   não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends contra a capability.
5. adicione cobertura de contrato
   Adicione testes para que a propriedade e o formato de registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar hardcoded para a visão de mundo de um
provedor. Consulte o [Cookbook de Capabilities](/pt-BR/plugins/adding-capabilities)
para uma checklist concreta de arquivos e um exemplo trabalhado.

### Checklist de capability

Quando você adiciona uma nova capability, a implementação geralmente deve tocar estas
superfícies em conjunto:

- tipos de contrato do core em `src/<capability>/types.ts`
- runner/helper de runtime do core em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- wiring do registro de plugins em `src/plugins/registry.ts`
- exposição de runtime do plugin em `src/plugins/runtime/*` quando plugins de funcionalidade/canal
  precisam consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação de operador/plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso geralmente é um sinal de que a capability
ainda não está totalmente integrada.

### Template de capability

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

- o core possui o contrato da capability + orquestração
- plugins de fornecedor possuem implementações de fornecedor
- plugins de funcionalidade/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita

## Relacionados

- [Arquitetura de plugins](/pt-BR/plugins/architecture) — modelo público de capabilities e formatos
- [Subpaths do SDK de plugin](/pt-BR/plugins/sdk-subpaths)
- [Configuração do SDK de plugin](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
