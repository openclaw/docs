---
read_when:
    - Implementando hooks de runtime de provedor, ciclo de vida de canal ou packs de pacote
    - Depurando ordem de carregamento de plugins ou estado do registry
    - Adicionando uma nova capacidade de plugin ou plugin de mecanismo de contexto
summary: 'Arquitetura interna de plugins: pipeline de carregamento, registry, hooks de runtime, rotas HTTP e tabelas de referência'
title: Arquitetura interna de plugins
x-i18n:
    generated_at: "2026-04-26T11:33:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Para o modelo público de capacidades, formatos de plugin e contratos de
propriedade/execução, consulte [Arquitetura de plugins](/pt-BR/plugins/architecture). Esta página é a
referência para a mecânica interna: pipeline de carregamento, registry, hooks de runtime,
rotas HTTP do Gateway, caminhos de importação e tabelas de esquema.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de plugin
2. lê manifestos nativos ou de bundles compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega módulos nativos habilitados: módulos empacotados compilados usam um carregador nativo;
   plugins nativos não compilados usam jiti
7. chama hooks nativos `register(api)` e coleta registros no registry de plugins
8. expõe o registry para comandos/superfícies de runtime

<Note>
`activate` é um alias legado de `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins empacotados usam `register`; prefira `register` para novos plugins.
</Note>

As barreiras de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do plugin, o caminho é gravável por qualquer usuário ou a
propriedade do caminho parece suspeita para plugins não empacotados.

### Comportamento manifest-first

O manifesto é a fonte de verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/Skills/esquema de configuração declarados ou capacidades do bundle
- validar `plugins.entries.<id>.config`
- aumentar rótulos/placeholders da Control UI
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
o comportamento real, como hooks, ferramentas, comandos ou fluxos de provedor.

Blocos opcionais de manifesto `activation` e `setup` permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de configuração;
não substituem registro em runtime, `register(...)` ou `setupEntry`.
Os primeiros consumidores de ativação ao vivo agora usam dicas de manifesto de comando, canal e provedor
para restringir o carregamento de plugins antes de uma materialização mais ampla do registry:

- o carregamento da CLI é restringido a plugins que possuem o comando principal solicitado
- a resolução de configuração de canal/plugin é restringida a plugins que possuem o
  id de canal solicitado
- a resolução explícita de configuração/runtime de provedor é restringida a plugins que possuem o
  id de provedor solicitado

O planejador de ativação expõe tanto uma API apenas de ids para chamadores existentes quanto uma
API de plano para novos diagnósticos. Entradas de plano informam por que um plugin foi selecionado,
separando dicas explícitas do planejador `activation.*` do fallback de propriedade do manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks. Essa divisão de motivo é o limite de compatibilidade:
metadados existentes de plugin continuam funcionando, enquanto novo código pode detectar dicas amplas
ou comportamento de fallback sem alterar a semântica de carregamento em runtime.

A descoberta de setup agora prefere ids pertencentes ao descritor, como `setup.providers` e
`setup.cliBackends`, para restringir plugins candidatos antes de recorrer a
`setup-api` para plugins que ainda precisam de hooks de runtime em tempo de configuração. Listas de setup
de provedor usam `providerAuthChoices` do manifesto, escolhas de setup derivadas do descritor
e metadados de catálogo de instalação sem carregar o runtime do provedor. `setup.requiresRuntime: false`
explícito é um corte somente de descritor; `requiresRuntime` omitido mantém o fallback legado
de `setup-api` para compatibilidade. Se mais de um plugin descoberto reivindicar o mesmo id normalizado
de provedor de setup ou backend CLI, a busca de setup recusa o proprietário ambíguo em vez de depender
da ordem de descoberta. Quando o runtime de setup realmente executa, diagnósticos do registry relatam
divergência entre `setup.providers` / `setup.cliBackends` e os provedores ou backends CLI
registrados por setup-api sem bloquear plugins legados.

### O que o carregador coloca em cache

O OpenClaw mantém caches curtos em processo para:

- resultados de descoberta
- dados do registry de manifestos
- registries de plugin carregados

Esses caches reduzem inicialização em rajadas e overhead de comandos repetidos. É seguro
pensar neles como caches de desempenho de curta duração, não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desabilitar esses caches.
- Ajuste as janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registry

Plugins carregados não mutam diretamente globais aleatórios do núcleo. Eles se registram em um
registry central de plugins.

O registry rastreia:

- registros de plugin (identidade, source, origin, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- handlers RPC do gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos pertencentes ao plugin

Os recursos principais então leem desse registry em vez de falar diretamente com módulos de plugin.
Isso mantém o carregamento em um único sentido:

- módulo de plugin -> registro no registry
- runtime principal -> consumo do registry

Essa separação é importante para a manutenção. Isso significa que a maioria das superfícies do núcleo precisa
de apenas um ponto de integração: "ler o registry", não "criar caso especial para cada módulo de plugin".

## Callbacks de vinculação de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback após uma solicitação de vínculo
ser aprovada ou negada:

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
- `request`: o resumo da solicitação original, dica de detach, id do remetente e
  metadados da conversa

Esse callback é apenas de notificação. Ele não altera quem tem permissão para vincular uma
conversa, e é executado depois que o tratamento principal de aprovação termina.

## Hooks de runtime de provedor

Plugins de provedor têm três camadas:

- **Metadados do manifesto** para lookup barato antes do runtime:
  `setup.providers[].envVars`, compatibilidade obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hooks em tempo de configuração**: `catalog` (legado `discovery`) mais
  `applyConfigDefaults`.
- **Hooks de runtime**: mais de 40 hooks opcionais cobrindo autenticação, resolução de modelo,
  encapsulamento de stream, níveis de thinking, política de replay e endpoints de uso. Consulte
  a lista completa em [Ordem e uso de hooks](#hook-order-and-usage).

O OpenClaw ainda é dono do loop genérico do agente, failover, tratamento de transcript e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico
de provedor sem precisar de um transporte de inferência totalmente personalizado.

Use `setup.providers[].envVars` do manifesto quando o provedor tiver credenciais baseadas em env que caminhos genéricos de autenticação/status/seletor de modelo devem enxergar sem carregar o runtime do plugin. `providerAuthEnvVars` obsoleto ainda é lido pelo adaptador de compatibilidade durante a janela de descontinuação, e plugins não empacotados que o usam recebem um diagnóstico de manifesto. Use `providerAuthAliases` do manifesto quando um id de provedor precisar reutilizar variáveis de ambiente, perfis de autenticação, autenticação baseada em configuração e escolha de onboarding por chave de API de outro id de provedor. Use `providerAuthChoices` do manifesto quando superfícies de onboarding/escolha de autenticação da CLI precisarem conhecer o id de escolha do provedor, rótulos de grupo e cabeamento simples de autenticação com uma flag sem carregar o runtime do provedor. Mantenha `envVars` do runtime do provedor
para dicas voltadas ao operador, como rótulos de onboarding ou variáveis de configuração de
client id/client secret de OAuth.

Use `channelEnvVars` do manifesto quando um canal tiver autenticação ou setup orientado por env que
fallback genérico de env do shell, verificações de config/status ou prompts de setup devem enxergar
sem carregar o runtime do canal.

### Ordem e uso de hooks

Para plugins de modelo/provedor, o OpenClaw chama hooks aproximadamente nesta ordem.
A coluna "Quando usar" é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                   | O provedor é dono de um catálogo ou de padrões de URL base                                                                                    |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração pertencentes ao provedor durante a materialização da configuração      | Os padrões dependem do modo de autenticação, env ou semântica da família de modelos do provedor                                              |
| --  | _(built-in model lookup)_         | O OpenClaw tenta primeiro o caminho normal de registry/catálogo                                                | _(não é um hook de plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de preview de id de modelo antes do lookup                                       | O provedor é dono da limpeza de aliases antes da resolução canônica do modelo                                                                 |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo                      | O provedor é dono da limpeza de transporte para ids personalizados de provedor na mesma família de transporte                                |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                      | O provedor precisa de limpeza de configuração que deve viver com o plugin; helpers empacotados da família Google também dão suporte a entradas de configuração Google compatíveis |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo a provedores de configuração                 | O provedor precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                              |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de env para provedores de configuração antes do carregamento de autenticação em runtime | O provedor tem resolução de chave de API por marcador de env pertencente ao provedor; `amazon-bedrock` também tem aqui um resolvedor integrado de marcador de env da AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/auto-hospedada ou baseada em configuração sem persistir texto simples                | O provedor pode operar com um marcador de credencial sintética/local                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis externos de autenticação pertencentes ao provedor; o padrão de `persistence` é `runtime-only` para credenciais de CLI/app | O provedor reutiliza credenciais externas de autenticação sem persistir tokens de refresh copiados; declare `contracts.externalAuthProviders` no manifesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders sintéticos de perfil armazenados atrás de autenticação baseada em env/config             | O provedor armazena perfis placeholder sintéticos que não devem vencer a precedência                                                         |
| 11  | `resolveDynamicModel`             | Fallback síncrono para ids de modelo pertencentes ao provedor que ainda não estão no registry local          | O provedor aceita ids arbitrários de modelo upstream                                                                                          |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono; depois `resolveDynamicModel` executa novamente                                        | O provedor precisa de metadados de rede antes de resolver ids desconhecidos                                                                   |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o runner incorporado usar o modelo resolvido                                         | O provedor precisa de reescritas de transporte, mas ainda usa um transporte do núcleo                                                        |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos de fornecedor por trás de outro transporte compatível         | O provedor reconhece seus próprios modelos em transportes proxy sem assumir o controle do provedor                                           |
| 15  | `capabilities`                    | Metadados de transcript/ferramentas pertencentes ao provedor usados pela lógica compartilhada do núcleo      | O provedor precisa de particularidades de transcript/família de provedor                                                                      |
| 16  | `normalizeToolSchemas`            | Normaliza esquemas de ferramentas antes de o runner incorporado vê-los                                        | O provedor precisa de limpeza de esquema da família de transporte                                                                             |
| 17  | `inspectToolSchemas`              | Expõe diagnósticos de esquema pertencentes ao provedor após a normalização                                    | O provedor quer avisos de palavra-chave sem ensinar regras específicas de provedor ao núcleo                                                 |
| 18  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo vs marcado                                                   | O provedor precisa de raciocínio/saída final marcados em vez de campos nativos                                                               |
| 19  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes de wrappers genéricos de opções de stream                     | O provedor precisa de parâmetros padrão de requisição ou limpeza de parâmetros por provedor                                                  |
| 20  | `createStreamFn`                  | Substitui completamente o caminho normal de stream por um transporte personalizado                            | O provedor precisa de um protocolo de wire personalizado, não apenas de um wrapper                                                           |
| 21  | `wrapStreamFn`                    | Wrapper de stream depois que wrappers genéricos são aplicados                                                 | O provedor precisa de wrappers de compatibilidade para headers/corpo/modelo da requisição sem um transporte personalizado                    |
| 22  | `resolveTransportTurnState`       | Anexa headers ou metadados nativos por turno de transporte                                                    | O provedor quer que transportes genéricos enviem identidade de turno nativa do provedor                                                      |
| 23  | `resolveWebSocketSessionPolicy`   | Anexa headers nativos de WebSocket ou política de cooldown de sessão                                          | O provedor quer que transportes WS genéricos ajustem headers de sessão ou política de fallback                                               |
| 24  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado se torna a string `apiKey` de runtime              | O provedor armazena metadados extras de autenticação e precisa de um formato de token personalizado em runtime                               |
| 25  | `refreshOAuth`                    | Substituição de refresh de OAuth para endpoints personalizados de refresh ou política de falha de refresh    | O provedor não se encaixa nos refreshers compartilhados de `pi-ai`                                                                            |
| 26  | `buildAuthDoctorHint`             | Dica de reparo anexada quando o refresh de OAuth falha                                                        | O provedor precisa de orientação de reparo de autenticação pertencente ao provedor após falha de refresh                                     |
| 27  | `matchesContextOverflowError`     | Matcher pertencente ao provedor para estouro de janela de contexto                                            | O provedor tem erros brutos de overflow que heurísticas genéricas deixariam passar                                                           |
| 28  | `classifyFailoverReason`          | Classificação pertencente ao provedor para motivo de failover                                                 | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc                                                     |
| 29  | `isCacheTtlEligible`              | Política de cache de prompt para provedores proxy/backhaul                                                    | O provedor precisa de controle específico de proxy para TTL de cache                                                                          |
| 30  | `buildMissingAuthMessage`         | Substituição para a mensagem genérica de recuperação de autenticação ausente                                  | O provedor precisa de uma dica específica do provedor para recuperação de autenticação ausente                                               |
| 31  | `suppressBuiltInModel`            | Supressão de modelo upstream obsoleto mais dica opcional de erro voltada ao usuário                          | O provedor precisa ocultar linhas upstream obsoletas ou substituí-las por uma dica do fornecedor                                             |
| 32  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                               | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                               |
| 33  | `resolveThinkingProfile`          | Conjunto de níveis de `/think` específico do modelo, rótulos de exibição e padrão                            | O provedor expõe uma escada de thinking personalizada ou rótulo binário para modelos selecionados                                            |
| 34  | `isBinaryThinking`                | Hook de compatibilidade para toggle de raciocínio ligado/desligado                                            | O provedor expõe apenas thinking binário ligado/desligado                                                                                     |
| 35  | `supportsXHighThinking`           | Hook de compatibilidade para suporte a raciocínio `xhigh`                                                     | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                                   |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidade para nível padrão de `/think`                                                         | O provedor é dono da política padrão de `/think` para uma família de modelos                                                                 |
| 37  | `isModernModelRef`                | Matcher de modelo moderno para filtros de perfil ao vivo e seleção de smoke                                   | O provedor é dono da correspondência de modelo preferido para live/smoke                                                                      |
| 38  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime logo antes da inferência                    | O provedor precisa de uma troca de token ou credencial de requisição de curta duração                                                         |
| 39  | `resolveUsageAuth`                | Resolve credenciais de uso/cobrança para `/usage` e superfícies de status relacionadas                        | O provedor precisa de parsing personalizado de token de uso/cota ou de uma credencial de uso diferente                                       |
| 40  | `fetchUsageSnapshot`              | Busca e normaliza snapshots específicos de uso/cota do provedor depois que a autenticação é resolvida        | O provedor precisa de um endpoint de uso específico do provedor ou de um parser de payload                                                    |
| 41  | `createEmbeddingProvider`         | Constrói um adaptador de embeddings pertencente ao provedor para memória/busca                                | O comportamento de embeddings de memória pertence ao plugin do provedor                                                                       |
| 42  | `buildReplayPolicy`               | Retorna uma política de replay controlando o tratamento do transcript para o provedor                         | O provedor precisa de política personalizada de transcript (por exemplo, remoção de blocos de thinking)                                      |
| 43  | `sanitizeReplayHistory`           | Reescreve o histórico de replay após a limpeza genérica do transcript                                         | O provedor precisa de reescritas específicas do provedor para replay além dos helpers compartilhados de Compaction                           |
| 44  | `validateReplayTurns`             | Validação final ou remodelagem de turnos de replay antes do runner incorporado                                | O transporte do provedor precisa de validação mais estrita de turnos após a sanitização genérica                                             |
| 45  | `onModelSelected`                 | Executa efeitos colaterais pertencentes ao provedor após a seleção                                            | O provedor precisa de telemetria ou estado pertencente ao provedor quando um modelo se torna ativo                                           |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
plugin de provedor correspondente, depois passam por outros plugins de provedor com capacidade de hook
até que um realmente altere o id do modelo ou o transporte/configuração. Isso mantém
funcionando shims de alias/compatibilidade de provedor sem exigir que o chamador saiba qual
plugin empacotado é dono da reescrita. Se nenhum hook de provedor reescrever uma entrada de configuração
compatível da família Google, o normalizador empacotado de configuração do Google ainda aplica
essa limpeza de compatibilidade.

Se o provedor precisa de um protocolo de wire totalmente personalizado ou de um executor de requisição personalizado,
essa é uma classe diferente de extensão. Esses hooks são para comportamento de provedor
que ainda roda no loop normal de inferência do OpenClaw.

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

Plugins empacotados de provedor combinam os hooks acima para atender às necessidades de catálogo,
autenticação, thinking, replay e uso de cada fornecedor. O conjunto autoritativo de hooks fica com
cada plugin em `extensions/`; esta página ilustra os formatos em vez de
espelhar a lista.

<AccordionGroup>
  <Accordion title="Provedores de catálogo pass-through">
    OpenRouter, Kilocode, Z.AI, xAI registram `catalog` mais
    `resolveDynamicModel` / `prepareDynamicModel` para que possam expor ids
    de modelos upstream antes do catálogo estático do OpenClaw.
  </Accordion>
  <Accordion title="Provedores de OAuth e endpoint de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai combinam
    `prepareRuntimeAuth` ou `formatApiKey` com `resolveUsageAuth` +
    `fetchUsageSnapshot` para controlar a troca de token e a integração com `/usage`.
  </Accordion>
  <Accordion title="Famílias de replay e limpeza de transcript">
    Famílias nomeadas compartilhadas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permitem que provedores façam opt-in
    na política de transcript via `buildReplayPolicy` em vez de cada plugin
    reimplementar a limpeza.
  </Accordion>
  <Accordion title="Provedores somente de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registram apenas `catalog` e usam o loop compartilhado de inferência.
  </Accordion>
  <Accordion title="Helpers de stream específicos da Anthropic">
    Headers beta, `/fast` / `serviceTier` e `context1m` ficam dentro da
    costura pública `api.ts` / `contract-api.ts` do plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) em vez de no
    SDK genérico.
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

- `textToSpeech` retorna a carga normal de saída de TTS do núcleo para superfícies de arquivo/nota de voz.
- Usa a configuração `messages.tts` do núcleo e seleção de provedor.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem fazer resample/codificação para provedores.
- `listVoices` é opcional por provedor. Use para seletores de voz pertencentes ao fornecedor ou fluxos de setup.
- Listagens de voz podem incluir metadados mais ricos, como localidade, gênero e tags de personalidade para seletores com reconhecimento do provedor.
- OpenAI e ElevenLabs oferecem suporte a telephony hoje. Microsoft não.

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
- A entrada legada `edge` da Microsoft é normalizada para o id de provedor `microsoft`.
- O modelo de propriedade preferido é orientado à empresa: um plugin de fornecedor pode controlar
  provedores de texto, fala, imagem e futuros provedores de mídia à medida que o OpenClaw adiciona esses
  contratos de capacidade.

Para entendimento de imagem/áudio/vídeo, plugins registram um único
provedor tipado de entendimento de mídia em vez de um saco genérico de chave/valor:

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

- Mantenha orquestração, fallback, configuração e ligação de canal no núcleo.
- Mantenha o comportamento do fornecedor no plugin do provedor.
- A expansão aditiva deve continuar tipada: novos métodos opcionais, novos campos de resultado opcionais, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o núcleo é dono do contrato de capacidade e do helper de runtime
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

Para transcrição de áudio, plugins podem usar tanto o runtime de entendimento de mídia
quanto o alias STT mais antigo:

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
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo entrada ignorada/não suportada).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como um alias de compatibilidade.

Plugins também podem iniciar execuções de subagente em segundo plano via `api.runtime.subagent`:

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
- Para execuções de fallback pertencentes ao plugin, operadores devem fazer opt-in com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de plugins não confiáveis continuam funcionando, mas solicitações de substituição são rejeitadas em vez de cair silenciosamente em fallback.

Para busca na web, plugins podem consumir o helper compartilhado de runtime em vez de
entrar no encadeamento da ferramenta do agente:

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

- Mantenha seleção de provedor, resolução de credenciais e semântica compartilhada de requisição no núcleo.
- Use provedores de busca na web para transportes de busca específicos do fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para plugins de recurso/canal que precisam de comportamento de busca sem depender do wrapper da ferramenta do agente.

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
- `listProviders(...)`: lista provedores disponíveis de geração de imagem e suas capacidades.

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
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway, ou `"plugin"` para autenticação/validação de Webhook gerenciada pelo plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a requisição.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará erro de carregamento do plugin. Use `api.registerHttpRoute(...)`.
- Rotas de plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com níveis diferentes de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de autenticação.
- Rotas `auth: "plugin"` **não** recebem automaticamente escopos de runtime de operator. Elas são para Webhooks gerenciados por plugin/validação de assinatura, não para chamadas privilegiadas de helper do Gateway.
- Rotas `auth: "gateway"` executam dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém escopos de runtime de rota de plugin fixados em `operator.write`, mesmo se o chamador enviar `x-openclaw-scopes`
  - modos HTTP confiáveis baseados em identidade (por exemplo `trusted-proxy` ou `gateway.auth.mode = "none"` em um ingresso privado) respeitam `x-openclaw-scopes` somente quando o header está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas requisições de rota de plugin baseadas em identidade, o escopo de runtime usa fallback para `operator.write`
- Regra prática: não assuma que uma rota de plugin autenticada pelo gateway seja implicitamente uma superfície de admin. Se sua rota precisar de comportamento somente admin, exija um modo de autenticação baseado em identidade e documente o contrato explícito do header `x-openclaw-scopes`.

## Caminhos de importação do SDK de plugin

Use subcaminhos estreitos do SDK em vez do barrel raiz monolítico `openclaw/plugin-sdk`
ao criar novos plugins. Subcaminhos principais:

| Subcaminho                         | Finalidade                                         |
| ---------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Helpers de entrada/construção de canal             |
| `openclaw/plugin-sdk/core`          | Helpers compartilhados genéricos e contrato guarda-chuva |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod da raiz de `openclaw.json` (`OpenClawSchema`) |

Plugins de canal escolhem a partir de uma família de costuras estreitas — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve se consolidar
em um único contrato `approvalCapability` em vez de misturar campos de plugin não relacionados.
Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

Helpers de runtime e configuração ficam em subcaminhos `*-runtime`
correspondentes (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` está obsoleto — é um shim de compatibilidade para
plugins mais antigos. Código novo deve importar primitivas genéricas mais estreitas.
</Info>

Pontos de entrada internos do repositório (por raiz de pacote de plugin empacotado):

- `index.js` — entrada de plugin empacotado
- `api.js` — barrel de helper/tipos
- `runtime-api.js` — barrel somente de runtime
- `setup-entry.js` — entrada de plugin de setup

Plugins externos devem importar apenas subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe `src/*` de outro pacote de plugin a partir do núcleo ou de outro plugin.
Pontos de entrada carregados por facade preferem o snapshot ativo da configuração de runtime quando ele existe, depois usam fallback para o arquivo de configuração resolvido em disco.

Subcaminhos específicos de capacidade como `image-generation`, `media-understanding`
e `speech` existem porque plugins empacotados os usam hoje. Eles não são
automaticamente contratos externos congelados de longo prazo — consulte a página de referência do SDK
relevante ao depender deles.

## Esquemas da ferramenta de mensagem

Plugins devem ser donos das contribuições de esquema `describeMessageTool(...)` específicas de canal
para primitivas não relacionadas a mensagens, como reações, leituras e enquetes.
A apresentação compartilhada de envio deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos do provedor para botão, componente, bloco ou cartão.
Consulte [Message Presentation](/pt-BR/plugins/message-presentation) para o contrato,
regras de fallback, mapeamento de provedor e checklist para autores de plugins.

Plugins capazes de enviar declaram o que conseguem renderizar por meio de capacidades de mensagem:

- `presentation` para blocos de apresentação semântica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O núcleo decide se renderiza a apresentação nativamente ou se a degrada para texto.
Não exponha rotas de escape de UI nativa do provedor a partir da ferramenta genérica de mensagem.
Helpers obsoletos do SDK para esquemas nativos legados continuam exportados para plugins
existentes de terceiros, mas novos plugins não devem usá-los.

## Resolução de destino de canal

Plugins de canal devem ser donos da semântica de destino específica de canal. Mantenha o host
compartilhado de saída genérico e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca em diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao núcleo se uma
  entrada deve pular direto para resolução semelhante a id em vez de busca em diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando
  o núcleo precisa de uma resolução final pertencente ao provedor após a normalização ou após uma
  falha de diretório.
- `messaging.resolveOutboundSessionRoute(...)` é dono da construção de rota de sessão
  específica do provedor depois que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes
  de pesquisar peers/grupos.
- Use `looksLikeId` para verificações do tipo "trate isto como um id de destino explícito/nativo".
- Use `resolveTarget` para fallback de normalização específico do provedor, não para
  busca ampla em diretório.
- Mantenha ids nativos do provedor, como ids de chat, ids de thread, JIDs, handles e ids de sala
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
- helpers de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta específica do canal e normalização de id devem permanecer na
implementação do plugin.

## Catálogos de provedor

Plugins de provedor podem definir catálogos de modelo para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para múltiplas entradas de provedor

Use `catalog` quando o plugin for dono de ids específicos de modelo do provedor, padrões de URL base
ou metadados de modelo protegidos por autenticação.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos
provedores implícitos integrados do OpenClaw:

- `simple`: provedores simples orientados por chave de API ou env
- `profile`: provedores que aparecem quando existem perfis de autenticação
- `paired`: provedores que sintetizam múltiplas entradas de provedor relacionadas
- `late`: última passada, depois de outros provedores implícitos

Provedores posteriores vencem em colisão de chave, então plugins podem intencionalmente substituir uma
entrada integrada de provedor com o mesmo id de provedor.

Compatibilidade:

- `discovery` ainda funciona como alias legado
- se `catalog` e `discovery` estiverem registrados, o OpenClaw usa `catalog`

## Inspeção de canal somente leitura

Se seu plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` ao lado de `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que as credenciais
  estão totalmente materializadas e pode falhar rapidamente quando segredos obrigatórios estiverem ausentes.
- Caminhos de comando somente leitura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de doctor/reparo de configuração
  não devem precisar materializar credenciais de runtime apenas para
  descrever a configuração.

Comportamento recomendado para `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status de credencial quando relevantes, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para reportar disponibilidade somente leitura. Retornar `tokenStatus: "available"` (e o campo de origem correspondente)
  já é suficiente para comandos no estilo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura informem "configured but unavailable in this command
path" em vez de travar ou relatar incorretamente a conta como não configurada.

## Package packs

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

Se seu plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Barreira de segurança: cada entrada de `openclaw.extensions` deve permanecer dentro do diretório do plugin
após a resolução de symlink. Entradas que escapam do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências de plugin com
um `npm install --omit=dev --ignore-scripts` local ao projeto (sem scripts de ciclo de vida,
sem dependências de dev em runtime), ignorando configurações globais herdadas de instalação do npm.
Mantenha árvores de dependência de plugin em "JS/TS puro" e evite pacotes que exigem
builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve apenas de setup.
Quando o OpenClaw precisa de superfícies de setup para um plugin de canal desabilitado, ou
quando um plugin de canal está habilitado mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso mantém inicialização e setup mais leves
quando sua entrada principal de plugin também conecta ferramentas, hooks ou outro código
somente de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode colocar um plugin de canal nesse mesmo caminho de `setupEntry` durante a fase
de inicialização pré-listen do gateway, mesmo quando o canal já estiver configurado.

Use isso apenas quando `setupEntry` cobrir totalmente a superfície de inicialização que deve existir
antes de o gateway começar a escutar. Na prática, isso significa que a entrada de setup
deve registrar toda capacidade pertencente ao canal da qual a inicialização depende, como:

- o próprio registro de canal
- quaisquer rotas HTTP que precisem estar disponíveis antes de o gateway começar a escutar
- quaisquer métodos, ferramentas ou serviços do gateway que precisem existir nessa mesma janela

Se sua entrada completa ainda for dona de qualquer capacidade necessária na inicialização, não habilite
essa flag. Mantenha o plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais empacotados também podem publicar helpers de superfície de contrato apenas de setup que o núcleo
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual
de promoção de setup é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O núcleo usa essa superfície quando precisa promover uma configuração legada de canal com conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
O Matrix é o exemplo empacotado atual: ele move apenas chaves de autenticação/bootstrap para uma
conta nomeada promovida quando contas nomeadas já existem, e pode preservar uma chave
configurada de conta padrão não canônica em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de setup mantêm preguiçosa a descoberta da superfície de contrato empacotada. O tempo de importação continua leve; a superfície de promoção é carregada apenas no primeiro uso, em vez de
reentrar na inicialização de canal empacotado no import do módulo.

Quando essas superfícies de inicialização incluem métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces de admin do núcleo (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre são resolvidos
como `operator.admin`, mesmo que um plugin solicite um escopo mais estreito.

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

### Metadados de catálogo de canal

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
      "blurb": "Chat auto-hospedado via bots de Webhook do Nextcloud Talk.",
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
- `markdownCapable`: marca o canal como capaz de Markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal de superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal de seletores interativos de setup/configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: coloca o canal no fluxo padrão de `allowFrom` do início rápido
- `forceAccountBinding`: exige vinculação explícita de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere lookup de sessão ao resolver destinos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canal** (por exemplo, uma
exportação de registry MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

Entradas geradas de catálogo de canal e entradas de catálogo de instalação de provedor expõem
fatos normalizados de origem de instalação ao lado do bloco bruto `openclaw.install`. Os
fatos normalizados identificam se a especificação npm é uma versão exata ou um seletor flutuante,
se metadados de integridade esperados estão presentes e se uma origem local de caminho também está disponível. Quando a identidade do catálogo/pacote é conhecida, os
fatos normalizados avisam se o nome do pacote npm analisado divergir dessa identidade.
Eles também avisam quando `defaultChoice` é inválido ou aponta para uma origem que
não está disponível, e quando metadados de integridade npm estão presentes sem uma fonte npm válida.
Consumidores devem tratar `installSource` como um campo opcional aditivo, para que
entradas construídas manualmente e shims de catálogo não precisem sintetizá-lo.
Isso permite que onboarding e diagnósticos expliquem o estado do plano de origem sem
importar o runtime do plugin.

Entradas npm externas oficiais devem preferir um `npmSpec` exato mais
`expectedIntegrity`. Nomes simples de pacote e dist-tags ainda funcionam por
compatibilidade, mas expõem avisos do plano de origem para que o catálogo possa avançar
em direção a instalações fixadas e verificadas por integridade sem quebrar plugins existentes.
Quando o onboarding instala a partir de um caminho de catálogo local, ele registra uma
entrada de índice de plugin gerenciado com `source: "path"` e um
`sourcePath` relativo ao workspace, quando possível. O caminho operacional absoluto de carregamento permanece em
`plugins.load.paths`; o registro de instalação evita duplicar caminhos locais
da estação de trabalho em configuração de longa duração. Isso mantém instalações locais de desenvolvimento visíveis para
diagnósticos do plano de origem sem adicionar uma segunda superfície bruta de divulgação de caminho do sistema de arquivos.
O índice persistido de plugins `plugins/installs.json` é a fonte de verdade da origem de instalação
e pode ser atualizado sem carregar módulos de runtime de plugin.
Seu mapa `installRecords` é durável mesmo quando um manifesto de plugin está ausente ou
inválido; seu array `plugins` é uma visualização reconstruível de manifesto/cache.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto controlam a orquestração do contexto da sessão para ingestão, montagem
e Compaction. Registre-os no seu plugin com
`api.registerContextEngine(id, factory)` e depois selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline padrão de contexto
em vez de apenas adicionar busca em memória ou hooks.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
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

Se seu mecanismo **não** for dono do algoritmo de Compaction, mantenha `compact()`
implementado e delegue explicitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
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

Quando um plugin precisar de um comportamento que não se encaixa na API atual, não contorne
o sistema de plugins com um acesso privado direto. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato do núcleo
   Decida de qual comportamento compartilhado o núcleo deve ser dono: política, fallback, merge de configuração,
   ciclo de vida, semântica voltada ao canal e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada de capacidade
   que seja útil.
3. conecte consumidores do núcleo + canal/recurso
   Canais e plugins de recurso devem consumir a nova capacidade por meio do núcleo,
   e não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends nessa capacidade.
5. adicione cobertura de contrato
   Adicione testes para que o formato de propriedade e registro permaneça explícito ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar rigidamente preso à visão de mundo
de um único provedor. Consulte o [Capability Cookbook](/pt-BR/plugins/architecture)
para um checklist concreto de arquivos e um exemplo completo.

### Checklist de capacidade

Quando você adiciona uma nova capacidade, a implementação normalmente deve tocar
estas superfícies em conjunto:

- tipos de contrato do núcleo em `src/<capability>/types.ts`
- runner/helper de runtime do núcleo em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- ligação do registry de plugin em `src/plugins/registry.ts`
- exposição de runtime do plugin em `src/plugins/runtime/*` quando plugins de recurso/canal
  precisarem consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação de operador/plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso geralmente é um sinal de que a capacidade
ainda não está totalmente integrada.

### Template de capacidade

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

- o núcleo é dono do contrato de capacidade + orquestração
- plugins de fornecedor são donos das implementações do fornecedor
- plugins de recurso/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita

## Relacionado

- [Arquitetura de plugins](/pt-BR/plugins/architecture) — modelo público de capacidades e formatos
- [Subcaminhos do SDK de plugin](/pt-BR/plugins/sdk-subpaths)
- [Setup do SDK de plugin](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
