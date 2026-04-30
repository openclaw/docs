---
read_when:
    - Implementando ganchos de tempo de execução de provedores, ciclo de vida de canais ou conjuntos de pacotes
    - Depuração da ordem de carregamento de Plugin ou do estado do registro
    - Como adicionar uma nova capacidade de Plugin ou um novo Plugin de mecanismo de contexto
summary: 'Detalhes internos da arquitetura de Plugin: pipeline de carregamento, registro, ganchos de tempo de execução, rotas HTTP e tabelas de referência'
title: Detalhes internos da arquitetura de Plugin
x-i18n:
    generated_at: "2026-04-30T09:58:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51020f00fd501c006a8e8e92f4daaeb65a9e211771f8f350d869017332b5da3b
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para o modelo público de capacidades, formatos de plugin e contratos de propriedade/execução, consulte [Arquitetura de Plugin](/pt-BR/plugins/architecture). Esta página é a referência para a mecânica interna: pipeline de carregamento, registro, hooks de runtime, rotas HTTP do Gateway, caminhos de importação e tabelas de esquema.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes de plugins candidatas
2. lê manifestos de bundles nativos ou compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega módulos nativos habilitados: módulos empacotados compilados usam um loader nativo;
   plugins nativos não compilados usam jiti
7. chama hooks nativos `register(api)` e coleta registros no registro de plugins
8. expõe o registro para comandos/superfícies de runtime

<Note>
`activate` é um alias legado de `register` — o loader resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins empacotados usam `register`; prefira `register` para novos plugins.
</Note>

Os gates de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do plugin, o caminho é gravável por todos, ou a
propriedade do caminho parece suspeita para plugins não empacotados.

### Comportamento manifest-first

O manifesto é a fonte de verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/Skills/esquema de configuração declarados ou capacidades do bundle
- validar `plugins.entries.<id>.config`
- complementar rótulos/placeholders da Control UI
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
comportamentos reais, como hooks, ferramentas, comandos ou fluxos de provider.

Blocos opcionais `activation` e `setup` do manifesto permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de configuração;
eles não substituem o registro de runtime, `register(...)`, nem `setupEntry`.
Os primeiros consumidores de ativação ao vivo agora usam dicas de comando, canal e provider do manifesto
para restringir o carregamento de plugins antes de uma materialização mais ampla do registro:

- o carregamento da CLI restringe aos plugins que possuem o comando primário solicitado
- a resolução de configuração/plugin de canal restringe aos plugins que possuem o
  id de canal solicitado
- a resolução explícita de setup/runtime de provider restringe aos plugins que possuem o
  id de provider solicitado
- o planejamento de inicialização do Gateway usa `activation.onStartup` para importações explícitas
  de inicialização e opt-outs de inicialização; todo plugin deve declará-lo à medida que o OpenClaw
  se afasta de importações implícitas na inicialização, enquanto plugins sem metadados estáticos
  de capacidade e sem `activation.onStartup` ainda usam o fallback lateral implícito de inicialização
  obsoleto para compatibilidade

O planejador de ativação expõe tanto uma API somente de ids para chamadores existentes quanto uma
API de plano para novos diagnósticos. Entradas de plano informam por que um plugin foi selecionado,
separando dicas explícitas do planejador em `activation.*` de fallbacks de propriedade do manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks. Essa divisão de motivos é o limite de compatibilidade:
metadados existentes de plugin continuam funcionando, enquanto código novo pode detectar dicas amplas
ou comportamento de fallback sem alterar a semântica de carregamento de runtime.

A descoberta de setup agora prefere ids pertencentes a descritores, como `setup.providers` e
`setup.cliBackends`, para restringir plugins candidatos antes de recorrer a
`setup-api` para plugins que ainda precisam de hooks de runtime em tempo de setup. Listas de
setup de provider usam `providerAuthChoices` do manifesto, escolhas de setup derivadas de descritores
e metadados de catálogo de instalação sem carregar o runtime do provider. `setup.requiresRuntime: false`
explícito é um corte somente de descritor; `requiresRuntime` omitido mantém o fallback legado
de setup-api para compatibilidade. Se mais de um plugin descoberto reivindicar o mesmo provider de
setup normalizado ou id de backend de CLI, a busca de setup recusa o proprietário ambíguo em vez de
depender da ordem de descoberta. Quando o runtime de setup executa, os diagnósticos de registro relatam
desvios entre `setup.providers` / `setup.cliBackends` e os providers ou backends de CLI
registrados por setup-api sem bloquear plugins legados.

### Limite de cache de plugins

O OpenClaw não armazena em cache resultados de descoberta de plugins nem dados diretos de registro
de manifesto por trás de janelas de tempo de relógio. Instalações, edições de manifesto e alterações
de caminho de carregamento devem ficar visíveis na próxima leitura explícita de metadados ou reconstrução
de snapshot. O parser de arquivo de manifesto pode manter um cache limitado de assinatura de arquivo
indexado pelo caminho do manifesto aberto, inode, tamanho e timestamps; esse cache apenas evita
reanalisar bytes inalterados e não deve armazenar em cache respostas de descoberta, registro, proprietário
ou política.

O caminho rápido seguro de metadados é a propriedade explícita de objetos, não um cache oculto.
Caminhos quentes de inicialização do Gateway devem passar o `PluginMetadataSnapshot` atual, a
`PluginLookUpTable` derivada ou um registro de manifesto explícito pela cadeia de chamadas.
Validação de configuração, auto-habilitação na inicialização, bootstrap de plugin e seleção de provider
podem reutilizar esses objetos enquanto eles representam a configuração e o inventário de plugins atuais.
A busca de setup ainda reconstrói metadados de manifesto sob demanda, a menos que o caminho específico
de setup receba um registro de manifesto explícito; mantenha isso como fallback de caminho frio, em vez
de adicionar caches ocultos de busca. Quando a entrada mudar, reconstrua e substitua o snapshot em vez
de mutá-lo ou manter cópias históricas.
Views sobre o registro ativo de plugins e helpers de bootstrap de canais empacotados devem ser
recomputadas a partir do registro/raiz atual. Mapas de curta duração são aceitáveis dentro de uma
chamada para deduplicar trabalho ou proteger reentrada; eles não devem se tornar caches de metadados
do processo.

Para carregamento de plugins, a camada persistente de cache é o carregamento de runtime. Ela pode
reutilizar estado de loader quando código ou artefatos instalados são efetivamente carregados, como:

- `PluginLoaderCacheState` e registros de runtime ativos compatíveis
- caches de jiti/módulos e caches de loader de superfície pública usados para evitar importar
  a mesma superfície de runtime repetidamente
- espelhos de dependências de runtime e caches de sistema de arquivos para artefatos de plugins
  instalados
- mapas de curta duração por chamada para normalização de caminhos ou resolução de duplicatas

Esses caches são detalhes de implementação do plano de dados. Eles não devem responder
perguntas do plano de controle, como "qual plugin possui este provider?", a menos que o
chamador tenha solicitado deliberadamente o carregamento de runtime.

Não adicione caches persistentes ou baseados em relógio para:

- resultados de descoberta
- registros diretos de manifesto
- registros de manifesto reconstruídos a partir do índice de plugins instalados
- busca de proprietário de provider, supressão de modelo, política de provider ou metadados
  de artefato público
- qualquer outra resposta derivada de manifesto em que um manifesto alterado, índice instalado
  ou caminho de carregamento deva ficar visível na próxima leitura de metadados

Chamadores que recriam metadados de manifesto a partir do índice persistido de plugins instalados reconstroem esse registro sob demanda. O índice instalado é um estado durável do plano de origem; ele não é um cache oculto de metadados em processo.

## Modelo de registro

Plugins carregados não alteram diretamente variáveis globais aleatórias do core. Eles se registram em um registro central de plugins.

O registro acompanha:

- registros de plugins (identidade, fonte, origem, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- manipuladores RPC do Gateway
- rotas HTTP
- registradores da CLI
- serviços em segundo plano
- comandos pertencentes a plugins

Os recursos do core então leem desse registro em vez de falar diretamente com módulos de plugins. Isso mantém o carregamento em uma única direção:

- módulo do plugin -> registro no registro
- runtime do core -> consumo do registro

Essa separação é importante para a manutenção. Ela significa que a maioria das superfícies do core precisa de apenas um ponto de integração: "ler o registro", não "tratar cada módulo de plugin como caso especial".

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

Campos da carga útil do callback:

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: a vinculação resolvida para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de desanexação, ID do remetente e metadados da conversa

Esse callback é apenas uma notificação. Ele não altera quem tem permissão para vincular uma conversa, e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provedor

Plugins de provedor têm três camadas:

- **Metadados de manifesto** para consulta barata antes do runtime:
  `setup.providers[].envVars`, compatibilidade obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hooks em tempo de configuração**: `catalog` (`discovery` legado) mais
  `applyConfigDefaults`.
- **Hooks de runtime**: mais de 40 hooks opcionais que cobrem autenticação, resolução de modelo,
  encapsulamento de stream, níveis de pensamento, política de repetição e endpoints de uso. Veja
  a lista completa em [Ordem e uso dos hooks](#hook-order-and-usage).

O OpenClaw ainda é responsável pelo loop genérico do agente, failover, tratamento de transcritos e
política de ferramentas. Esses hooks são a superfície de extensão para comportamentos específicos
de provedor sem exigir um transporte de inferência totalmente personalizado.

Use `setup.providers[].envVars` do manifesto quando o provedor tiver credenciais baseadas em variáveis de ambiente que caminhos genéricos de autenticação/status/seletor de modelos devam enxergar sem carregar o runtime do plugin. O `providerAuthEnvVars` obsoleto ainda é lido pelo adaptador de compatibilidade durante a janela de descontinuação, e plugins não empacotados que o usam recebem um diagnóstico de manifesto. Use `providerAuthAliases` do manifesto quando um ID de provedor deve reutilizar as variáveis de ambiente, perfis de autenticação, autenticação baseada em configuração e escolha de integração de chave de API de outro ID de provedor. Use `providerAuthChoices` do manifesto quando as superfícies de CLI de onboarding/escolha de autenticação devem conhecer o ID de escolha do provedor, rótulos de grupo e fiação simples de autenticação por uma única flag sem carregar o runtime do provedor. Mantenha `envVars` do runtime do provedor para dicas voltadas a operadores, como rótulos de onboarding ou variáveis de configuração de ID do cliente/segredo do cliente OAuth.

Use `channelEnvVars` do manifesto quando um canal tiver autenticação ou configuração orientada por variáveis de ambiente que fallback genérico de ambiente de shell, verificações de configuração/status ou prompts de configuração devam enxergar sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para plugins de modelo/provedor, o OpenClaw chama hooks nesta ordem aproximada.
A coluna "Quando usar" é o guia rápido de decisão.
Campos de provedor apenas de compatibilidade que o OpenClaw não chama mais, como
`ProviderPlugin.capabilities` e `suppressBuiltInModel`, não são listados aqui de propósito.

| #   | Gancho                            | O que ele faz                                                                                                           | Quando usar                                                                                                                                                          |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                             | O provedor possui um catálogo ou padrões de URL base                                                                                                                 |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração pertencentes ao provedor durante a materialização da configuração                 | Os padrões dependem do modo de autenticação, do env ou da semântica de família de modelos do provedor                                                                |
| --  | _(busca de modelo integrada)_     | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                         | _(não é um gancho de plugin)_                                                                                                                                        |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de prévia de ids de modelo antes da busca                                                  | O provedor é responsável pela limpeza de aliases antes da resolução canônica do modelo                                                                               |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo                                 | O provedor é responsável pela limpeza de transporte para ids de provedor personalizados na mesma família de transporte                                               |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                                | O provedor precisa de limpeza de configuração que deve ficar com o plugin; auxiliares agrupados da família Google também servem de apoio para entradas Google aceitas |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo aos provedores de configuração                          | O provedor precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                                                      |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de env para provedores de configuração antes do carregamento da autenticação de runtime | O provedor tem resolução de chave de API por marcador de env pertencente ao provedor; `amazon-bedrock` também tem aqui um resolvedor integrado de marcador de env AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/auto-hospedada ou baseada em configuração sem persistir texto puro                             | O provedor pode operar com um marcador de credencial sintética/local                                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis de autenticação externa pertencentes ao provedor; o `persistence` padrão é `runtime-only` para credenciais pertencentes à CLI/app | O provedor reutiliza credenciais de autenticação externa sem persistir tokens de atualização copiados; declare `contracts.externalAuthProviders` no manifesto        |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders de perfis sintéticos armazenados para trás de autenticação baseada em env/configuração             | O provedor armazena perfis de placeholder sintéticos que não devem ter precedência                                                                                   |
| 11  | `resolveDynamicModel`             | Fallback síncrono para ids de modelo pertencentes ao provedor que ainda não estão no registro local                     | O provedor aceita ids arbitrários de modelos upstream                                                                                                               |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono; depois `resolveDynamicModel` executa novamente                                                 | O provedor precisa de metadados de rede antes de resolver ids desconhecidos                                                                                         |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o executor embutido usar o modelo resolvido                                                   | O provedor precisa de reescritas de transporte, mas ainda usa um transporte do core                                                                                  |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos de fornecedores por trás de outro transporte compatível                 | O provedor reconhece seus próprios modelos em transportes proxy sem assumir o controle do provedor                                                                   |
| 15  | `normalizeToolSchemas`            | Normaliza esquemas de ferramentas antes de o executor embutido vê-los                                                  | O provedor precisa de limpeza de esquema da família de transporte                                                                                                   |
| 16  | `inspectToolSchemas`              | Expõe diagnósticos de esquema pertencentes ao provedor após a normalização                                              | O provedor quer avisos de palavras-chave sem ensinar regras específicas de provedor ao core                                                                          |
| 17  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo vs marcado                                                            | O provedor precisa de raciocínio/saída final marcada em vez de campos nativos                                                                                       |
| 18  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes dos wrappers genéricos de opções de stream                              | O provedor precisa de parâmetros padrão de requisição ou limpeza de parâmetros por provedor                                                                          |
| 19  | `createStreamFn`                  | Substitui totalmente o caminho normal de stream por um transporte personalizado                                        | O provedor precisa de um protocolo de fio personalizado, não apenas de um wrapper                                                                                    |
| 20  | `wrapStreamFn`                    | Wrapper de stream depois que os wrappers genéricos são aplicados                                                       | O provedor precisa de wrappers de cabeçalhos/corpo/modelo da requisição para compatibilidade sem um transporte personalizado                                        |
| 21  | `resolveTransportTurnState`       | Anexa cabeçalhos ou metadados nativos de transporte por turno                                                          | O provedor quer que transportes genéricos enviem identidade de turno nativa do provedor                                                                              |
| 22  | `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos nativos de WebSocket ou política de resfriamento de sessão                                            | O provedor quer que transportes WS genéricos ajustem cabeçalhos de sessão ou política de fallback                                                                    |
| 23  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado vira a string `apiKey` de runtime                           | O provedor armazena metadados extras de autenticação e precisa de um formato personalizado de token de runtime                                                       |
| 24  | `refreshOAuth`                    | Sobrescrita de atualização OAuth para endpoints de atualização personalizados ou política de falha na atualização       | O provedor não se encaixa nos atualizadores `pi-ai` compartilhados                                                                                                  |
| 25  | `buildAuthDoctorHint`             | Dica de reparo anexada quando a atualização OAuth falha                                                                | O provedor precisa de orientação de reparo de autenticação pertencente ao provedor após falha de atualização                                                         |
| 26  | `matchesContextOverflowError`     | Correspondente de estouro de janela de contexto pertencente ao provedor                                                | O provedor tem erros brutos de estouro que heurísticas genéricas deixariam passar                                                                                   |
| 27  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provedor                                                            | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc                                                                            |
| 28  | `isCacheTtlEligible`              | Política de cache de prompt para provedores proxy/backhaul                                                             | O provedor precisa de controle de TTL de cache específico de proxy                                                                                                  |
| 29  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação de autenticação ausente                                               | O provedor precisa de uma dica de recuperação de autenticação ausente específica do provedor                                                                         |
| 30  | `augmentModelCatalog`             | Linhas de catálogo sintéticas/finais anexadas após a descoberta                                                       | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                                                       |
| 31  | `resolveThinkingProfile`          | Conjunto de níveis `/think` específicos do modelo, rótulos de exibição e padrão                                       | O provedor expõe uma escala personalizada de thinking ou rótulo binário para modelos selecionados                                                                   |
| 32  | `isBinaryThinking`                | Gancho de compatibilidade para alternância de raciocínio ligado/desligado                                              | O provedor expõe apenas thinking binário ligado/desligado                                                                                                          |
| 33  | `supportsXHighThinking`           | Gancho de compatibilidade para suporte a raciocínio `xhigh`                                                           | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                                                        |
| 34  | `resolveDefaultThinkingLevel`     | Gancho de compatibilidade para nível `/think` padrão                                                                   | O provedor possui a política padrão de `/think` para uma família de modelos                                                                                         |
| 35  | `isModernModelRef`                | Correspondente de modelo moderno para filtros de perfil ao vivo e seleção de smoke                                    | O provedor possui a correspondência de modelos preferidos para ao vivo/smoke                                                                                        |
| 36  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime logo antes da inferência                            | O provedor precisa de uma troca de token ou credencial de requisição de curta duração                                                                                |
| 37  | `resolveUsageAuth`                | Resolver credenciais de uso/cobrança para `/usage` e superfícies de status relacionadas                                     | O provedor precisa de análise personalizada de tokens de uso/cota ou de uma credencial de uso diferente                                                               |
| 38  | `fetchUsageSnapshot`              | Buscar e normalizar instantâneos de uso/cota específicos do provedor depois que a autenticação for resolvida                             | O provedor precisa de um endpoint de uso específico do provedor ou de um analisador de payload                                                                           |
| 39  | `createEmbeddingProvider`         | Criar um adaptador de embeddings pertencente ao provedor para memória/busca                                                     | O comportamento de embeddings de memória pertence ao Plugin do provedor                                                                                    |
| 40  | `buildReplayPolicy`               | Retornar uma política de repetição que controla o tratamento de transcrições para o provedor                                        | O provedor precisa de uma política de transcrição personalizada (por exemplo, remoção de blocos de pensamento)                                                               |
| 41  | `sanitizeReplayHistory`           | Reescrever o histórico de repetição depois da limpeza genérica de transcrições                                                        | O provedor precisa de reescritas de repetição específicas do provedor além dos auxiliares compartilhados de compaction                                                             |
| 42  | `validateReplayTurns`             | Validação final de turnos de repetição ou reformatação antes do executor incorporado                                           | O transporte do provedor precisa de validação de turnos mais rigorosa depois da sanitização genérica                                                                    |
| 43  | `onModelSelected`                 | Executar efeitos colaterais pós-seleção pertencentes ao provedor                                                                 | O provedor precisa de telemetria ou estado pertencente ao provedor quando um modelo se torna ativo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
plugin provedor correspondente e, em seguida, passam por outros plugins provedores
com hooks até que um deles realmente altere o ID do modelo ou o transporte/configuração. Isso mantém
os shims de provedores de alias/compatibilidade funcionando sem exigir que o chamador saiba qual
plugin incluído é responsável pela reescrita. Se nenhum hook de provedor reescrever uma entrada de
configuração compatível da família Google, o normalizador de configuração Google incluído ainda aplicará
essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de rede totalmente personalizado ou de um executor de requisições personalizado,
isso é uma classe diferente de extensão. Esses hooks são para comportamento de provedor
que ainda roda no loop de inferência normal do OpenClaw.

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

Plugins provedores incluídos combinam os hooks acima para se adequar ao catálogo,
à autenticação, ao raciocínio, ao replay e às necessidades de uso de cada fornecedor. O conjunto autoritativo de hooks fica com
cada plugin em `extensions/`; esta página ilustra os formatos, em vez de
espelhar a lista.

<AccordionGroup>
  <Accordion title="Pass-through catalog providers">
    OpenRouter, Kilocode, Z.AI, xAI registram `catalog` mais
    `resolveDynamicModel` / `prepareDynamicModel` para poderem expor IDs de modelos
    upstream antes do catálogo estático do OpenClaw.
  </Accordion>
  <Accordion title="OAuth and usage endpoint providers">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinam
    `prepareRuntimeAuth` ou `formatApiKey` com `resolveUsageAuth` +
    `fetchUsageSnapshot` para assumir a troca de tokens e a integração com `/usage`.
  </Accordion>
  <Accordion title="Replay and transcript cleanup families">
    Famílias nomeadas compartilhadas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permitem que provedores adotem
    políticas de transcript via `buildReplayPolicy` em vez de cada plugin
    reimplementar a limpeza.
  </Accordion>
  <Accordion title="Catalog-only providers">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registram apenas `catalog` e usam o loop de inferência compartilhado.
  </Accordion>
  <Accordion title="Anthropic-specific stream helpers">
    Cabeçalhos beta, `/fast` / `serviceTier` e `context1m` ficam dentro do
    seam público `api.ts` / `contract-api.ts` do plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) em vez de ficarem no
    SDK genérico.
  </Accordion>
</AccordionGroup>

## Helpers de runtime

Plugins podem acessar helpers centrais selecionados via `api.runtime`. Para TTS:

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

- `textToSpeech` retorna a carga útil normal de saída de TTS do core para superfícies de arquivo/nota de voz.
- Usa a configuração central `messages.tts` e a seleção de provedor.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem reamostrar/codificar para provedores.
- `listVoices` é opcional por provedor. Use-o para seletores de voz ou fluxos de configuração pertencentes ao fornecedor.
- Listagens de voz podem incluir metadados mais ricos, como localidade, gênero e tags de personalidade para seletores cientes do provedor.
- OpenAI e ElevenLabs têm suporte a telefonia hoje. Microsoft não.

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

- Mantenha a política de TTS, fallback e entrega de respostas no core.
- Use provedores de fala para comportamento de síntese pertencente ao fornecedor.
- A entrada legada Microsoft `edge` é normalizada para o ID de provedor `microsoft`.
- O modelo de propriedade preferido é orientado à empresa: um plugin de fornecedor pode ser responsável por
  provedores de texto, fala, imagem e mídia futura conforme o OpenClaw adiciona esses
  contratos de capacidade.

Para entendimento de imagem/áudio/vídeo, plugins registram um
provedor tipado de entendimento de mídia em vez de uma bolsa genérica de chave/valor:

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

- Mantenha orquestração, fallback, configuração e cabeamento de canal no core.
- Mantenha o comportamento do fornecedor no plugin provedor.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos
  campos de resultado opcionais, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core é responsável pelo contrato de capacidade e pelo helper de runtime
  - plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - plugins de recurso/canal consomem `api.runtime.videoGeneration.*`

Para helpers de runtime de entendimento de mídia, plugins podem chamar:

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
- Usa a configuração central de áudio de entendimento de mídia (`tools.media.audio`) e a ordem de fallback de provedores.
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
- OpenClaw só respeita esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback pertencentes a plugins, operadores devem optar por habilitar com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos `provider/model` específicos, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de plugins não confiáveis ainda funcionam, mas solicitações de substituição são rejeitadas em vez de cair silenciosamente no fallback.
- Sessões de subagente criadas por plugins são marcadas com o ID do plugin criador. O fallback `api.runtime.subagent.deleteSession(...)` pode excluir apenas essas sessões pertencentes a ele; a exclusão arbitrária de sessões ainda exige uma requisição de Gateway com escopo de administrador.

Para pesquisa na web, plugins podem consumir o helper de runtime compartilhado em vez de
acessar diretamente o cabeamento da ferramenta do agente:

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

- Mantenha seleção de provedor, resolução de credenciais e semântica compartilhada de requisições no core.
- Use provedores de pesquisa na web para transportes de pesquisa específicos do fornecedor.
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

- `generate(...)`: gera uma imagem usando a cadeia de provedores de geração de imagem configurada.
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

- `path`: caminho da rota sob o servidor HTTP do gateway.
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway, ou `"plugin"` para autenticação/verificação de webhook gerenciada por plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a requisição.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento de plugin. Use `api.registerHttpRoute(...)` em vez disso.
- Rotas de Plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com níveis de `auth` diferentes são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` somente no mesmo nível de auth.
- Rotas `auth: "plugin"` **não** recebem escopos de runtime do operador automaticamente. Elas são para webhooks/verificação de assinatura gerenciados pelo plugin, não para chamadas privilegiadas de auxiliares do Gateway.
- Rotas `auth: "gateway"` são executadas dentro de um escopo de runtime de solicitação do Gateway, mas esse escopo é intencionalmente conservador:
  - auth bearer de segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém escopos de runtime de rotas de plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis que carregam identidade (por exemplo, `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) respeitam `x-openclaw-scopes` somente quando o cabeçalho está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas solicitações de rotas de plugin que carregam identidade, o escopo de runtime volta para `operator.write`
- Regra prática: não presuma que uma rota de plugin com auth de gateway seja uma superfície administrativa implícita. Se sua rota precisar de comportamento somente de administrador, exija um modo de auth que carregue identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.

## Caminhos de importação do Plugin SDK

Use subcaminhos estreitos do SDK em vez do barrel raiz monolítico `openclaw/plugin-sdk`
ao criar novos plugins. Subcaminhos principais:

| Subcaminho                         | Finalidade                                         |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry` | Primitivos de registro de Plugin                  |
| `openclaw/plugin-sdk/channel-core` | Auxiliares de entrada/build de canal              |
| `openclaw/plugin-sdk/core`         | Auxiliares compartilhados genéricos e contrato guarda-chuva |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |

Plugins de canal escolhem entre uma família de seams estreitos — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve se consolidar
em um único contrato `approvalCapability`, em vez de misturar campos de
plugin não relacionados. Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

Auxiliares de runtime e configuração ficam em subcaminhos `*-runtime` focados
correspondentes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefira `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
em vez do barrel amplo de compatibilidade `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` são shims de compatibilidade obsoletos para
plugins mais antigos. Código novo deve importar primitivos genéricos mais estreitos em vez disso.
</Info>

Pontos de entrada internos do repositório (por raiz de pacote de plugin incluído):

- `index.js` — entrada de plugin incluído
- `api.js` — barrel de auxiliares/tipos
- `runtime-api.js` — barrel somente de runtime
- `setup-entry.js` — entrada de plugin de configuração

Plugins externos devem importar apenas subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe `src/*` do pacote de outro plugin a partir do core ou de outro plugin.
Pontos de entrada carregados por fachada preferem o snapshot ativo de configuração de runtime quando ele
existe, depois fazem fallback para o arquivo de configuração resolvido em disco.

Subcaminhos específicos de capacidade, como `image-generation`, `media-understanding`
e `speech`, existem porque plugins incluídos os usam hoje. Eles não são
contratos externos automaticamente congelados a longo prazo — verifique a página de
referência relevante do SDK ao depender deles.

## Esquemas de ferramentas de mensagem

Plugins devem ser donos das contribuições de esquema `describeMessageTool(...)`
específicas do canal para primitivos que não são mensagens, como reações, leituras e enquetes.
A apresentação compartilhada de envio deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos do provedor de botões, componentes, blocos ou cards.
Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) para o contrato,
regras de fallback, mapeamento de provedores e checklist do autor de plugin.

Plugins capazes de envio declaram o que podem renderizar por meio de capacidades de mensagem:

- `presentation` para blocos semânticos de apresentação (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O core decide se renderiza a apresentação nativamente ou a degrada para texto.
Não exponha escapes de UI nativa do provedor a partir da ferramenta genérica de mensagem.
Auxiliares obsoletos do SDK para esquemas nativos legados continuam exportados para plugins
de terceiros existentes, mas novos plugins não devem usá-los.

## Resolução de destino de canal

Plugins de canal devem ser donos da semântica de destino específica do canal. Mantenha o host
compartilhado de saída genérico e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca no diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve ir direto para resolução semelhante a id em vez de busca no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando
  o core precisa de uma resolução final pertencente ao provedor após a normalização ou depois de uma
  ausência no diretório.
- `messaging.resolveOutboundSessionRoute(...)` é dono da construção de rota de sessão
  específica do provedor depois que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes
  de pesquisar pares/grupos.
- Use `looksLikeId` para verificações de "tratar isto como um id de destino explícito/nativo".
- Use `resolveTarget` para fallback de normalização específico do provedor, não para
  busca ampla no diretório.
- Mantenha ids nativos do provedor, como ids de chat, ids de thread, JIDs, handles e ids de sala,
  dentro de valores `target` ou parâmetros específicos do provedor, não em campos genéricos do SDK.

## Diretórios respaldados por configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
plugin e reutilizar os auxiliares compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isto quando um canal precisar de pares/grupos respaldados por configuração, como:

- pares de DM orientados por allowlist
- mapas configurados de canal/grupo
- fallbacks de diretório estático com escopo de conta

Os auxiliares compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consultas
- aplicação de limite
- auxiliares de deduplicação/normalização
- criação de `ChannelDirectoryEntry[]`

A inspeção de conta específica do canal e a normalização de id devem permanecer na
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

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos provedores
implícitos integrados do OpenClaw:

- `simple`: provedores simples orientados por chave de API ou env
- `profile`: provedores que aparecem quando existem perfis de auth
- `paired`: provedores que sintetizam várias entradas de provedor relacionadas
- `late`: última passagem, após outros provedores implícitos

Provedores posteriores vencem em colisão de chave, então plugins podem substituir intencionalmente uma
entrada de provedor integrada com o mesmo id de provedor.

Compatibilidade:

- `discovery` ainda funciona como um alias legado
- se `catalog` e `discovery` forem registrados, o OpenClaw usa `catalog`

## Inspeção de canal somente leitura

Se seu plugin registra um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode pressupor que as credenciais
  estão totalmente materializadas e pode falhar rapidamente quando segredos obrigatórios estão ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de doctor/reparo
  de configuração não devem precisar materializar credenciais de runtime apenas para
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

Isso permite que comandos somente leitura relatem "configurado, mas indisponível neste caminho de
comando" em vez de travar ou relatar incorretamente a conta como não configurada.

## Packs de pacote

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

Cada entrada se torna um plugin. Se o pack listar várias extensions, o id do plugin
se torna `name/<fileBase>`.

Se seu plugin importar deps npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Proteção de segurança: cada entrada `openclaw.extensions` deve permanecer dentro do diretório do plugin
após a resolução de symlink. Entradas que escapam do diretório do pacote são
rejeitadas.

Nota de segurança: `openclaw plugins install` instala dependências de plugin com um
`npm install --omit=dev --ignore-scripts` local do projeto (sem scripts de lifecycle,
sem dependências de desenvolvimento em runtime), ignorando configurações globais herdadas de instalação npm.
Mantenha árvores de dependência de plugin "JS/TS puro" e evite pacotes que exijam
builds `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve somente de configuração.
Quando o OpenClaw precisa de superfícies de configuração para um plugin de canal desabilitado, ou
quando um plugin de canal está habilitado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso mantém a inicialização e a configuração mais leves
quando a entrada principal do plugin também conecta ferramentas, hooks ou outro código somente de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode fazer um plugin de canal optar pelo mesmo caminho `setupEntry` durante a fase de
inicialização pré-listen do gateway, mesmo quando o canal já está configurado.

Use isto somente quando `setupEntry` cobrir totalmente a superfície de inicialização que deve existir
antes que o gateway comece a escutar. Na prática, isso significa que a entrada de configuração
deve registrar toda capacidade pertencente ao canal da qual a inicialização depende, como:

- o próprio registro de canal
- quaisquer rotas HTTP que devem estar disponíveis antes que o gateway comece a escutar
- quaisquer métodos, ferramentas ou serviços do gateway que devem existir durante essa mesma janela

Se sua entrada completa ainda for dona de qualquer capacidade de inicialização obrigatória, não habilite
esta flag. Mantenha o plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais incluídos também podem publicar auxiliares de superfície de contrato somente de configuração que o core
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual de
promoção de configuração é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O núcleo usa essa superfície quando precisa promover uma configuração legada de canal de conta única para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin. Matrix é o exemplo empacotado atual: ele move apenas chaves de autenticação/bootstrap para uma conta promovida nomeada quando contas nomeadas já existem, e pode preservar uma chave de conta padrão não canônica configurada em vez de sempre criar `accounts.default`.

Esses adaptadores de patch de configuração mantêm a descoberta da superfície de contrato empacotada preguiçosa. O tempo de importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso, em vez de reentrar na inicialização de canal empacotado na importação do módulo.

Quando essas superfícies de inicialização incluem métodos RPC do Gateway, mantenha-os em um prefixo específico do plugin. Namespaces administrativos do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre resolvem para `operator.admin`, mesmo que um plugin solicite um escopo mais restrito.

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

- `detailLabel`: rótulo secundário para superfícies de catálogo/status mais ricas
- `docsLabel`: substitui o texto do link da documentação
- `preferOver`: ids de plugin/canal de prioridade mais baixa que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos para compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: inclui o canal no fluxo padrão de início rápido `allowFrom`
- `forceAccountBinding`: exige vinculação explícita de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca de sessão ao resolver destinos de anúncio

O OpenClaw também pode mesclar **catálogos de canais externos** (por exemplo, uma exportação de registro MPM). Coloque um arquivo JSON em um destes caminhos:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O analisador também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

Entradas geradas de catálogo de canais e entradas de catálogo de instalação de provedores expõem fatos normalizados sobre a origem de instalação ao lado do bloco bruto `openclaw.install`. Os fatos normalizados identificam se a especificação npm é uma versão exata ou um seletor flutuante, se os metadados de integridade esperados estão presentes e se um caminho de origem local também está disponível. Quando a identidade do catálogo/pacote é conhecida, os fatos normalizados avisam se o nome do pacote npm analisado diverge dessa identidade. Eles também avisam quando `defaultChoice` é inválido ou aponta para uma origem que não está disponível, e quando metadados de integridade npm estão presentes sem uma origem npm válida. Consumidores devem tratar `installSource` como um campo opcional aditivo para que entradas criadas manualmente e shims de catálogo não precisem sintetizá-lo. Isso permite que onboarding e diagnósticos expliquem o estado do plano de origem sem importar o runtime do plugin.

Entradas npm externas oficiais devem preferir um `npmSpec` exato mais `expectedIntegrity`. Nomes de pacote simples e dist-tags ainda funcionam por compatibilidade, mas exibem avisos do plano de origem para que o catálogo possa avançar para instalações fixadas e verificadas por integridade sem quebrar plugins existentes. Quando o onboarding instala a partir de um caminho de catálogo local, ele registra uma entrada gerenciada de índice de plugins com `source: "path"` e um `sourcePath` relativo ao workspace quando possível. O caminho absoluto de carregamento operacional permanece em `plugins.load.paths`; o registro de instalação evita duplicar caminhos da estação de trabalho local na configuração de longa duração. Isso mantém instalações de desenvolvimento local visíveis para diagnósticos do plano de origem sem adicionar uma segunda superfície bruta de divulgação de caminhos do sistema de arquivos. O índice de plugins persistido em `plugins/installs.json` é a fonte da verdade de instalação e pode ser atualizado sem carregar módulos de runtime de plugins. Seu mapa `installRecords` é durável mesmo quando o manifesto de um plugin está ausente ou inválido; seu array `plugins` é uma visão de manifesto reconstruível.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto são responsáveis pela orquestração de contexto de sessão para ingestão, montagem e Compaction. Registre-os a partir do seu plugin com `api.registerContextEngine(id, factory)` e selecione o mecanismo ativo com `plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline de contexto padrão, em vez de apenas adicionar busca de memória ou hooks.

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

A factory `ctx` expõe valores opcionais `config`, `agentDir` e `workspaceDir` para inicialização em tempo de construção.

Se o seu mecanismo **não** for responsável pelo algoritmo de compaction, mantenha `compact()` implementado e delegue explicitamente:

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

Quando um plugin precisa de um comportamento que não se encaixa na API atual, não contorne o sistema de plugins com um acesso privado interno. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato do núcleo
   Decida qual comportamento compartilhado o núcleo deve possuir: política, fallback, mesclagem de configuração, ciclo de vida, semântica voltada ao canal e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada de capacidade que seja útil.
3. conecte o núcleo + consumidores de canal/recurso
   Canais e plugins de recurso devem consumir a nova capacidade por meio do núcleo, não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends contra a capacidade.
5. adicione cobertura de contrato
   Adicione testes para que a propriedade e o formato de registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar hardcoded na visão de mundo de um único provedor. Consulte o [Cookbook de capacidades](/pt-BR/plugins/architecture) para uma lista concreta de arquivos e um exemplo trabalhado.

### Checklist de capacidade

Ao adicionar uma nova capacidade, a implementação normalmente deve tocar estas superfícies em conjunto:

- tipos de contrato do núcleo em `src/<capability>/types.ts`
- helper de runner/runtime do núcleo em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- conexão do registro de plugins em `src/plugins/registry.ts`
- exposição de runtime de plugins em `src/plugins/runtime/*` quando plugins de recurso/canal precisarem consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação de operador/plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso geralmente é sinal de que a capacidade ainda não está totalmente integrada.

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

- o núcleo possui o contrato de capacidade + orquestração
- plugins de fornecedor possuem implementações de fornecedor
- plugins de recurso/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita

## Relacionados

- [Arquitetura de plugins](/pt-BR/plugins/architecture) — modelo público de capacidades e formatos
- [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths)
- [Configuração do SDK de plugins](/pt-BR/plugins/sdk-setup)
- [Criação de plugins](/pt-BR/plugins/building-plugins)
