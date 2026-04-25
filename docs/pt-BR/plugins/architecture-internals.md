---
read_when:
    - Implementando hooks de runtime de provider, ciclo de vida de canal ou pacotes pack
    - Depurando ordem de carregamento de Plugin ou estado do registro
    - Adicionando uma nova capacidade de Plugin ou Plugin de mecanismo de contexto
summary: 'Arquitetura interna de Plugin: pipeline de carregamento, registro, hooks de runtime, rotas HTTP e tabelas de referência'
title: Arquitetura interna de Plugin
x-i18n:
    generated_at: "2026-04-25T13:50:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e505155ee2acc84f7f26fa81b62121f03a998b249886d74f798c0f258bd8da4
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Para o modelo público de capacidades, formatos de Plugin e contratos de
propriedade/execução, consulte [Plugin architecture](/pt-BR/plugins/architecture). Esta página é a
referência da mecânica interna: pipeline de carregamento, registro, hooks de runtime,
rotas HTTP do Gateway, caminhos de importação e tabelas de schema.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de Plugin
2. lê manifests de bundles nativos ou compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a ativação de cada candidato
6. carrega módulos nativos ativados: módulos integrados compilados usam um carregador nativo;
   Plugins nativos não compilados usam jiti
7. chama hooks nativos `register(api)` e coleta os registros no registro de Plugin
8. expõe o registro para superfícies de comando/runtime

<Note>
`activate` é um alias legado para `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os Plugins integrados usam `register`; prefira `register` para novos Plugins.
</Note>

As proteções de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do Plugin, o caminho é gravável globalmente, ou a
propriedade do caminho parece suspeita para Plugins não integrados.

### Comportamento manifest-first

O manifest é a fonte de verdade do plano de controle. O OpenClaw o usa para:

- identificar o Plugin
- descobrir canais/Skills/schema de configuração declarados ou capacidades do bundle
- validar `plugins.entries.<id>.config`
- enriquecer labels/placeholders da Control UI
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do Plugin

Para Plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
o comportamento real, como hooks, ferramentas, comandos ou fluxos de provider.

Blocos opcionais `activation` e `setup` do manifest permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de setup;
não substituem registro em runtime, `register(...)` nem `setupEntry`.
Os primeiros consumidores de ativação ao vivo agora usam dicas do manifest sobre comandos, canais e providers
para restringir o carregamento de Plugin antes de uma materialização mais ampla do registro:

- o carregamento da CLI é restringido a Plugins que possuem o comando primário solicitado
- a resolução de setup/canal do Plugin é restringida a Plugins que possuem o id de
  canal solicitado
- a resolução explícita de setup/runtime do provider é restringida a Plugins que possuem o
  id de provider solicitado

O planejador de ativação expõe tanto uma API somente de ids para chamadores existentes quanto uma
API de plano para novos diagnósticos. Entradas do plano informam por que um Plugin foi selecionado,
separando dicas explícitas do planejador em `activation.*` do fallback por propriedade do manifest, como
`providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks. Essa separação de motivo é o limite de compatibilidade:
metadados de Plugin existentes continuam funcionando, enquanto novo código pode detectar dicas amplas
ou comportamento de fallback sem alterar a semântica de carregamento em runtime.

A descoberta de setup agora prefere ids pertencentes ao descritor, como `setup.providers` e
`setup.cliBackends`, para restringir Plugins candidatos antes de fazer fallback para
`setup-api` em Plugins que ainda precisam de hooks de runtime no momento do setup. O fluxo de setup
do provider usa primeiro `providerAuthChoices` do manifest, depois faz fallback para escolhas do wizard em runtime e
escolhas do catálogo de instalação por compatibilidade. `setup.requiresRuntime: false` explícito
é um ponto de corte somente do descritor; `requiresRuntime` omitido mantém o fallback legado para
`setup-api` por compatibilidade. Se mais de um Plugin descoberto reivindicar o mesmo id normalizado
de provider de setup ou backend de CLI, a busca de setup recusa o proprietário ambíguo em vez de depender
da ordem de descoberta. Quando o runtime de setup realmente é executado, diagnósticos do registro informam
divergência entre `setup.providers` / `setup.cliBackends` e os providers ou backends de CLI
registrados por `setup-api`, sem bloquear Plugins legados.

### O que o carregador armazena em cache

O OpenClaw mantém caches curtos em processo para:

- resultados de descoberta
- dados do registro de manifests
- registros de Plugins carregados

Esses caches reduzem inicializações em rajada e a sobrecarga de comandos repetidos. É seguro
pensar neles como caches de desempenho de curta duração, não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desativar esses caches.
- Ajuste janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não alteram diretamente globais arbitrárias do núcleo. Eles se registram em um
registro central de Plugin.

O registro acompanha:

- registros de Plugin (identidade, origem, procedência, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- providers
- handlers RPC do gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos pertencentes ao Plugin

Recursos centrais então leem desse registro em vez de falar diretamente com os módulos de Plugin.
Isso mantém o carregamento em uma única direção:

- módulo de Plugin -> registro no registro
- runtime do núcleo -> consumo do registro

Essa separação importa para a manutenção. Isso significa que a maioria das superfícies do núcleo só
precisa de um ponto de integração: "ler o registro", não "tratar cada módulo de Plugin de forma especial".

## Callbacks de binding de conversa

Plugins que fazem binding de uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma
solicitação de binding é aprovada ou negada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Agora existe um binding para este plugin + conversa.
        console.log(event.binding?.conversationId);
        return;
      }

      // A solicitação foi negada; limpe qualquer estado pendente local.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos da carga do callback:

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: o binding resolvido para solicitações aprovadas
- `request`: o resumo original da solicitação, dica de detach, id do remetente e
  metadados da conversa

Esse callback é apenas de notificação. Ele não altera quem tem permissão para fazer binding de uma
conversa, e é executado depois que o tratamento de aprovação do núcleo termina.

## Hooks de runtime de provider

Plugins de provider têm três camadas:

- **Metadados de manifest** para lookup barato antes do runtime:
  `setup.providers[].envVars`, compatibilidade legada obsoleta `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hooks em tempo de configuração**: `catalog` (`discovery` legado) mais
  `applyConfigDefaults`.
- **Hooks de runtime**: mais de 40 hooks opcionais cobrindo autenticação, resolução
  de modelo, wrapping de stream, níveis de raciocínio, política de replay e endpoints de uso. Consulte
  a lista completa em [Ordem e uso dos hooks](#hook-order-and-usage).

O OpenClaw ainda controla o loop genérico do agente, failover, tratamento de transcrição e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de provider
sem precisar de um transporte de inferência totalmente personalizado.

Use `setup.providers[].envVars` do manifest quando o provider tiver
credenciais baseadas em env que caminhos genéricos de autenticação/status/seletor de modelo
devam enxergar sem carregar o runtime do Plugin. O `providerAuthEnvVars` obsoleto ainda é lido pelo
adaptador de compatibilidade durante a janela de descontinuação, e Plugins não integrados
que o usam recebem um diagnóstico de manifest. Use `providerAuthAliases` do manifest
quando um id de provider precisar reutilizar as variáveis de env, perfis de autenticação,
autenticação baseada em configuração e escolha de onboarding por chave de API de outro provider. Use
`providerAuthChoices` do manifest quando superfícies CLI de onboarding/escolha de autenticação
precisarem conhecer o id de escolha do provider, labels de grupo e wiring simples de autenticação
por uma flag, sem carregar o runtime do provider. Mantenha `envVars` no runtime do provider
para dicas voltadas ao operador, como labels de onboarding ou variáveis de configuração de
client-id/client-secret do OAuth.

Use `channelEnvVars` do manifest quando um canal tiver autenticação ou setup orientado por env que
fallback genérico para shell-env, verificações de config/status ou prompts de setup devam enxergar
sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para Plugins de modelo/provider, o OpenClaw chama hooks nesta ordem aproximada.
A coluna "Quando usar" é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provider em `models.providers` durante a geração de `models.json`                   | O provider é dono de um catálogo ou de padrões de `baseUrl`                                                                                  |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração do provider durante a materialização da configuração                    | Os padrões dependem do modo de autenticação, env ou semântica da família de modelos do provider                                             |
| --  | _(lookup de modelo integrado)_    | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                | _(não é um hook de plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de preview de model-id antes do lookup                                            | O provider é dono da limpeza de aliases antes da resolução canônica do modelo                                                                |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provider antes da montagem genérica do modelo                        | O provider é dono da limpeza de transporte para ids de provider personalizados na mesma família de transporte                               |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução em runtime/provider                                       | O provider precisa de limpeza de configuração que deve viver com o Plugin; helpers integrados da família Google também dão suporte às entradas de configuração Google compatíveis |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo a providers configurados                       | O provider precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                             |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de env para providers configurados antes do carregamento de autenticação em runtime | O provider tem resolução própria de chave de API por marcador de env; `amazon-bedrock` também tem aqui um resolvedor integrado para marcador de env da AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/self-hosted ou baseada em configuração sem persistir texto simples                    | O provider pode operar com um marcador de credencial sintético/local                                                                         |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis externos de autenticação pertencentes ao provider; o padrão de `persistence` é `runtime-only` para credenciais controladas por CLI/app | O provider reutiliza credenciais externas de autenticação sem persistir refresh tokens copiados; declare `contracts.externalAuthProviders` no manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders armazenados de perfil sintético abaixo da autenticação baseada em env/configuração       | O provider armazena perfis sintéticos placeholder que não devem ganhar precedência                                                           |
| 11  | `resolveDynamicModel`             | Fallback síncrono para ids de modelo pertencentes ao provider que ainda não estão no registro local           | O provider aceita ids arbitrários de modelo upstream                                                                                         |
| 12  | `prepareDynamicModel`             | Pré-aquecimento assíncrono, depois `resolveDynamicModel` roda novamente                                        | O provider precisa de metadados de rede antes de resolver ids desconhecidos                                                                  |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o runner embutido usar o modelo resolvido                                             | O provider precisa de reescritas de transporte, mas ainda usa um transporte do núcleo                                                       |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos de fornecedor por trás de outro transporte compatível          | O provider reconhece seus próprios modelos em transportes proxy sem assumir o controle do provider                                          |
| 15  | `capabilities`                    | Metadados de transcrição/ferramentas do provider usados pela lógica compartilhada do núcleo                    | O provider precisa de peculiaridades de transcrição/família de provider                                                                      |
| 16  | `normalizeToolSchemas`            | Normaliza schemas de ferramenta antes de o runner embutido vê-los                                              | O provider precisa de limpeza de schema da família de transporte                                                                             |
| 17  | `inspectToolSchemas`              | Expõe diagnósticos de schema pertencentes ao provider após a normalização                                      | O provider quer avisos de palavras-chave sem ensinar regras específicas do provider ao núcleo                                                |
| 18  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo vs marcado                                                    | O provider precisa de raciocínio/saída final marcados em vez de campos nativos                                                              |
| 19  | `prepareExtraParams`              | Normalização de parâmetros de solicitação antes de wrappers genéricos de opção de stream                      | O provider precisa de parâmetros padrão de solicitação ou limpeza de parâmetros por provider                                                 |
| 20  | `createStreamFn`                  | Substitui totalmente o caminho normal de stream por um transporte personalizado                                | O provider precisa de um protocolo wire personalizado, não apenas de um wrapper                                                             |
| 21  | `wrapStreamFn`                    | Wrapper de stream após wrappers genéricos serem aplicados                                                      | O provider precisa de wrappers de compatibilidade de headers/body/modelo sem um transporte personalizado                                    |
| 22  | `resolveTransportTurnState`       | Anexa headers nativos por turno ou metadados de transporte                                                     | O provider quer que transportes genéricos enviem identidade nativa do provider por turno                                                    |
| 23  | `resolveWebSocketSessionPolicy`   | Anexa headers nativos de WebSocket ou política de cooldown de sessão                                           | O provider quer que transportes WS genéricos ajustem headers de sessão ou política de fallback                                              |
| 24  | `formatApiKey`                    | Formatador de perfil de autenticação: perfil armazenado vira a string `apiKey` em runtime                     | O provider armazena metadados extras de autenticação e precisa de um formato personalizado de token em runtime                             |
| 25  | `refreshOAuth`                    | Sobrescrita de refresh de OAuth para endpoints personalizados de refresh ou política de falha de refresh      | O provider não se encaixa nos refreshers compartilhados de `pi-ai`                                                                           |
| 26  | `buildAuthDoctorHint`             | Dica de reparo acrescentada quando o refresh de OAuth falha                                                    | O provider precisa de orientação própria de reparo de autenticação após falha de refresh                                                    |
| 27  | `matchesContextOverflowError`     | Matcher do provider para overflow de janela de contexto                                                        | O provider tem erros brutos de overflow que heurísticas genéricas deixariam passar                                                          |
| 28  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provider                                                    | O provider pode mapear erros brutos de API/transporte para rate-limit/sobrecarga/etc                                                        |
| 29  | `isCacheTtlEligible`              | Política de cache de prompt para providers proxy/backhaul                                                      | O provider precisa de controle de TTL de cache específico de proxy                                                                           |
| 30  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação por autenticação ausente                                      | O provider precisa de uma dica de recuperação de autenticação ausente específica                                                             |
| 31  | `suppressBuiltInModel`            | Supressão de modelo upstream obsoleto com dica opcional de erro visível ao usuário                            | O provider precisa ocultar linhas upstream obsoletas ou substituí-las por uma dica do fornecedor                                            |
| 32  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo acrescentadas após a descoberta                                           | O provider precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                              |
| 33  | `resolveThinkingProfile`          | Conjunto de nível de `/think`, labels de exibição e padrão específicos do modelo                              | O provider expõe uma escada personalizada de raciocínio ou label binário para modelos selecionados                                          |
| 34  | `isBinaryThinking`                | Hook de compatibilidade para alternância de raciocínio on/off                                                  | O provider expõe apenas raciocínio binário ligado/desligado                                                                                  |
| 35  | `supportsXHighThinking`           | Hook de compatibilidade para suporte a raciocínio `xhigh`                                                      | O provider quer `xhigh` apenas em um subconjunto de modelos                                                                                  |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidade para nível padrão de `/think`                                                          | O provider é dono da política padrão de `/think` para uma família de modelos                                                                 |
| 37  | `isModernModelRef`                | Matcher de modelo moderno para filtros de perfil ao vivo e seleção de smoke                                   | O provider é dono da correspondência de modelo preferido para live/smoke                                                                     |
| 38  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime imediatamente antes da inferência           | O provider precisa de uma troca de token ou de uma credencial de solicitação de curta duração                                                |
| 39  | `resolveUsageAuth`                | Resolve credenciais de uso/cobrança para `/usage` e superfícies de status relacionadas                        | O provider precisa de parsing personalizado de token de uso/cota ou de uma credencial de uso diferente                                       |
| 40  | `fetchUsageSnapshot`              | Busca e normaliza snapshots específicos de uso/cota do provider depois que a autenticação é resolvida         | O provider precisa de um endpoint de uso específico ou de um parser de payload específico                                                     |
| 41  | `createEmbeddingProvider`         | Constrói um adaptador de embedding pertencente ao provider para memória/busca                                 | O comportamento de embedding de memória pertence ao Plugin do provider                                                                        |
| 42  | `buildReplayPolicy`               | Retorna uma política de replay que controla o tratamento da transcrição para o provider                       | O provider precisa de uma política personalizada de transcrição (por exemplo, remoção de blocos de raciocínio)                              |
| 43  | `sanitizeReplayHistory`           | Reescreve o histórico de replay após a limpeza genérica da transcrição                                        | O provider precisa de reescritas específicas de replay além dos helpers compartilhados de Compaction                                         |
| 44  | `validateReplayTurns`             | Validação final ou remodelagem dos turnos de replay antes do runner embutido                                  | O transporte do provider precisa de validação mais rígida de turnos após a sanitização genérica                                              |
| 45  | `onModelSelected`                 | Executa efeitos colaterais do provider após a seleção                                                         | O provider precisa de telemetria ou estado pertencente ao provider quando um modelo se torna ativo                                           |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
Plugin de provider correspondente e depois percorrem outros Plugins de provider com suporte a hooks
até que um deles realmente altere o id do modelo ou o transporte/configuração. Isso mantém
funcionando os shims de alias/compatibilidade de provider sem exigir que o chamador saiba
qual Plugin integrado é dono da reescrita. Se nenhum hook de provider reescrever uma entrada de configuração
compatível da família Google, o normalizador integrado de configuração do Google ainda aplica
essa limpeza de compatibilidade.

Se o provider precisar de um protocolo wire totalmente personalizado ou de um executor de solicitação
personalizado, isso é uma classe diferente de extensão. Esses hooks são para comportamento de provider
que ainda roda no loop normal de inferência do OpenClaw.

### Exemplo de provider

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

Plugins de provider integrados combinam os hooks acima para se ajustar às necessidades de catálogo,
autenticação, raciocínio, replay e uso de cada fornecedor. O conjunto autoritativo de hooks vive em
cada Plugin em `extensions/`; esta página ilustra os formatos em vez de
espelhar a lista.

<AccordionGroup>
  <Accordion title="Providers de catálogo passthrough">
    OpenRouter, Kilocode, Z.AI e xAI registram `catalog` mais
    `resolveDynamicModel` / `prepareDynamicModel`, para que possam expor ids de modelo upstream
    antes do catálogo estático do OpenClaw.
  </Accordion>
  <Accordion title="Providers com OAuth e endpoint de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi e z.ai combinam
    `prepareRuntimeAuth` ou `formatApiKey` com `resolveUsageAuth` +
    `fetchUsageSnapshot` para controlar troca de token e integração com `/usage`.
  </Accordion>
  <Accordion title="Famílias de replay e limpeza de transcrição">
    Famílias nomeadas compartilhadas (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permitem que providers optem
    pela política de transcrição via `buildReplayPolicy` em vez de cada Plugin
    reimplementar a limpeza.
  </Accordion>
  <Accordion title="Providers somente de catálogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registram apenas `catalog` e usam o loop compartilhado de inferência.
  </Accordion>
  <Accordion title="Helpers de stream específicos do Anthropic">
    Headers beta, `/fast` / `serviceTier` e `context1m` vivem na
    seam pública `api.ts` / `contract-api.ts` do Plugin Anthropic
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

- `textToSpeech` retorna a carga normal de saída TTS do núcleo para superfícies de arquivo/nota de voz.
- Usa configuração central `messages.tts` e seleção de provider.
- Retorna buffer de áudio PCM + sample rate. Plugins devem fazer resample/encode para providers.
- `listVoices` é opcional por provider. Use para seletores de voz ou fluxos de setup pertencentes ao fornecedor.
- Listagens de voz podem incluir metadados mais ricos, como locale, gênero e tags de personalidade para seletores sensíveis ao provider.
- OpenAI e ElevenLabs oferecem suporte a telefonia hoje. Microsoft não.

Plugins também podem registrar providers de fala via `api.registerSpeechProvider(...)`.

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
- Use providers de fala para comportamento de síntese pertencente ao fornecedor.
- A entrada legada Microsoft `edge` é normalizada para o id de provider `microsoft`.
- O modelo preferido de propriedade é orientado à empresa: um único Plugin de fornecedor pode possuir
  providers de texto, fala, imagem e futuros providers de mídia à medida que o OpenClaw adicionar esses
  contratos de capacidade.

Para compreensão de imagem/áudio/vídeo, Plugins registram um único provider tipado
de compreensão de mídia em vez de um saco genérico de chave/valor:

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

- Mantenha orquestração, fallback, configuração e integração com canal no núcleo.
- Mantenha comportamento do fornecedor no Plugin de provider.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos opcionais
  de resultado, novas capacidades opcionais.
- Geração de vídeo já segue o mesmo padrão:
  - o núcleo controla o contrato de capacidade e o helper de runtime
  - Plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - Plugins de recurso/canal consomem `api.runtime.videoGeneration.*`

Para helpers de runtime de compreensão de mídia, Plugins podem chamar:

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
ou o alias STT antigo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional quando o MIME não puder ser inferido com confiabilidade:
  mime: "audio/ogg",
});
```

Observações:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferida para
  compreensão de imagem/áudio/vídeo.
- Usa configuração central de áudio de compreensão de mídia (`tools.media.audio`) e ordem de fallback de provider.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo entrada ignorada/não suportada).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como alias de compatibilidade.

Plugins também podem iniciar execuções em segundo plano de subagente via `api.runtime.subagent`:

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

- `provider` e `model` são sobrescritas opcionais por execução, não mudanças persistentes de sessão.
- O OpenClaw só respeita esses campos de sobrescrita para chamadores confiáveis.
- Para execuções de fallback pertencentes ao Plugin, operadores precisam optar por isso com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir Plugins confiáveis a alvos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de Plugin não confiável ainda funcionam, mas solicitações de sobrescrita são rejeitadas em vez de cair silenciosamente em fallback.

Para busca na web, Plugins podem consumir o helper compartilhado de runtime em vez de
acessar diretamente o wiring da ferramenta do agente:

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

Plugins também podem registrar providers de busca na web via
`api.registerWebSearchProvider(...)`.

Observações:

- Mantenha seleção de provider, resolução de credenciais e semântica compartilhada de solicitação no núcleo.
- Use providers de busca na web para transportes de busca específicos do fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para Plugins de recurso/canal que precisam de comportamento de busca sem depender do wrapper da ferramenta do agente.

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

- `generate(...)`: gera uma imagem usando a cadeia configurada de providers de geração de imagem.
- `listProviders(...)`: lista providers de geração de imagem disponíveis e suas capacidades.

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
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway, ou `"plugin"` para autenticação/verificação de webhook gerenciada pelo Plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo Plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a solicitação.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará erro de carregamento do Plugin. Use `api.registerHttpRoute(...)`.
- Rotas de Plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um Plugin não pode substituir a rota de outro Plugin.
- Rotas sobrepostas com níveis diferentes de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de autenticação.
- Rotas com `auth: "plugin"` **não** recebem automaticamente escopos de runtime de operator. Elas são para webhooks/verificação de assinatura gerenciados pelo Plugin, não para chamadas auxiliares privilegiadas do Gateway.
- Rotas com `auth: "gateway"` são executadas dentro de um escopo de runtime de solicitação do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém os escopos de runtime da rota do Plugin fixados em `operator.write`, mesmo se o chamador enviar `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) respeitam `x-openclaw-scopes` somente quando o header está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas solicitações de rota de Plugin com identidade, o escopo de runtime faz fallback para `operator.write`
- Regra prática: não assuma que uma rota de Plugin com autenticação de gateway é implicitamente uma superfície de admin. Se sua rota precisar de comportamento exclusivo de admin, exija um modo de autenticação com identidade e documente o contrato explícito do header `x-openclaw-scopes`.

## Caminhos de importação do SDK de Plugin

Use subcaminhos estreitos do SDK em vez do barrel monolítico da raiz
`openclaw/plugin-sdk` ao criar novos Plugins. Subcaminhos centrais:

| Subcaminho                          | Finalidade                                         |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Helpers de entrada/construção de canal             |
| `openclaw/plugin-sdk/core`          | Helpers compartilhados genéricos e contrato guarda-chuva |
| `openclaw/plugin-sdk/config-schema` | Schema Zod raiz de `openclaw.json` (`OpenClawSchema`) |

Plugins de canal escolhem de uma família de seams estreitas — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve se consolidar
em um único contrato `approvalCapability` em vez de se misturar entre campos
não relacionados do Plugin. Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

Helpers de runtime e configuração vivem em subcaminhos `*-runtime`
correspondentes (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` está obsoleto — é um shim de compatibilidade para
Plugins mais antigos. Código novo deve importar primitivas genéricas mais estreitas.
</Info>

Pontos de entrada internos do repositório (por raiz de pacote de Plugin integrado):

- `index.js` — entrada do Plugin integrado
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel somente de runtime
- `setup-entry.js` — entrada do Plugin de setup

Plugins externos devem importar apenas subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe `src/*` de outro pacote de Plugin a partir do núcleo ou de outro Plugin.
Pontos de entrada carregados por facade preferem o snapshot ativo de configuração de runtime quando ele existe, depois fazem fallback para o arquivo de configuração resolvido em disco.

Subcaminhos específicos de capacidade como `image-generation`, `media-understanding`
e `speech` existem porque Plugins integrados os usam hoje. Eles não são
automaticamente contratos externos congelados de longo prazo — consulte a página
de referência relevante do SDK ao depender deles.

## Schemas de ferramenta de mensagem

Plugins devem ser donos das contribuições de schema `describeMessageTool(...)`
específicas de canal para primitivas que não sejam mensagem, como reações, leituras e polls.
A apresentação compartilhada de envio deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos de provider como botão, componente, bloco ou card.
Consulte [Message Presentation](/pt-BR/plugins/message-presentation) para o contrato,
regras de fallback, mapeamento por provider e checklist para autores de Plugins.

Plugins com capacidade de envio declaram o que conseguem renderizar por meio de capacidades de mensagem:

- `presentation` para blocos de apresentação semântica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O núcleo decide se renderiza a apresentação nativamente ou a degrada para texto.
Não exponha rotas de fuga de UI nativas de provider a partir da ferramenta genérica de mensagem.
Helpers do SDK obsoletos para schemas nativos legados continuam exportados para
Plugins externos existentes, mas novos Plugins não devem usá-los.

## Resolução de destino de canal

Plugins de canal devem ser donos da semântica específica de destino do canal. Mantenha o
host compartilhado de saída genérico e use a superfície do adaptador de mensagens para regras do provider:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca no diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao núcleo se uma
  entrada deve ir direto para resolução por id em vez de busca em diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do Plugin quando o
  núcleo precisa de uma resolução final pertencente ao provider após a normalização ou
  depois de uma falha no diretório.
- `messaging.resolveOutboundSessionRoute(...)` controla a construção específica do provider
  da rota de sessão depois que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes
  de pesquisar peers/groups.
- Use `looksLikeId` para verificações do tipo "trate isto como um id de destino explícito/nativo".
- Use `resolveTarget` para fallback de normalização específico do provider, não para
  busca ampla em diretório.
- Mantenha ids nativos de provider como ids de chat, ids de thread, JIDs, handles e ids
  de sala dentro de valores `target` ou params específicos do provider, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório a partir da configuração devem manter essa lógica no
Plugin e reutilizar os helpers compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isto quando um canal precisar de peers/groups baseados em configuração, como:

- peers de DM orientados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de diretório com escopo por conta

Os helpers compartilhados em `directory-runtime` tratam apenas operações genéricas:

- filtragem de consulta
- aplicação de limite
- helpers de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta específica do canal e normalização de id devem permanecer na
implementação do Plugin.

## Catálogos de provider

Plugins de provider podem definir catálogos de modelo para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provider
- `{ providers }` para várias entradas de provider

Use `catalog` quando o Plugin for dono de ids de modelo específicos do provider, padrões
de `baseUrl` ou metadados de modelo controlados por autenticação.

`catalog.order` controla quando o catálogo de um Plugin é mesclado em relação aos
providers implícitos integrados do OpenClaw:

- `simple`: providers simples orientados por chave de API ou env
- `profile`: providers que aparecem quando existem perfis de autenticação
- `paired`: providers que sintetizam várias entradas relacionadas de provider
- `late`: último passo, depois de outros providers implícitos

Providers posteriores vencem em colisão de chave, então Plugins podem intencionalmente sobrescrever
uma entrada integrada de provider com o mesmo id de provider.

Compatibilidade:

- `discovery` ainda funciona como alias legado
- se `catalog` e `discovery` estiverem registrados, o OpenClaw usa `catalog`

## Inspeção somente leitura de canal

Se o seu Plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que credenciais
  estão totalmente materializadas e pode falhar rápido quando segredos exigidos estão ausentes.
- Caminhos de comando somente leitura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de doctor/reparo de configuração
  não devem precisar materializar credenciais de runtime apenas para
  descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos relevantes de origem/status de credencial, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para relatar disponibilidade
  somente leitura. Retornar `tokenStatus: "available"` (e o campo de origem correspondente)
  já é suficiente para comandos no estilo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho atual do comando.

Isso permite que comandos somente leitura relatem "configurado, mas indisponível neste caminho de comando" em vez de falhar ou informar incorretamente que a conta não está configurada.

## Pacotes pack

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
passa a ser `name/<fileBase>`.

Se o seu Plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Proteção de segurança: toda entrada de `openclaw.extensions` deve permanecer dentro do diretório do Plugin
após a resolução de symlink. Entradas que escaparem do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências de Plugin com
`npm install --omit=dev --ignore-scripts` (sem scripts de ciclo de vida, sem dependências de desenvolvimento em runtime). Mantenha árvores de dependência de Plugin em "JS/TS puro" e evite pacotes que exijam builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve somente de setup.
Quando o OpenClaw precisa de superfícies de setup para um Plugin de canal desativado, ou
quando um Plugin de canal está ativado mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do Plugin. Isso mantém inicialização e setup mais leves
quando a entrada principal do seu Plugin também conecta ferramentas, hooks ou outro código
somente de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode permitir que um Plugin de canal opte pelo mesmo caminho `setupEntry` durante a fase
de inicialização pré-listen do gateway, mesmo quando o canal já está configurado.

Use isto apenas quando `setupEntry` cobrir totalmente a superfície de inicialização que precisa existir
antes de o gateway começar a escutar. Na prática, isso significa que a entrada de setup
deve registrar toda capacidade pertencente ao canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes de o gateway começar a escutar
- quaisquer métodos, ferramentas ou serviços do gateway que precisem existir nessa mesma janela

Se a sua entrada completa ainda for dona de alguma capacidade de inicialização necessária, não ative
essa flag. Mantenha o Plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais integrados também podem publicar helpers de superfície de contrato somente de setup que o núcleo
pode consultar antes de o runtime completo do canal ser carregado. A superfície atual de
promoção de setup é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O núcleo usa essa superfície quando precisa promover uma configuração legada de canal de conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do Plugin.
Matrix é o exemplo integrado atual: ele move apenas chaves de autenticação/bootstrap para uma
conta promovida nomeada quando contas nomeadas já existem, e pode preservar uma
chave configurada de conta padrão não canônica em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de setup mantêm preguiçosa a descoberta da superfície de contrato integrada. O tempo de importação continua leve; a superfície de promoção é carregada apenas no primeiro uso, em vez de reentrar na inicialização do canal integrado na importação do módulo.

Quando essas superfícies de inicialização incluem métodos RPC do gateway, mantenha-os sob um
prefixo específico do Plugin. Namespaces centrais de admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre resolvem
para `operator.admin`, mesmo que um Plugin solicite um escopo mais estreito.

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
dicas de instalação via `openclaw.install`. Isso mantém o catálogo central sem dados.

Exemplo:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (hospedado por conta própria)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat self-hosted via bots de Webhook do Nextcloud Talk.",
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

- `detailLabel`: label secundário para superfícies mais ricas de catálogo/status
- `docsLabel`: sobrescreve o texto do link para a documentação
- `preferOver`: ids de Plugin/canal de prioridade mais baixa que esta entrada do catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com Markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal de superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal de seletores interativos de setup/configure quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: inclui o canal no fluxo padrão de quickstart `allowFrom`
- `forceAccountBinding`: exige binding explícito de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere lookup de sessão ao resolver alvos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canal** (por exemplo, uma
exportação de registro MPM). Coloque um arquivo JSON em um destes caminhos:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

Entradas geradas do catálogo de canal e entradas do catálogo de instalação de provider expõem
fatos normalizados de origem de instalação ao lado do bloco bruto `openclaw.install`. Os
fatos normalizados identificam se a especificação npm é uma versão exata ou um seletor flutuante,
se metadados esperados de integridade estão presentes e se um caminho de origem local
também está disponível. Quando a identidade do catálogo/pacote é conhecida, os fatos
normalizados avisam se o nome do pacote npm analisado diverge dessa identidade.
Eles também avisam quando `defaultChoice` é inválido ou aponta para uma origem que
não está disponível, e quando metadados de integridade npm estão presentes sem uma fonte npm
válida. Consumidores devem tratar `installSource` como um campo opcional aditivo, para que
entradas manuais mais antigas e shims de compatibilidade não precisem sintetizá-lo.
Isso permite que onboarding e diagnósticos expliquem o estado do plano de origem sem
importar o runtime do Plugin.

Entradas npm externas oficiais devem preferir um `npmSpec` exato mais
`expectedIntegrity`. Nomes simples de pacote e dist-tags ainda funcionam por
compatibilidade, mas expõem avisos do plano de origem para que o catálogo possa evoluir
para instalações fixadas e verificadas por integridade sem quebrar Plugins existentes.
Quando o onboarding instala a partir de um caminho local de catálogo, ele registra uma
entrada `plugins.installs` com `source: "path"` e um `sourcePath` relativo ao workspace
quando possível. O caminho operacional absoluto de carregamento permanece em
`plugins.load.paths`; o registro de instalação evita duplicar caminhos locais da estação de trabalho
em configuração de longa duração. Isso mantém instalações locais de desenvolvimento visíveis para
diagnósticos do plano de origem sem adicionar uma segunda superfície bruta de divulgação
de caminho de sistema de arquivos.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto controlam a orquestração do contexto de sessão para ingestão,
montagem e Compaction. Registre-os a partir do seu Plugin com
`api.registerContextEngine(id, factory)` e depois selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu Plugin precisar substituir ou estender o pipeline de contexto padrão,
em vez de apenas adicionar busca de memória ou hooks.

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

Se o seu mecanismo **não** for dono do algoritmo de Compaction, mantenha `compact()`
implementado e delegue-o explicitamente:

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

Quando um Plugin precisa de um comportamento que não se encaixa na API atual, não contorne
o sistema de Plugins com um reach-in privado. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato central
   Decida qual comportamento compartilhado o núcleo deve controlar: política, fallback, merge de configuração,
   ciclo de vida, semântica voltada a canal e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de Plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície útil
   tipada de capacidade.
3. conecte consumidores do núcleo + canal/recurso
   Canais e Plugins de recurso devem consumir a nova capacidade pelo núcleo,
   não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends contra a capacidade.
5. adicione cobertura de contrato
   Adicione testes para que a propriedade e o formato de registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar rigidamente acoplado à
visão de mundo de um único provider. Consulte o [Capability Cookbook](/pt-BR/plugins/architecture)
para um checklist concreto de arquivos e um exemplo prático.

### Checklist de capacidade

Quando você adiciona uma nova capacidade, a implementação geralmente deve tocar
estas superfícies em conjunto:

- tipos de contrato do núcleo em `src/<capability>/types.ts`
- runner/helper de runtime do núcleo em `src/<capability>/runtime.ts`
- superfície de registro da API de Plugin em `src/plugins/types.ts`
- conexão do registro de Plugin em `src/plugins/registry.ts`
- exposição de runtime do Plugin em `src/plugins/runtime/*` quando Plugins de recurso/canal
  precisarem consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- asserts de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação para operador/Plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso geralmente é sinal de que a capacidade
ainda não está totalmente integrada.

### Template de capacidade

Padrão mínimo:

```ts
// contrato do núcleo
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API de plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper compartilhado de runtime para plugins de recurso/canal
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

- o núcleo controla o contrato de capacidade + orquestração
- Plugins de fornecedor controlam implementações de fornecedor
- Plugins de recurso/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita

## Relacionados

- [Plugin architecture](/pt-BR/plugins/architecture) — modelo público de capacidades e formatos
- [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths)
- [Setup do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criando plugins](/pt-BR/plugins/building-plugins)
