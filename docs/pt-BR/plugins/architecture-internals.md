---
read_when:
    - Implementando ganchos de tempo de execução de provedores, ciclo de vida de canais ou conjuntos de pacotes
    - Depuração da ordem de carregamento do Plugin ou do estado do registro
    - Adicionando uma nova capacidade de Plugin ou um Plugin de mecanismo de contexto
summary: 'Aspectos internos da arquitetura de Plugin: fluxo de carregamento, registro, ganchos de tempo de execução, rotas HTTP e tabelas de referência'
title: Detalhes internos da arquitetura de Plugin
x-i18n:
    generated_at: "2026-05-03T21:35:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para o modelo público de capacidades, formatos de Plugin e contratos de propriedade/execução, consulte [Arquitetura de Plugin](/pt-BR/plugins/architecture). Esta página é a referência para os mecanismos internos: pipeline de carregamento, registro, hooks de runtime, rotas HTTP do Gateway, caminhos de importação e tabelas de esquema.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de plugins
2. lê manifestos de bundles nativos ou compatíveis e metadados de pacotes
3. rejeita candidatos inseguros
4. normaliza a configuração de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega módulos nativos habilitados: módulos bundled compilados usam um loader nativo;
   código-fonte TypeScript local de terceiros usa o fallback emergencial Jiti
7. chama hooks nativos `register(api)` e coleta registros no registro de plugins
8. expõe o registro para comandos/superfícies de runtime

<Note>
`activate` é um alias legado de `register` — o loader resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins bundled usam `register`; prefira `register` para novos plugins.
</Note>

Os gates de segurança acontecem **antes** da execução de runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do Plugin, o caminho é gravável por todos ou a propriedade
do caminho parece suspeita para plugins não bundled.

Candidatos bloqueados continuam associados ao respectivo id de Plugin para diagnósticos. Se a configuração
ainda referencia esse id, a validação informa que o Plugin está presente, mas bloqueado,
e aponta de volta para o aviso de segurança de caminho em vez de tratar a entrada de configuração
como obsoleta.

### Comportamento manifest-first

O manifesto é a fonte da verdade do plano de controle. O OpenClaw o usa para:

- identificar o Plugin
- descobrir canais/skills/esquema de configuração declarados ou capacidades de bundle
- validar `plugins.entries.<id>.config`
- complementar rótulos/placeholders da Control UI
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração inicial sem carregar o runtime do Plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
o comportamento real, como hooks, ferramentas, comandos ou fluxos de provider.

Blocos opcionais `activation` e `setup` do manifesto permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de setup;
não substituem registro de runtime, `register(...)` nem `setupEntry`.
Os primeiros consumidores de ativação ao vivo agora usam dicas de comando, canal e provider do manifesto
para restringir o carregamento de plugins antes da materialização mais ampla do registro:

- o carregamento da CLI restringe aos plugins que possuem o comando primário solicitado
- a resolução de setup/Plugin de canal restringe aos plugins que possuem o
  id de canal solicitado
- a resolução explícita de setup/runtime de provider restringe aos plugins que possuem o
  id de provider solicitado
- o planejamento de inicialização do Gateway usa `activation.onStartup` para imports explícitos de inicialização
  e opt-outs de inicialização; plugins sem metadados de inicialização carregam apenas
  por gatilhos de ativação mais restritos

Preloads de runtime em tempo de requisição que solicitam o escopo amplo `all` ainda derivam um
conjunto efetivo explícito de ids de Plugin a partir da configuração, planejamento de inicialização, canais
configurados, slots e regras de auto-habilitação. Se esse conjunto derivado estiver vazio, o OpenClaw
carrega um registro de runtime vazio em vez de ampliar para todos os
plugins descobríveis.

O planejador de ativação expõe tanto uma API somente de ids para chamadores existentes quanto uma
API de plano para novos diagnósticos. Entradas de plano informam por que um Plugin foi selecionado,
separando dicas explícitas do planejador `activation.*` de fallback de propriedade do manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks. Essa separação de motivos é o limite de compatibilidade:
metadados existentes de Plugin continuam funcionando, enquanto novo código pode detectar dicas amplas
ou comportamento de fallback sem alterar a semântica de carregamento de runtime.

A descoberta de setup agora prefere ids pertencentes a descritores, como `setup.providers` e
`setup.cliBackends`, para restringir plugins candidatos antes de recorrer a
`setup-api` para plugins que ainda precisam de hooks de runtime em tempo de setup. Listas de
setup de provider usam `providerAuthChoices` do manifesto, escolhas de setup derivadas de descritor
e metadados do catálogo de instalação sem carregar o runtime do provider. `setup.requiresRuntime: false`
explícito é um corte somente de descritor; `requiresRuntime` omitido mantém o fallback legado
`setup-api` por compatibilidade. Se mais de um Plugin descoberto reivindicar o mesmo id
normalizado de provider de setup ou backend de CLI, a busca de setup recusa o proprietário ambíguo
em vez de depender da ordem de descoberta. Quando o runtime de setup é executado, diagnósticos
do registro informam divergências entre `setup.providers` / `setup.cliBackends` e os providers ou backends de CLI
registrados por setup-api sem bloquear plugins legados.

### Limite de cache de Plugin

O OpenClaw não armazena em cache resultados de descoberta de plugins nem dados diretos do registro
de manifestos por janelas de relógio. Instalações, edições de manifesto e alterações de caminho de carregamento
devem ficar visíveis na próxima leitura explícita de metadados ou reconstrução de snapshot.
O parser de arquivo de manifesto pode manter um cache limitado de assinatura de arquivo, indexado pelo
caminho do manifesto aberto, inode, tamanho e timestamps; esse cache apenas evita
reanalisar bytes inalterados e não deve armazenar em cache respostas de descoberta, registro, proprietário ou
política.

O caminho rápido seguro de metadados é a propriedade explícita de objetos, não um cache oculto.
Hot paths de inicialização do Gateway devem passar o `PluginMetadataSnapshot` atual, a
`PluginLookUpTable` derivada ou um registro explícito de manifestos pela cadeia de chamadas.
Validação de configuração, auto-habilitação na inicialização, bootstrap de Plugin e seleção de provider
podem reutilizar esses objetos enquanto eles representarem a configuração atual e o inventário de plugins.
A busca de setup ainda reconstrói metadados de manifesto sob demanda,
a menos que o caminho de setup específico receba um registro explícito de manifestos; mantenha isso
como fallback de cold path em vez de adicionar caches ocultos de busca. Quando a entrada
mudar, reconstrua e substitua o snapshot em vez de mutá-lo ou manter
cópias históricas.
Views sobre o registro ativo de plugins e helpers de bootstrap de canal bundled
devem ser recalculados a partir do registro/raiz atual. Mapas de curta duração são aceitáveis
dentro de uma chamada para deduplicar trabalho ou proteger reentrada; eles não devem se tornar caches
de metadados de processo.

Para carregamento de plugins, a camada de cache persistente é o carregamento de runtime. Ela pode reutilizar
estado do loader quando código ou artefatos instalados são de fato carregados, como:

- `PluginLoaderCacheState` e registros de runtime ativos compatíveis
- caches de jiti/módulo e caches de loader de superfície pública usados para evitar importar
  a mesma superfície de runtime repetidamente
- caches de sistema de arquivos para artefatos de Plugin instalados
- mapas de curta duração por chamada para normalização de caminho ou resolução de duplicatas

Esses caches são detalhes de implementação do plano de dados. Eles não devem responder
perguntas do plano de controle, como "qual Plugin possui este provider?", a menos que o
chamador tenha solicitado deliberadamente carregamento de runtime.

Não adicione caches persistentes ou por relógio para:

- resultados de descoberta
- registros diretos de manifestos
- registros de manifestos reconstruídos a partir do índice de plugins instalados
- busca de proprietário de provider, supressão de modelo, política de provider ou metadados de artefato
  público
- qualquer outra resposta derivada de manifesto em que um manifesto alterado, índice instalado
  ou caminho de carregamento deva ficar visível na próxima leitura de metadados

Chamadores que reconstroem metadados de manifesto a partir do índice persistido de plugins instalados
reconstroem esse registro sob demanda. O índice instalado é estado durável do plano de origem;
ele não é um cache oculto de metadados em processo.

## Modelo de registro

Plugins carregados não modificam diretamente globais aleatórios do core. Eles se registram em um
registro central de plugins.

O registro rastreia:

- registros de Plugin (identidade, origem, fonte, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- providers
- handlers de RPC do Gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos pertencentes a Plugin

Recursos do core então leem desse registro em vez de falar diretamente com módulos de Plugin.
Isso mantém o carregamento em mão única:

- módulo de Plugin -> registro no registro
- runtime do core -> consumo do registro

Essa separação importa para a manutenibilidade. Ela significa que a maioria das superfícies do core
precisa de apenas um ponto de integração: "ler o registro", não "tratar cada módulo de Plugin como caso especial".

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
conversa, e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provider

Plugins de provider têm três camadas:

- **Metadados de manifesto** para busca barata pré-runtime:
  `setup.providers[].envVars`, compatibilidade obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hooks em tempo de configuração**: `catalog` (legado `discovery`) mais
  `applyConfigDefaults`.
- **Hooks de runtime**: mais de 40 hooks opcionais cobrindo autenticação, resolução de modelo,
  encapsulamento de stream, níveis de pensamento, política de replay e endpoints de uso. Veja
  a lista completa em [Ordem e uso de hooks](#hook-order-and-usage).

O OpenClaw ainda é dono do loop genérico de agente, failover, tratamento de transcrição e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de provider
sem precisar de um transporte de inferência totalmente customizado.

Use `setup.providers[].envVars` do manifesto quando o provider tiver credenciais baseadas em env
que caminhos genéricos de autenticação/status/seletor de modelo devam ver sem
carregar o runtime do Plugin. `providerAuthEnvVars` obsoleto ainda é lido pelo adaptador
de compatibilidade durante a janela de depreciação, e plugins não bundled
que o usam recebem um diagnóstico de manifesto. Use `providerAuthAliases` do manifesto
quando um id de provider deve reutilizar env vars, perfis de autenticação,
autenticação baseada em configuração e escolha de onboarding por chave de API de outro id de provider. Use
`providerAuthChoices` do manifesto quando superfícies de CLI de onboarding/escolha de autenticação devem saber o
id de escolha, rótulos de grupo e wiring simples de autenticação com uma flag do provider sem
carregar o runtime do provider. Mantenha `envVars` de runtime de provider para dicas voltadas
ao operador, como rótulos de onboarding ou vars de setup de client-id/client-secret OAuth.

Use `channelEnvVars` do manifesto quando um canal tiver autenticação ou setup orientado por env que
fallback genérico de shell-env, verificações de configuração/status ou prompts de setup devam ver
sem carregar o runtime do canal.

### Ordem e uso de hooks

Para plugins de modelo/provider, o OpenClaw chama hooks nesta ordem aproximada.
A coluna "Quando usar" é o guia rápido de decisão.
Campos de provider somente de compatibilidade que o OpenClaw não chama mais, como
`ProviderPlugin.capabilities` e `suppressBuiltInModel`, são intencionalmente omitidos
aqui.

| #   | Gancho                            | O que faz                                                                                                              | Quando usar                                                                                                                                              |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                            | O provedor controla um catálogo ou padrões de URL base                                                                                                   |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração pertencentes ao provedor durante a materialização da configuração                | Os padrões dependem do modo de autenticação, do ambiente ou da semântica de família de modelos do provedor                                               |
| --  | _(busca de modelo integrada)_     | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                        | _(não é um gancho de Plugin)_                                                                                                                           |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de pré-visualização de IDs de modelo antes da busca                                        | O provedor controla a limpeza de aliases antes da resolução canônica do modelo                                                                           |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo                                | O provedor controla a limpeza de transporte para IDs de provedores personalizados na mesma família de transporte                                         |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de tempo de execução/provedor                                      | O provedor precisa de limpeza de configuração que deve ficar com o Plugin; auxiliares agrupados da família Google também dão suporte a entradas de configuração Google compatíveis |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo aos provedores de configuração                         | O provedor precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                                          |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de ambiente para provedores de configuração antes do carregamento de autenticação em tempo de execução | O provedor tem resolução de chave de API por marcador de ambiente pertencente ao provedor; `amazon-bedrock` também tem aqui um resolvedor integrado de marcador de ambiente da AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/auto-hospedada ou baseada em configuração sem persistir texto simples                         | O provedor pode operar com um marcador de credencial sintético/local                                                                                     |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis de autenticação externos pertencentes ao provedor; o `persistence` padrão é `runtime-only` para credenciais pertencentes à CLI/ao app | O provedor reutiliza credenciais de autenticação externas sem persistir tokens de atualização copiados; declare `contracts.externalAuthProviders` no manifesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders de perfis sintéticos armazenados atrás de autenticação baseada em ambiente/configuração            | O provedor armazena perfis de placeholder sintéticos que não devem vencer em precedência                                                                 |
| 11  | `resolveDynamicModel`             | Fallback síncrono para IDs de modelo pertencentes ao provedor que ainda não estão no registro local                    | O provedor aceita IDs arbitrários de modelos upstream                                                                                                    |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono; depois `resolveDynamicModel` é executado novamente                                             | O provedor precisa de metadados de rede antes de resolver IDs desconhecidos                                                                              |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o executor incorporado usar o modelo resolvido                                                | O provedor precisa de reescritas de transporte, mas ainda usa um transporte central                                                                      |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos de fornecedores por trás de outro transporte compatível                | O provedor reconhece seus próprios modelos em transportes proxy sem assumir o controle do provedor                                                       |
| 15  | `normalizeToolSchemas`            | Normaliza esquemas de ferramentas antes de o executor incorporado vê-los                                               | O provedor precisa de limpeza de esquema da família de transporte                                                                                        |
| 16  | `inspectToolSchemas`              | Expõe diagnósticos de esquema pertencentes ao provedor após a normalização                                             | O provedor quer avisos de palavras-chave sem ensinar ao núcleo regras específicas de provedor                                                            |
| 17  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo vs marcado                                                            | O provedor precisa de raciocínio/saída final marcados em vez de campos nativos                                                                           |
| 18  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes de wrappers genéricos de opções de stream                               | O provedor precisa de parâmetros de requisição padrão ou limpeza de parâmetros por provedor                                                              |
| 19  | `createStreamFn`                  | Substitui totalmente o caminho normal de stream por um transporte personalizado                                        | O provedor precisa de um protocolo de fio personalizado, não apenas um wrapper                                                                           |
| 20  | `wrapStreamFn`                    | Wrapper de stream depois que wrappers genéricos são aplicados                                                          | O provedor precisa de wrappers de compatibilidade de cabeçalhos/corpo/modelo da requisição sem um transporte personalizado                               |
| 21  | `resolveTransportTurnState`       | Anexa cabeçalhos ou metadados nativos de transporte por turno                                                          | O provedor quer que transportes genéricos enviem a identidade de turno nativa do provedor                                                               |
| 22  | `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos WebSocket nativos ou política de resfriamento de sessão                                               | O provedor quer que transportes WS genéricos ajustem cabeçalhos de sessão ou política de fallback                                                        |
| 23  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado se torna a string `apiKey` em tempo de execução             | O provedor armazena metadados extras de autenticação e precisa de um formato personalizado de token em tempo de execução                                 |
| 24  | `refreshOAuth`                    | Substituição de atualização OAuth para endpoints de atualização personalizados ou política de falha de atualização      | O provedor não se encaixa nos atualizadores `pi-ai` compartilhados                                                                                       |
| 25  | `buildAuthDoctorHint`             | Dica de reparo anexada quando a atualização OAuth falha                                                                | O provedor precisa de orientação de reparo de autenticação pertencente ao provedor após falha de atualização                                             |
| 26  | `matchesContextOverflowError`     | Correspondência de estouro de janela de contexto pertencente ao provedor                                               | O provedor tem erros brutos de estouro que heurísticas genéricas deixariam passar                                                                        |
| 27  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provedor                                                            | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc                                                                |
| 28  | `isCacheTtlEligible`              | Política de cache de prompt para provedores proxy/backhaul                                                             | O provedor precisa de controle de TTL de cache específico de proxy                                                                                       |
| 29  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação de autenticação ausente                                               | O provedor precisa de uma dica de recuperação de autenticação ausente específica do provedor                                                            |
| 30  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                                       | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                                          |
| 31  | `resolveThinkingProfile`          | Conjunto de níveis `/think` específico do modelo, rótulos de exibição e padrão                                        | O provedor expõe uma escala de thinking personalizada ou rótulo binário para modelos selecionados                                                       |
| 32  | `isBinaryThinking`                | Gancho de compatibilidade de alternância de raciocínio ligado/desligado                                                | O provedor expõe apenas thinking binário ligado/desligado                                                                                                |
| 33  | `supportsXHighThinking`           | Gancho de compatibilidade de suporte a raciocínio `xhigh`                                                             | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                                              |
| 34  | `resolveDefaultThinkingLevel`     | Gancho de compatibilidade de nível `/think` padrão                                                                     | O provedor controla a política padrão de `/think` para uma família de modelos                                                                            |
| 35  | `isModernModelRef`                | Correspondência de modelo moderno para filtros de perfil ao vivo e seleção de smoke                                   | O provedor controla a correspondência de modelo preferencial ao vivo/smoke                                                                               |
| 36  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real em tempo de execução imediatamente antes da inferência          | O provedor precisa de uma troca de token ou credencial de requisição de curta duração                                                                    |
| 37  | `resolveUsageAuth`                | Resolver credenciais de uso/cobrança para `/usage` e superfícies de status relacionadas                                     | O provedor precisa de análise personalizada de token de uso/cota ou de uma credencial de uso diferente                                                               |
| 38  | `fetchUsageSnapshot`              | Buscar e normalizar snapshots de uso/cota específicos do provedor depois que a autenticação é resolvida                             | O provedor precisa de um endpoint de uso específico do provedor ou de um analisador de payload                                                                           |
| 39  | `createEmbeddingProvider`         | Criar um adaptador de embeddings pertencente ao provedor para memória/busca                                                     | O comportamento de embeddings de memória pertence ao Plugin do provedor                                                                                    |
| 40  | `buildReplayPolicy`               | Retornar uma política de replay que controla o tratamento da transcrição para o provedor                                        | O provedor precisa de uma política personalizada de transcrição (por exemplo, remoção de blocos de raciocínio)                                                               |
| 41  | `sanitizeReplayHistory`           | Reescrever o histórico de replay após a limpeza genérica da transcrição                                                        | O provedor precisa de reescritas de replay específicas do provedor além dos auxiliares compartilhados de Compaction                                                             |
| 42  | `validateReplayTurns`             | Validação final dos turnos de replay ou remodelagem antes do runner incorporado                                           | O transporte do provedor precisa de validação de turnos mais rigorosa após a sanitização genérica                                                                    |
| 43  | `onModelSelected`                 | Executar efeitos colaterais pós-seleção pertencentes ao provedor                                                                 | O provedor precisa de telemetria ou estado pertencente ao provedor quando um modelo se torna ativo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` verificam primeiro o
plugin de provedor correspondente e, depois, passam por outros plugins de provedor
compatíveis com hooks até que algum deles realmente altere o id do modelo ou o transporte/configuração. Isso mantém
shims de provedor de alias/compatibilidade funcionando sem exigir que o chamador saiba qual
plugin bundled é dono da reescrita. Se nenhum hook de provedor reescrever uma entrada de configuração
da família Google compatível, o normalizador bundled de configuração do Google ainda aplica
essa limpeza de compatibilidade.

Se o provedor precisa de um protocolo de conexão totalmente personalizado ou de um executor de requisições personalizado,
isso é uma classe diferente de extensão. Estes hooks são para comportamentos de provedor
que ainda rodam no loop de inferência normal do OpenClaw.

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

Plugins de provedor bundled combinam os hooks acima para se ajustar ao catálogo,
à autenticação, ao raciocínio, à repetição e às necessidades de uso de cada fornecedor. O conjunto de hooks autoritativo fica com
cada plugin em `extensions/`; esta página ilustra os formatos em vez de
espelhar a lista.

<AccordionGroup>
  <Accordion title="Provedores de catálogo pass-through">
    OpenRouter, Kilocode, Z.AI, xAI registram `catalog` mais
    `resolveDynamicModel` / `prepareDynamicModel` para poderem expor ids de modelos upstream
    antes do catálogo estático do OpenClaw.
  </Accordion>
  <Accordion title="Provedores de OAuth e endpoints de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinam
    `prepareRuntimeAuth` ou `formatApiKey` com `resolveUsageAuth` +
    `fetchUsageSnapshot` para controlar a troca de tokens e a integração com `/usage`.
  </Accordion>
  <Accordion title="Famílias de repetição e limpeza de transcrição">
    Famílias nomeadas compartilhadas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permitem que provedores adotem
    a política de transcrição via `buildReplayPolicy` em vez de cada plugin
    reimplementar a limpeza.
  </Accordion>
  <Accordion title="Provedores somente de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registram apenas `catalog` e usam o loop de inferência compartilhado.
  </Accordion>
  <Accordion title="Auxiliares de stream específicos do Anthropic">
    Cabeçalhos beta, `/fast` / `serviceTier` e `context1m` ficam dentro da
    seam pública `api.ts` / `contract-api.ts` do plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) em vez de ficarem no
    SDK genérico.
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

- `textToSpeech` retorna o payload de saída TTS normal do core para superfícies de arquivo/anotação de voz.
- Usa a configuração core `messages.tts` e a seleção de provedor.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem fazer resampling/encoding para provedores.
- `listVoices` é opcional por provedor. Use-o para seletores de voz ou fluxos de configuração pertencentes ao fornecedor.
- Listagens de voz podem incluir metadados mais ricos, como localidade, gênero e tags de personalidade para seletores cientes de provedor.
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

- Mantenha a política de TTS, fallback e entrega de resposta no core.
- Use provedores de fala para comportamento de síntese pertencente ao fornecedor.
- A entrada Microsoft legada `edge` é normalizada para o id de provedor `microsoft`.
- O modelo de propriedade preferido é orientado por empresa: um plugin de fornecedor pode ser dono de
  provedores de texto, fala, imagem e mídia futura conforme o OpenClaw adiciona esses
  contratos de capacidade.

Para entendimento de imagem/áudio/vídeo, plugins registram um provedor tipado de
entendimento de mídia em vez de uma bag genérica de chave/valor:

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

- Mantenha orquestração, fallback, configuração e integração com canais no core.
- Mantenha o comportamento do fornecedor no plugin de provedor.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos de
  resultado opcionais, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core é dono do contrato de capacidade e do auxiliar de runtime
  - plugins de fornecedores registram `api.registerVideoGenerationProvider(...)`
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
- Usa a configuração de áudio de entendimento de mídia do core (`tools.media.audio`) e a ordem de fallback dos provedores.
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
- Para execuções de fallback pertencentes a plugins, operadores devem optar por participar com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos `provider/model` específicos, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de plugins não confiáveis ainda funcionam, mas solicitações de substituição são rejeitadas em vez de cair silenciosamente no fallback.
- Sessões de subagente criadas por plugins recebem tags com o id do plugin criador. O fallback `api.runtime.subagent.deleteSession(...)` pode excluir apenas essas sessões pertencentes ao plugin; a exclusão arbitrária de sessões ainda exige uma requisição ao Gateway com escopo de administrador.

Para pesquisa na web, plugins podem consumir o auxiliar de runtime compartilhado em vez de
acessar a integração de ferramentas do agente:

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

- Mantenha a seleção de provedor, a resolução de credenciais e a semântica compartilhada de requisições no core.
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

- `generate(...)`: gera uma imagem usando a cadeia configurada de provedores de geração de imagens.
- `listProviders(...)`: lista provedores de geração de imagens disponíveis e suas capacidades.

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
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway, ou `"plugin"` para autenticação/verificação de webhook gerenciada pelo plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a requisição.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento de Plugin. Use `api.registerHttpRoute(...)` em vez disso.
- As rotas de Plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um Plugin não pode substituir a rota de outro Plugin.
- Rotas sobrepostas com níveis de `auth` diferentes são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` somente no mesmo nível de auth.
- Rotas `auth: "plugin"` **não** recebem escopos de runtime do operador automaticamente. Elas servem para webhooks/verificação de assinatura gerenciados pelo Plugin, não para chamadas privilegiadas de helpers do Gateway.
- Rotas `auth: "gateway"` são executadas dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - auth bearer com segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém os escopos de runtime de rotas de Plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis que carregam identidade (por exemplo, `trusted-proxy` ou `gateway.auth.mode = "none"` em um ingresso privado) respeitam `x-openclaw-scopes` somente quando o cabeçalho está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas requisições de rotas de Plugin que carregam identidade, o escopo de runtime volta para `operator.write`
- Regra prática: não presuma que uma rota de Plugin com auth de gateway seja uma superfície administrativa implícita. Se sua rota precisa de comportamento exclusivo de admin, exija um modo de auth que carregue identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.

## Caminhos de importação do SDK de Plugin

Use subcaminhos estreitos do SDK em vez do barrel raiz monolítico `openclaw/plugin-sdk` ao criar novos plugins. Subcaminhos principais:

| Subcaminho                          | Finalidade                                        |
| ----------------------------------- | ------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugin                  |
| `openclaw/plugin-sdk/channel-core`  | Helpers de entrada/build de canal                 |
| `openclaw/plugin-sdk/core`          | Helpers compartilhados genéricos e contrato guarda-chuva |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |

Plugins de canal escolhem entre uma família de seams estreitos — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve se consolidar
em um contrato `approvalCapability`, em vez de se misturar entre campos de
Plugin não relacionados. Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

Helpers de runtime e configuração ficam em subcaminhos focados `*-runtime`
correspondentes (`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefira `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
em vez do barrel amplo de compatibilidade `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` são shims de compatibilidade obsoletos para
plugins mais antigos. Código novo deve importar primitivas genéricas mais estreitas.
</Info>

Pontos de entrada internos do repositório (por raiz de pacote de Plugin incluído):

- `index.js` — entrada de Plugin incluído
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel exclusivo de runtime
- `setup-entry.js` — entrada de Plugin de configuração

Plugins externos devem importar somente subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe `src/*` do pacote de outro Plugin a partir do core ou de outro Plugin.
Pontos de entrada carregados por fachada preferem o snapshot ativo da configuração de runtime quando ele
existe; depois fazem fallback para o arquivo de configuração resolvido no disco.

Subcaminhos específicos de capacidade, como `image-generation`, `media-understanding`
e `speech`, existem porque plugins incluídos os usam hoje. Eles não são
automaticamente contratos externos congelados de longo prazo — verifique a página de
referência relevante do SDK ao depender deles.

## Esquemas da ferramenta de mensagem

Plugins devem ser donos das contribuições de esquema `describeMessageTool(...)`
específicas de canal para primitivas que não sejam mensagens, como reações, leituras e enquetes.
A apresentação compartilhada de envio deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos do provedor para botões, componentes, blocos ou cartões.
Consulte [Apresentação de mensagens](/pt-BR/plugins/message-presentation) para o contrato,
regras de fallback, mapeamento de provedores e checklist para autores de Plugin.

Plugins capazes de enviar declaram o que conseguem renderizar por meio de capacidades de mensagem:

- `presentation` para blocos de apresentação semântica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O core decide se renderiza a apresentação nativamente ou a degrada para texto.
Não exponha escape hatches de UI nativa do provedor a partir da ferramenta genérica de mensagem.
Helpers obsoletos do SDK para esquemas nativos legados continuam exportados para
plugins de terceiros existentes, mas novos plugins não devem usá-los.

## Resolução de destinos de canal

Plugins de canal devem ser donos da semântica de destinos específica do canal. Mantenha o host
compartilhado de saída genérico e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca no diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve ir direto para resolução parecida com id em vez de busca no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do Plugin quando
  o core precisa de uma resolução final pertencente ao provedor após a normalização ou após uma
  ausência no diretório.
- `messaging.resolveOutboundSessionRoute(...)` controla a construção de rota de sessão
  específica do provedor depois que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem ocorrer antes
  de pesquisar pares/grupos.
- Use `looksLikeId` para verificações de "tratar isto como um id de destino explícito/nativo".
- Use `resolveTarget` para fallback de normalização específico do provedor, não para
  busca ampla no diretório.
- Mantenha ids nativos do provedor, como ids de chat, ids de thread, JIDs, handles e ids de sala,
  dentro de valores `target` ou parâmetros específicos do provedor, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
Plugin e reutilizar os helpers compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isto quando um canal precisar de pares/grupos baseados em configuração, como:

- pares de DM orientados por allowlist
- mapas de canal/grupo configurados
- fallbacks de diretório estático com escopo de conta

Os helpers compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consulta
- aplicação de limite
- helpers de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

A inspeção de conta específica do canal e a normalização de ids devem permanecer na
implementação do Plugin.

## Catálogos de provedores

Plugins de provedor podem definir catálogos de modelos para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para várias entradas de provedor

Use `catalog` quando o Plugin for dono de ids de modelos específicos do provedor, padrões de URL
base ou metadados de modelos protegidos por auth.

`catalog.order` controla quando o catálogo de um Plugin é mesclado em relação aos provedores
implícitos integrados do OpenClaw:

- `simple`: provedores simples orientados por chave de API ou env
- `profile`: provedores que aparecem quando perfis de auth existem
- `paired`: provedores que sintetizam várias entradas de provedor relacionadas
- `late`: último passe, após outros provedores implícitos

Provedores posteriores vencem em colisão de chave, então plugins podem substituir intencionalmente uma
entrada de provedor integrada com o mesmo id de provedor.

Compatibilidade:

- `discovery` ainda funciona como alias legado
- se `catalog` e `discovery` forem registrados, o OpenClaw usa `catalog`

## Inspeção de canal somente leitura

Se seu Plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode presumir que credenciais
  estão totalmente materializadas e pode falhar rapidamente quando segredos obrigatórios estão ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de reparo de doctor/config
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

Isso permite que comandos somente leitura relatem "configurado, mas indisponível neste caminho de
comando" em vez de travar ou informar incorretamente que a conta não está configurada.

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

Se seu Plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Guardrail de segurança: toda entrada `openclaw.extensions` deve permanecer dentro do diretório do Plugin
após a resolução de symlink. Entradas que escapam do diretório do pacote são
rejeitadas.

Nota de segurança: `openclaw plugins install` instala dependências de Plugin com um
`npm install --omit=dev --ignore-scripts` local ao projeto (sem scripts de ciclo de vida,
sem dependências de desenvolvimento em runtime), ignorando configurações globais herdadas de instalação npm.
Mantenha árvores de dependência de Plugin "JS/TS puro" e evite pacotes que exijam
builds `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve exclusivo de configuração.
Quando o OpenClaw precisa de superfícies de configuração para um Plugin de canal desabilitado, ou
quando um Plugin de canal está habilitado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do Plugin. Isso deixa a inicialização e a configuração mais leves
quando a entrada principal do seu Plugin também conecta ferramentas, hooks ou outro código exclusivo de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode optar um Plugin de canal pelo mesmo caminho `setupEntry` durante a fase de inicialização
pré-listen do gateway, mesmo quando o canal já está configurado.

Use isto apenas quando `setupEntry` cobrir totalmente a superfície de inicialização que deve existir
antes que o gateway comece a escutar. Na prática, isso significa que a entrada de configuração
deve registrar toda capacidade pertencente ao canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que devem estar disponíveis antes que o gateway comece a escutar
- quaisquer métodos, ferramentas ou serviços do gateway que devem existir durante essa mesma janela

Se sua entrada completa ainda for dona de qualquer capacidade obrigatória de inicialização, não habilite
esta flag. Mantenha o Plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais incluídos também podem publicar helpers de superfície de contrato exclusivos de configuração que o core
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual de promoção
de configuração é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O núcleo usa essa superfície quando precisa promover uma configuração legada de canal de conta única para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin. Matrix é o exemplo empacotado atual: ele move apenas chaves de autenticação/inicialização para uma conta promovida nomeada quando contas nomeadas já existem, e pode preservar uma chave de conta padrão configurada não canônica em vez de sempre criar `accounts.default`.

Esses adaptadores de patch de configuração mantêm preguiçosa a descoberta da superfície de contrato empacotada. O tempo de importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso em vez de reentrar na inicialização de canal empacotado na importação do módulo.

Quando essas superfícies de inicialização incluírem métodos RPC do Gateway, mantenha-os em um prefixo específico do plugin. Namespaces administrativos do núcleo (`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre são resolvidos para `operator.admin`, mesmo que um plugin solicite um escopo mais estreito.

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

- `detailLabel`: rótulo secundário para superfícies mais ricas de catálogo/status
- `docsLabel`: substitui o texto do link para o link da documentação
- `preferOver`: ids de plugin/canal de menor prioridade que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: inclui o canal no fluxo padrão de início rápido `allowFrom`
- `forceAccountBinding`: exige vinculação explícita de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca de sessão ao resolver destinos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canais** (por exemplo, uma exportação de registro MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O analisador também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

Entradas geradas de catálogo de canais e entradas de catálogo de instalação de provedores expõem fatos normalizados da origem de instalação junto ao bloco bruto `openclaw.install`. Os fatos normalizados identificam se a especificação npm é uma versão exata ou um seletor flutuante, se os metadados de integridade esperados estão presentes e se um caminho de origem local também está disponível. Quando a identidade do catálogo/pacote é conhecida, os fatos normalizados avisam se o nome do pacote npm analisado diverge dessa identidade. Eles também avisam quando `defaultChoice` é inválido ou aponta para uma origem indisponível, e quando metadados de integridade npm estão presentes sem uma origem npm válida. Consumidores devem tratar `installSource` como um campo opcional aditivo para que entradas criadas manualmente e shims de catálogo não precisem sintetizá-lo. Isso permite que o onboarding e os diagnósticos expliquem o estado do plano de origem sem importar o runtime do plugin.

Entradas oficiais externas do npm devem preferir um `npmSpec` exato mais `expectedIntegrity`. Nomes simples de pacotes e dist-tags ainda funcionam por compatibilidade, mas exibem avisos do plano de origem para que o catálogo possa avançar para instalações fixadas e verificadas por integridade sem quebrar plugins existentes. Quando o onboarding instala a partir de um caminho de catálogo local, ele registra uma entrada gerenciada no índice de plugins com `source: "path"` e um `sourcePath` relativo ao workspace quando possível. O caminho absoluto operacional de carregamento permanece em `plugins.load.paths`; o registro de instalação evita duplicar caminhos locais da estação de trabalho na configuração de longa duração. Isso mantém instalações de desenvolvimento local visíveis para os diagnósticos do plano de origem sem adicionar uma segunda superfície bruta de divulgação de caminhos do sistema de arquivos. O índice persistido de plugins `plugins/installs.json` é a fonte da verdade de instalação e pode ser atualizado sem carregar módulos de runtime de plugins. Seu mapa `installRecords` é durável mesmo quando o manifesto de um plugin está ausente ou é inválido; seu array `plugins` é uma visão reconstruível de manifestos.

## Plugins do mecanismo de contexto

Plugins do mecanismo de contexto são responsáveis pela orquestração de contexto de sessão para ingestão, montagem e Compaction. Registre-os a partir do seu plugin com `api.registerContextEngine(id, factory)` e selecione o mecanismo ativo com `plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline de contexto padrão em vez de apenas adicionar busca de memória ou hooks.

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

Se seu mecanismo **não** for responsável pelo algoritmo de Compaction, mantenha `compact()` implementado e delegue-o explicitamente:

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

Quando um plugin precisa de comportamento que não se encaixa na API atual, não contorne o sistema de plugins com um acesso privado. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato do núcleo
   Decida qual comportamento compartilhado o núcleo deve possuir: política, fallback, mesclagem de configuração, ciclo de vida, semântica voltada a canais e formato de helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada útil de capacidade.
3. conecte o núcleo + consumidores de canal/recurso
   Canais e plugins de recurso devem consumir a nova capacidade por meio do núcleo, não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedores
   Plugins de fornecedores então registram seus backends nessa capacidade.
5. adicione cobertura de contrato
   Adicione testes para que a propriedade e o formato de registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar hardcoded à visão de mundo de um único provedor. Consulte o [Livro de Receitas de Capacidades](/pt-BR/plugins/architecture) para uma checklist concreta de arquivos e um exemplo trabalhado.

### Checklist de capacidade

Quando você adiciona uma nova capacidade, a implementação geralmente deve tocar estas superfícies em conjunto:

- tipos de contrato do núcleo em `src/<capability>/types.ts`
- runner/helper de runtime do núcleo em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- conexão do registro de plugins em `src/plugins/registry.ts`
- exposição de runtime de plugin em `src/plugins/runtime/*` quando plugins de recurso/canal precisarem consumi-la
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
- plugins de fornecedores possuem implementações de fornecedores
- plugins de recurso/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita

## Relacionado

- [Arquitetura de plugins](/pt-BR/plugins/architecture) — modelo e formatos públicos de capacidade
- [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths)
- [Configuração do SDK de plugins](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
