---
read_when:
    - Implementando hooks de tempo de execução de provedores, ciclo de vida de canais ou conjuntos de pacotes
    - Depuração da ordem de carregamento do Plugin ou do estado do registro
    - Adicionar uma nova capacidade de Plugin ou um Plugin de mecanismo de contexto
summary: 'Detalhes internos da arquitetura de Plugin: pipeline de carregamento, registro, hooks de runtime, rotas HTTP e tabelas de referência'
title: Aspectos internos da arquitetura de Plugin
x-i18n:
    generated_at: "2026-05-02T05:51:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2de741c4b496c7c3dd31dafebf39c4b9a32c5edd71bdd201c14037d9de31718f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

Para o modelo público de capacidades, formatos de plugins e contratos de propriedade/execução,
consulte [Arquitetura de Plugin](/pt-BR/plugins/architecture). Esta página é a
referência para a mecânica interna: pipeline de carregamento, registro, hooks de runtime,
rotas HTTP do Gateway, caminhos de importação e tabelas de esquema.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de plugins
2. lê manifestos de bundles nativos ou compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a ativação de cada candidato
6. carrega módulos nativos habilitados: módulos integrados compilados usam um carregador nativo;
   código-fonte TypeScript local de terceiros usa o fallback emergencial Jiti
7. chama hooks nativos `register(api)` e coleta registros no registro de plugins
8. expõe o registro a comandos/superfícies de runtime

<Note>
`activate` é um alias legado para `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins integrados usam `register`; prefira `register` para novos plugins.
</Note>

As barreiras de segurança acontecem **antes** da execução de runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do plugin, o caminho é gravável por qualquer usuário, ou a
propriedade do caminho parece suspeita para plugins não integrados.

### Comportamento baseado primeiro no manifesto

O manifesto é a fonte da verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/skills/esquema de configuração declarados ou capacidades de bundle
- validar `plugins.entries.<id>.config`
- complementar rótulos/placeholders da Control UI
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
comportamento real, como hooks, ferramentas, comandos ou fluxos de provedores.

Blocos opcionais de manifesto `activation` e `setup` permanecem no plano de controle.
Eles são descritores apenas de metadados para planejamento de ativação e descoberta de configuração;
eles não substituem o registro de runtime, `register(...)`, nem `setupEntry`.
Os primeiros consumidores de ativação ao vivo agora usam dicas de comando, canal e provedor do manifesto
para restringir o carregamento de plugins antes de uma materialização mais ampla do registro:

- o carregamento da CLI restringe aos plugins que possuem o comando primário solicitado
- a resolução de configuração/plugin de canal restringe aos plugins que possuem o
  id de canal solicitado
- a resolução explícita de configuração/runtime de provedor restringe aos plugins que possuem o
  id de provedor solicitado
- o planejamento de inicialização do Gateway usa `activation.onStartup` para importações explícitas
  de inicialização e exclusões de inicialização; plugins sem metadados de inicialização carregam apenas
  por gatilhos de ativação mais restritos

O planejador de ativação expõe tanto uma API apenas de ids para chamadores existentes quanto uma
API de plano para novos diagnósticos. Entradas do plano informam por que um plugin foi selecionado,
separando dicas explícitas do planejador `activation.*` de fallbacks de propriedade do manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks. Essa separação de motivos é o limite de compatibilidade:
metadados existentes de plugin continuam funcionando, enquanto código novo pode detectar dicas amplas
ou comportamento de fallback sem alterar a semântica de carregamento de runtime.

A descoberta de configuração agora prefere ids pertencentes a descritores, como `setup.providers` e
`setup.cliBackends`, para restringir plugins candidatos antes de recorrer a
`setup-api` para plugins que ainda precisam de hooks de runtime em tempo de configuração. Listas de
configuração de provedores usam `providerAuthChoices` do manifesto, escolhas de configuração derivadas de descritores
e metadados do catálogo de instalação sem carregar o runtime do provedor. `setup.requiresRuntime: false`
explícito é um ponto de corte apenas por descritor; `requiresRuntime` omitido
mantém o fallback legado de setup-api por compatibilidade. Se mais de um plugin descoberto
reivindicar o mesmo provedor de configuração normalizado ou id de backend de CLI, a busca de configuração
recusa o proprietário ambíguo em vez de depender da ordem de descoberta. Quando o runtime de configuração
é executado, diagnósticos do registro relatam divergência entre `setup.providers` / `setup.cliBackends`
e os provedores ou backends de CLI registrados por setup-api sem bloquear plugins legados.

### Limite de cache de Plugin

O OpenClaw não armazena em cache resultados de descoberta de plugins nem dados diretos do registro de manifesto
atrás de janelas de tempo de relógio. Instalações, edições de manifesto e alterações em caminhos de carregamento
devem ficar visíveis na próxima leitura explícita de metadados ou reconstrução de snapshot.
O parser de arquivo de manifesto pode manter um cache limitado de assinatura de arquivo, indexado pelo
caminho de manifesto aberto, inode, tamanho e timestamps; esse cache apenas evita
reanalisar bytes inalterados e não deve armazenar em cache respostas de descoberta, registro, proprietário ou
política.

O caminho rápido seguro de metadados é propriedade explícita de objeto, não um cache oculto.
Caminhos quentes de inicialização do Gateway devem passar o `PluginMetadataSnapshot` atual, a
`PluginLookUpTable` derivada ou um registro explícito de manifesto pela cadeia de chamadas.
Validação de configuração, autoativação na inicialização, bootstrap de plugin e seleção de provedor
podem reutilizar esses objetos enquanto eles representam a configuração atual e o inventário de
plugins. A busca de configuração ainda reconstrói metadados de manifesto sob demanda
a menos que o caminho específico de configuração receba um registro explícito de manifesto; mantenha isso
como fallback de caminho frio em vez de adicionar caches ocultos de busca. Quando a entrada
mudar, reconstrua e substitua o snapshot em vez de mutá-lo ou manter
cópias históricas.
Visualizações sobre o registro ativo de plugins e auxiliares de bootstrap de canais integrados
devem ser recalculadas a partir do registro/raiz atual. Mapas de curta duração são aceitáveis
dentro de uma chamada para deduplicar trabalho ou proteger reentrada; eles não devem se tornar caches
de metadados do processo.

Para carregamento de plugins, a camada de cache persistente é o carregamento de runtime. Ela pode reutilizar
estado do carregador quando código ou artefatos instalados são realmente carregados, como:

- `PluginLoaderCacheState` e registros compatíveis de runtime ativo
- caches jiti/módulo e caches de carregador de superfície pública usados para evitar importar
  a mesma superfície de runtime repetidamente
- caches de sistema de arquivos para artefatos de plugin instalados
- mapas de curta duração por chamada para normalização de caminhos ou resolução de duplicatas

Esses caches são detalhes de implementação do plano de dados. Eles não devem responder
a perguntas do plano de controle como "qual plugin possui este provedor?" a menos que o
chamador tenha solicitado deliberadamente carregamento de runtime.

Não adicione caches persistentes ou baseados em relógio para:

- resultados de descoberta
- registros diretos de manifesto
- registros de manifesto reconstruídos a partir do índice de plugins instalados
- busca de proprietário de provedor, supressão de modelo, política de provedor ou metadados de artefato
  público
- qualquer outra resposta derivada de manifesto em que um manifesto, índice instalado
  ou caminho de carregamento alterado deva estar visível na próxima leitura de metadados

Chamadores que reconstroem metadados de manifesto a partir do índice persistido de plugins
instalados reconstroem esse registro sob demanda. O índice instalado é estado durável
do plano de origem; ele não é um cache oculto de metadados em processo.

## Modelo de registro

Plugins carregados não modificam diretamente globais aleatórios do núcleo. Eles se registram em um
registro central de plugins.

O registro acompanha:

- registros de plugins (identidade, fonte, origem, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- manipuladores RPC do gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos pertencentes a plugins

Recursos do núcleo então leem desse registro em vez de falar diretamente com módulos de plugin.
Isso mantém o carregamento unidirecional:

- módulo de plugin -> registro no registro
- runtime do núcleo -> consumo do registro

Essa separação importa para a manutenibilidade. Ela significa que a maioria das superfícies do núcleo só
precisa de um ponto de integração: "ler o registro", não "tratar cada módulo de plugin
como caso especial".

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

Este callback é apenas de notificação. Ele não altera quem tem permissão para vincular uma
conversa, e é executado depois que o tratamento de aprovação do núcleo termina.

## Hooks de runtime de provedor

Plugins de provedor têm três camadas:

- **Metadados de manifesto** para busca barata pré-runtime:
  `setup.providers[].envVars`, compatibilidade obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hooks em tempo de configuração**: `catalog` (`discovery` legado) mais
  `applyConfigDefaults`.
- **Hooks de runtime**: mais de 40 hooks opcionais cobrindo autenticação, resolução de modelo,
  envelopamento de stream, níveis de raciocínio, política de replay e endpoints de uso. Consulte
  a lista completa em [Ordem e uso dos hooks](#hook-order-and-usage).

O OpenClaw ainda possui o loop genérico de agente, failover, tratamento de transcrições e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de
provedor sem precisar de um transporte de inferência totalmente customizado.

Use `setup.providers[].envVars` do manifesto quando o provedor tiver credenciais baseadas em env
que caminhos genéricos de autenticação/status/seletor de modelos devam ver sem
carregar o runtime do plugin. `providerAuthEnvVars` obsoleto ainda é lido pelo
adaptador de compatibilidade durante a janela de depreciação, e plugins não integrados
que o usam recebem um diagnóstico de manifesto. Use `providerAuthAliases` do manifesto
quando um id de provedor deve reutilizar as env vars, perfis de autenticação,
autenticação baseada em configuração e escolha de onboarding por chave de API de outro id de provedor. Use
`providerAuthChoices` do manifesto quando superfícies de CLI de onboarding/escolha de autenticação devem conhecer o
id de escolha do provedor, rótulos de grupo e fiação simples de autenticação por uma flag
sem carregar o runtime do provedor. Mantenha `envVars` de runtime do provedor
para dicas voltadas ao operador, como rótulos de onboarding ou vars de configuração de
client-id/client-secret OAuth.

Use `channelEnvVars` do manifesto quando um canal tiver autenticação ou configuração baseada em env que
fallback genérico de env do shell, verificações de configuração/status ou prompts de configuração devam ver
sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para plugins de modelo/provedor, o OpenClaw chama hooks nesta ordem aproximada.
A coluna "Quando usar" é o guia rápido de decisão.
Campos de provedor apenas de compatibilidade que o OpenClaw não chama mais, como
`ProviderPlugin.capabilities` e `suppressBuiltInModel`, intencionalmente não são
listados aqui.

| #   | Gancho                            | O que faz                                                                                                      | Quando usar                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                    | O provedor possui um catálogo ou padrões de URL base                                                                                          |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração pertencentes ao provedor durante a materialização da configuração       | Os padrões dependem do modo de autenticação, do ambiente ou da semântica da família de modelos do provedor                                    |
| --  | _(busca de modelo integrada)_      | OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                  | _(não é um gancho de Plugin)_                                                                                                                 |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de pré-visualização de IDs de modelo antes da busca                               | O provedor é responsável pela limpeza de aliases antes da resolução canônica do modelo                                                        |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo                        | O provedor é responsável pela limpeza do transporte para IDs de provedor personalizados na mesma família de transporte                        |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                       | O provedor precisa de limpeza de configuração que deve ficar com o Plugin; helpers agrupados da família Google também dão suporte a entradas de configuração Google compatíveis |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo aos provedores de configuração                 | O provedor precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                               |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de ambiente para provedores de configuração antes do carregamento da autenticação em runtime | O provedor tem resolução de chave de API por marcador de ambiente pertencente ao provedor; `amazon-bedrock` também tem aqui um resolvedor integrado de marcadores de ambiente AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/auto-hospedada ou baseada em configuração sem persistir texto simples                 | O provedor pode operar com um marcador de credencial sintético/local                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis de autenticação externos pertencentes ao provedor; o `persistence` padrão é `runtime-only` para credenciais pertencentes à CLI/app | O provedor reutiliza credenciais de autenticação externas sem persistir tokens de atualização copiados; declare `contracts.externalAuthProviders` no manifesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders de perfil sintético armazenados atrás de autenticação baseada em ambiente/configuração    | O provedor armazena perfis de placeholder sintéticos que não devem ter precedência                                                            |
| 11  | `resolveDynamicModel`             | Fallback síncrono para IDs de modelo pertencentes ao provedor que ainda não estão no registro local            | O provedor aceita IDs de modelo upstream arbitrários                                                                                          |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono; depois, `resolveDynamicModel` é executado novamente                                    | O provedor precisa de metadados de rede antes de resolver IDs desconhecidos                                                                   |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o executor embarcado usar o modelo resolvido                                          | O provedor precisa de reescritas de transporte, mas ainda usa um transporte do núcleo                                                         |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos de fornecedor por trás de outro transporte compatível          | O provedor reconhece seus próprios modelos em transportes proxy sem assumir o provedor                                                        |
| 15  | `normalizeToolSchemas`            | Normaliza esquemas de ferramentas antes de o executor embarcado vê-los                                         | O provedor precisa de limpeza de esquema da família de transporte                                                                             |
| 16  | `inspectToolSchemas`              | Expõe diagnósticos de esquema pertencentes ao provedor após a normalização                                     | O provedor quer avisos de palavras-chave sem ensinar ao núcleo regras específicas do provedor                                                 |
| 17  | `resolveReasoningOutputMode`      | Seleciona o contrato de saída de raciocínio nativo versus marcado                                              | O provedor precisa de raciocínio/saída final marcados em vez de campos nativos                                                                |
| 18  | `prepareExtraParams`              | Normalização de parâmetros de solicitação antes dos wrappers genéricos de opção de stream                      | O provedor precisa de parâmetros de solicitação padrão ou limpeza de parâmetros por provedor                                                  |
| 19  | `createStreamFn`                  | Substitui totalmente o caminho normal de stream por um transporte personalizado                                | O provedor precisa de um protocolo de fio personalizado, não apenas de um wrapper                                                             |
| 20  | `wrapStreamFn`                    | Wrapper de stream após a aplicação dos wrappers genéricos                                                      | O provedor precisa de wrappers de compatibilidade de cabeçalhos/corpo/modelo de solicitação sem um transporte personalizado                   |
| 21  | `resolveTransportTurnState`       | Anexa cabeçalhos ou metadados de transporte nativos por turno                                                  | O provedor quer que transportes genéricos enviem identidade de turno nativa do provedor                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos WebSocket nativos ou política de resfriamento de sessão                                       | O provedor quer que transportes WS genéricos ajustem cabeçalhos de sessão ou política de fallback                                             |
| 23  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado se torna a string `apiKey` em runtime               | O provedor armazena metadados extras de autenticação e precisa de um formato de token de runtime personalizado                                |
| 24  | `refreshOAuth`                    | Substituição de atualização OAuth para endpoints de atualização personalizados ou política de falha de atualização | O provedor não se encaixa nos atualizadores `pi-ai` compartilhados                                                                            |
| 25  | `buildAuthDoctorHint`             | Dica de reparo anexada quando a atualização OAuth falha                                                        | O provedor precisa de orientação de reparo de autenticação pertencente ao provedor após falha de atualização                                  |
| 26  | `matchesContextOverflowError`     | Correspondedor de estouro da janela de contexto pertencente ao provedor                                        | O provedor tem erros brutos de estouro que heurísticas genéricas não captariam                                                                |
| 27  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provedor                                                    | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc                                                      |
| 28  | `isCacheTtlEligible`              | Política de cache de prompt para provedores proxy/backhaul                                                     | O provedor precisa de controle de TTL de cache específico de proxy                                                                            |
| 29  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação de autenticação ausente                                       | O provedor precisa de uma dica de recuperação de autenticação ausente específica do provedor                                                  |
| 30  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                                | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                                |
| 31  | `resolveThinkingProfile`          | Conjunto de níveis `/think` específicos do modelo, rótulos de exibição e padrão                               | O provedor expõe uma escala de pensamento personalizada ou rótulo binário para modelos selecionados                                           |
| 32  | `isBinaryThinking`                | Gancho de compatibilidade de alternância de raciocínio ligado/desligado                                        | O provedor expõe apenas pensamento binário ligado/desligado                                                                                   |
| 33  | `supportsXHighThinking`           | Gancho de compatibilidade de suporte a raciocínio `xhigh`                                                      | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                                   |
| 34  | `resolveDefaultThinkingLevel`     | Gancho de compatibilidade de nível `/think` padrão                                                             | O provedor é responsável pela política padrão de `/think` para uma família de modelos                                                         |
| 35  | `isModernModelRef`                | Correspondedor de modelo moderno para filtros de perfil ao vivo e seleção de smoke                            | O provedor é responsável pela correspondência de modelo preferido ao vivo/smoke                                                               |
| 36  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime imediatamente antes da inferência            | O provedor precisa de uma troca de token ou credencial de solicitação de curta duração                                                        |
| 37  | `resolveUsageAuth`                | Resolver credenciais de uso/cobrança para `/usage` e superfícies de status relacionadas                                     | O provedor precisa de análise personalizada de tokens de uso/cota ou de uma credencial de uso diferente                                                               |
| 38  | `fetchUsageSnapshot`              | Buscar e normalizar snapshots de uso/cota específicos do provedor depois que a autenticação for resolvida                             | O provedor precisa de um endpoint de uso específico do provedor ou de um parser de payload                                                                           |
| 39  | `createEmbeddingProvider`         | Criar um adaptador de embedding pertencente ao provedor para memória/busca                                                     | O comportamento de embedding de memória pertence ao Plugin do provedor                                                                                    |
| 40  | `buildReplayPolicy`               | Retornar uma política de reprodução que controla o tratamento da transcrição para o provedor                                        | O provedor precisa de política de transcrição personalizada (por exemplo, remoção de blocos de pensamento)                                                               |
| 41  | `sanitizeReplayHistory`           | Reescrever o histórico de reprodução após a limpeza genérica da transcrição                                                        | O provedor precisa de reescritas de reprodução específicas do provedor além dos auxiliares compartilhados de Compaction                                                             |
| 42  | `validateReplayTurns`             | Validação final de turnos de reprodução ou remodelagem antes do executor incorporado                                           | O transporte do provedor precisa de validação de turnos mais rigorosa após a sanitização genérica                                                                    |
| 43  | `onModelSelected`                 | Executar efeitos colaterais pós-seleção pertencentes ao provedor                                                                 | O provedor precisa de telemetria ou estado pertencente ao provedor quando um modelo se torna ativo                                                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
Plugin de provedor correspondente e, em seguida, passam por outros Plugins de
provedor compatíveis com hooks até que um deles realmente altere o id do modelo
ou o transporte/configuração. Isso mantém os shims de provedor de alias/compat
funcionando sem exigir que o chamador saiba qual Plugin incluído é responsável
pela reescrita. Se nenhum hook de provedor reescrever uma entrada de configuração
compatível da família Google, o normalizador de configuração Google incluído ainda
aplica essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de fio totalmente personalizado ou de um
executor de requisições personalizado, isso é uma classe diferente de extensão.
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

Plugins de provedores incluídos combinam os hooks acima para se ajustar às
necessidades de catálogo, autenticação, raciocínio, replay e uso de cada
fornecedor. O conjunto autoritativo de hooks fica com cada Plugin em
`extensions/`; esta página ilustra os formatos em vez de espelhar a lista.

<AccordionGroup>
  <Accordion title="Provedores de catálogo pass-through">
    OpenRouter, Kilocode, Z.AI, xAI registram `catalog` mais
    `resolveDynamicModel` / `prepareDynamicModel` para que possam expor ids de
    modelos upstream antes do catálogo estático do OpenClaw.
  </Accordion>
  <Accordion title="Provedores de endpoint OAuth e uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinam
    `prepareRuntimeAuth` ou `formatApiKey` com `resolveUsageAuth` +
    `fetchUsageSnapshot` para assumir a troca de tokens e a integração com
    `/usage`.
  </Accordion>
  <Accordion title="Famílias de replay e limpeza de transcrição">
    Famílias nomeadas compartilhadas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permitem que provedores
    optem pela política de transcrição via `buildReplayPolicy`, em vez de cada
    Plugin reimplementar a limpeza.
  </Accordion>
  <Accordion title="Provedores somente de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registram apenas `catalog` e usam o loop de inferência
    compartilhado.
  </Accordion>
  <Accordion title="Auxiliares de stream específicos da Anthropic">
    Cabeçalhos beta, `/fast` / `serviceTier` e `context1m` ficam dentro da
    fronteira pública `api.ts` / `contract-api.ts` do Plugin da Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) em vez de ficarem
    no SDK genérico.
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

Notas:

- `textToSpeech` retorna o payload normal de saída TTS do core para superfícies de arquivo/nota de voz.
- Usa a configuração core `messages.tts` e a seleção de provedor.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem reamostrar/codificar para provedores.
- `listVoices` é opcional por provedor. Use-o para seletores de voz ou fluxos de configuração pertencentes ao fornecedor.
- Listagens de vozes podem incluir metadados mais ricos, como localidade, gênero e tags de personalidade para seletores conscientes do provedor.
- OpenAI e ElevenLabs dão suporte a telefonia hoje. Microsoft não.

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

Notas:

- Mantenha política de TTS, fallback e entrega de respostas no core.
- Use provedores de fala para comportamento de síntese pertencente ao fornecedor.
- A entrada Microsoft legada `edge` é normalizada para o id de provedor `microsoft`.
- O modelo de propriedade preferido é orientado por empresa: um Plugin de fornecedor pode ser responsável por provedores de texto, fala, imagem e mídia futura à medida que o OpenClaw adiciona esses contratos de capacidade.

Para compreensão de imagem/áudio/vídeo, Plugins registram um provedor tipado de
compreensão de mídia em vez de um pacote genérico chave/valor:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Notas:

- Mantenha orquestração, fallback, configuração e conexão de canais no core.
- Mantenha comportamento de fornecedor no Plugin de provedor.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos de resultado opcionais, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core é responsável pelo contrato de capacidade e pelo auxiliar de runtime
  - Plugins de fornecedores registram `api.registerVideoGenerationProvider(...)`
  - Plugins de funcionalidade/canal consomem `api.runtime.videoGeneration.*`

Para auxiliares de runtime de compreensão de mídia, Plugins podem chamar:

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

Para transcrição de áudio, Plugins podem usar o runtime de compreensão de mídia
ou o alias STT mais antigo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Notas:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferida para compreensão de imagem/áudio/vídeo.
- Usa a configuração de áudio de compreensão de mídia do core (`tools.media.audio`) e a ordem de fallback de provedores.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não compatível).
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

Notas:

- `provider` e `model` são substituições opcionais por execução, não alterações persistentes de sessão.
- O OpenClaw só respeita esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback pertencentes a Plugins, operadores devem optar por habilitar com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir Plugins confiáveis a destinos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer destino.
- Execuções de subagente de Plugins não confiáveis ainda funcionam, mas solicitações de substituição são rejeitadas em vez de caírem silenciosamente em fallback.
- Sessões de subagente criadas por Plugins são marcadas com o id do Plugin criador. O fallback `api.runtime.subagent.deleteSession(...)` pode excluir apenas essas sessões pertencentes a ele; a exclusão arbitrária de sessões ainda requer uma requisição ao Gateway com escopo de administrador.

Para busca na web, Plugins podem consumir o auxiliar de runtime compartilhado em vez
de acessar diretamente a conexão de ferramentas do agente:

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

Notas:

- Mantenha seleção de provedor, resolução de credenciais e semântica de requisições compartilhada no core.
- Use provedores de busca na web para transportes de busca específicos de fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para Plugins de funcionalidade/canal que precisam de comportamento de busca sem depender do wrapper de ferramenta do agente.

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

- `path`: caminho da rota no servidor HTTP do Gateway.
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do Gateway, ou `"plugin"` para autenticação/verificação de Webhook gerenciada pelo Plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo Plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a requisição.

Notas:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento de plugin. Use `api.registerHttpRoute(...)` em vez disso.
- As rotas de Plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com níveis diferentes de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de auth.
- Rotas `auth: "plugin"` **não** recebem escopos de runtime do operador automaticamente. Elas são para webhooks/verificação de assinatura gerenciados pelo plugin, não para chamadas privilegiadas de helpers do Gateway.
- Rotas `auth: "gateway"` são executadas dentro de um escopo de runtime de solicitação do Gateway, mas esse escopo é intencionalmente conservador:
  - auth de bearer com segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém os escopos de runtime de rotas de plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis que carregam identidade (por exemplo `trusted-proxy` ou `gateway.auth.mode = "none"` em um ingresso privado) respeitam `x-openclaw-scopes` apenas quando o cabeçalho está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas solicitações de rota de plugin que carregam identidade, o escopo de runtime volta para `operator.write`
- Regra prática: não presuma que uma rota de plugin com auth de gateway seja uma superfície administrativa implícita. Se sua rota precisa de comportamento exclusivo para administradores, exija um modo de auth que carregue identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.

## Caminhos de importação do SDK de Plugin

Use subcaminhos estreitos do SDK em vez do barrel raiz monolítico `openclaw/plugin-sdk`
ao criar novos plugins. Subcaminhos principais:

| Subcaminho                          | Finalidade                                         |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivos de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Helpers de entrada/build de canal                  |
| `openclaw/plugin-sdk/core`          | Helpers compartilhados genéricos e contrato guarda-chuva |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |

Plugins de canal escolhem entre uma família de seams estreitos — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve ser consolidado
em um único contrato `approvalCapability`, em vez de misturar campos de plugin
não relacionados. Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

Helpers de runtime e configuração ficam sob subcaminhos `*-runtime` focados correspondentes
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime`, etc.). Prefira `config-types`,
`plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation`
em vez do barrel amplo de compatibilidade `config-runtime`.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`
e `openclaw/plugin-sdk/infra-runtime` são shims de compatibilidade obsoletos para
plugins mais antigos. Código novo deve importar primitivos genéricos mais estreitos.
</Info>

Pontos de entrada internos do repositório (por raiz de pacote de plugin incluído):

- `index.js` — entrada de plugin incluído
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel somente de runtime
- `setup-entry.js` — entrada de plugin de setup

Plugins externos devem importar apenas subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe o `src/*` de outro pacote de plugin a partir do core ou de outro plugin.
Pontos de entrada carregados por fachada preferem o snapshot ativo da configuração de runtime quando ele
existe; depois recorrem ao arquivo de configuração resolvido em disco.

Subcaminhos específicos de capability, como `image-generation`, `media-understanding`
e `speech`, existem porque plugins incluídos os usam hoje. Eles não são
automaticamente contratos externos congelados de longo prazo — verifique a página de referência
do SDK relevante ao depender deles.

## Esquemas da ferramenta de mensagem

Plugins devem ser donos das contribuições de esquema `describeMessageTool(...)`
específicas do canal para primitivos que não são mensagens, como reações, leituras e enquetes.
A apresentação compartilhada de envio deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos do provedor para botão, componente, bloco ou card.
Consulte [Apresentação de Mensagens](/pt-BR/plugins/message-presentation) para o contrato,
regras de fallback, mapeamento de provedor e checklist do autor do plugin.

Plugins com capacidade de envio declaram o que conseguem renderizar por meio de capabilities de mensagem:

- `presentation` para blocos de apresentação semânticos (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O core decide se renderiza a apresentação nativamente ou a degrada para texto.
Não exponha escapes de UI nativos do provedor pela ferramenta genérica de mensagem.
Helpers obsoletos do SDK para esquemas nativos legados continuam exportados para
plugins de terceiros existentes, mas plugins novos não devem usá-los.

## Resolução de destino de canal

Plugins de canal devem ser donos da semântica de destino específica do canal. Mantenha o host
de saída compartilhado genérico e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca no diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve ir direto para a resolução parecida com id em vez de pesquisa no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando
  o core precisa de uma resolução final de propriedade do provedor após a normalização ou após uma
  ausência no diretório.
- `messaging.resolveOutboundSessionRoute(...)` é dono da construção de rota de sessão
  específica do provedor depois que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes de
  pesquisar peers/grupos.
- Use `looksLikeId` para verificações de "trate isto como um id de destino explícito/nativo".
- Use `resolveTarget` para fallback de normalização específica do provedor, não para
  pesquisa ampla no diretório.
- Mantenha ids nativos do provedor, como ids de chat, ids de thread, JIDs, handles e ids de sala,
  dentro de valores `target` ou parâmetros específicos do provedor, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
plugin e reutilizar os helpers compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de peers/grupos baseados em configuração, como:

- peers de DM orientados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de diretório com escopo de conta

Os helpers compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consulta
- aplicação de limite
- helpers de desduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

A inspeção de conta específica do canal e a normalização de id devem permanecer na
implementação do plugin.

## Catálogos de provedor

Plugins de provedor podem definir catálogos de modelo para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para várias entradas de provedor

Use `catalog` quando o plugin for dono de ids de modelo específicos do provedor, padrões
de URL base ou metadados de modelo protegidos por auth.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos provedores
implícitos integrados do OpenClaw:

- `simple`: provedores simples orientados por chave de API ou env
- `profile`: provedores que aparecem quando existem perfis de auth
- `paired`: provedores que sintetizam várias entradas de provedor relacionadas
- `late`: último passe, após outros provedores implícitos

Provedores posteriores vencem em colisão de chave, então plugins podem substituir intencionalmente uma
entrada de provedor integrada com o mesmo id de provedor.

Compatibilidade:

- `discovery` ainda funciona como alias legado
- se `catalog` e `discovery` forem registrados, o OpenClaw usa `catalog`

## Inspeção somente leitura de canal

Se seu plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto de `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode presumir que as credenciais
  estão totalmente materializadas e pode falhar rápido quando segredos obrigatórios estiverem ausentes.
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
  é suficiente para comandos no estilo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura relatem "configurado, mas indisponível neste caminho de comando"
em vez de travar ou informar incorretamente que a conta não está configurada.

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

Cada entrada se torna um plugin. Se o pack listar várias extensões, o id do plugin
se torna `name/<fileBase>`.

Se seu plugin importar deps do npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Limite de segurança: toda entrada de `openclaw.extensions` deve permanecer dentro do diretório do plugin
após a resolução de symlink. Entradas que escapam do diretório do pacote são
rejeitadas.

Nota de segurança: `openclaw plugins install` instala dependências de plugin com um
`npm install --omit=dev --ignore-scripts` local do projeto (sem scripts de ciclo de vida,
sem dependências de dev em runtime), ignorando configurações globais herdadas de instalação do npm.
Mantenha árvores de dependência de plugin "JS/TS puro" e evite pacotes que exijam
builds `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve somente de setup.
Quando o OpenClaw precisa de superfícies de setup para um plugin de canal desabilitado, ou
quando um plugin de canal está habilitado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso deixa a inicialização e o setup mais leves
quando sua entrada principal de plugin também conecta ferramentas, hooks ou outro código
somente de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode colocar um plugin de canal no mesmo caminho `setupEntry` durante a fase de inicialização
pré-listen do gateway, mesmo quando o canal já está configurado.

Use isso apenas quando `setupEntry` cobrir totalmente a superfície de inicialização que precisa existir
antes que o gateway comece a escutar. Na prática, isso significa que a entrada de setup
deve registrar toda capability de propriedade do canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que devem estar disponíveis antes que o gateway comece a escutar
- quaisquer métodos, ferramentas ou serviços do gateway que devem existir durante essa mesma janela

Se sua entrada completa ainda for dona de qualquer capability de inicialização obrigatória, não habilite
esta flag. Mantenha o plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais incluídos também podem publicar helpers de superfície de contrato somente de setup que o core
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual de promoção
de setup é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O core usa essa superfície quando precisa promover uma configuração de canal legada de conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
Matrix é o exemplo empacotado atual: ele move apenas chaves de autenticação/bootstrap para uma
conta promovida nomeada quando contas nomeadas já existem, e pode preservar uma
chave de conta padrão não canônica configurada em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de configuração mantêm preguiçosa a descoberta da superfície de contrato empacotada. O tempo de importação
permanece leve; a superfície de promoção é carregada apenas no primeiro uso, em vez de
reentrar na inicialização de canais empacotados na importação do módulo.

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

- `detailLabel`: rótulo secundário para superfícies de catálogo/status mais ricas
- `docsLabel`: substitui o texto do link para o link da documentação
- `preferOver`: ids de plugin/canal de prioridade menor que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: inclui o canal no fluxo padrão de quickstart `allowFrom`
- `forceAccountBinding`: exige associação explícita de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca de sessão ao resolver destinos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canais** (por exemplo, uma exportação de registro MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

Entradas geradas do catálogo de canais e entradas do catálogo de instalação de provedores expõem
fatos normalizados de origem de instalação ao lado do bloco bruto `openclaw.install`. Os
fatos normalizados identificam se a especificação npm é uma versão exata ou um seletor
flutuante, se os metadados de integridade esperados estão presentes e se um caminho de origem
local também está disponível. Quando a identidade do catálogo/pacote é conhecida, os
fatos normalizados avisam se o nome do pacote npm analisado diverge dessa identidade.
Eles também avisam quando `defaultChoice` é inválido ou aponta para uma origem que
não está disponível, e quando metadados de integridade npm estão presentes sem uma origem npm
válida. Consumidores devem tratar `installSource` como um campo opcional aditivo para que
entradas criadas manualmente e shims de catálogo não precisem sintetizá-lo.
Isso permite que onboarding e diagnósticos expliquem o estado do plano de origem sem
importar o runtime do plugin.

Entradas npm externas oficiais devem preferir um `npmSpec` exato mais
`expectedIntegrity`. Nomes simples de pacotes e dist-tags ainda funcionam por
compatibilidade, mas exibem avisos do plano de origem para que o catálogo possa avançar
em direção a instalações fixadas e verificadas por integridade sem quebrar plugins existentes.
Quando o onboarding instala a partir de um caminho de catálogo local, ele registra uma entrada gerenciada
de índice de plugins com `source: "path"` e um `sourcePath` relativo ao workspace
quando possível. O caminho operacional absoluto de carregamento permanece em
`plugins.load.paths`; o registro de instalação evita duplicar caminhos da estação de trabalho local
na configuração de longa duração. Isso mantém instalações de desenvolvimento local visíveis para
diagnósticos do plano de origem sem adicionar uma segunda superfície bruta de divulgação de caminhos do sistema de arquivos.
O índice persistido de plugins `plugins/installs.json` é a fonte da verdade de instalação
e pode ser atualizado sem carregar módulos de runtime de plugin.
Seu mapa `installRecords` é durável mesmo quando um manifesto de plugin está ausente ou
inválido; seu array `plugins` é uma visualização reconstruível do manifesto.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto controlam a orquestração do contexto de sessão para ingestão, montagem
e compactação. Registre-os a partir do seu plugin com
`api.registerContextEngine(id, factory)` e então selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline de contexto padrão,
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

Se o seu mecanismo **não** controla o algoritmo de compactação, mantenha `compact()`
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

Quando um plugin precisa de um comportamento que não se encaixa na API atual, não contorne
o sistema de plugins com um acesso privado interno. Adicione a capability ausente.

Sequência recomendada:

1. defina o contrato do core
   Decida qual comportamento compartilhado o core deve controlar: política, fallback, mesclagem de configuração,
   ciclo de vida, semântica voltada a canais e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada
   útil de capability.
3. conecte o core + consumidores de canal/feature
   Canais e plugins de feature devem consumir a nova capability através do core,
   não importando uma implementação de fornecedor diretamente.
4. registre implementações de fornecedores
   Plugins de fornecedores então registram seus backends para a capability.
5. adicione cobertura de contrato
   Adicione testes para que a propriedade e o formato de registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar hardcoded à visão de mundo de um
provedor. Consulte o [Cookbook de Capability](/pt-BR/plugins/architecture)
para uma checklist concreta de arquivos e um exemplo trabalhado.

### Checklist de capability

Ao adicionar uma nova capability, a implementação geralmente deve tocar estas
superfícies em conjunto:

- tipos de contrato do core em `src/<capability>/types.ts`
- helper de executor/runtime do core em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- fiação do registro de plugins em `src/plugins/registry.ts`
- exposição de runtime de plugin em `src/plugins/runtime/*` quando plugins de feature/canal
  precisarem consumi-la
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

- o core controla o contrato da capability + a orquestração
- plugins de fornecedores controlam implementações de fornecedores
- plugins de feature/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita

## Relacionados

- [Arquitetura de plugins](/pt-BR/plugins/architecture) — modelo público de capability e formatos
- [Subcaminhos do SDK de plugins](/pt-BR/plugins/sdk-subpaths)
- [Configuração do SDK de plugins](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
