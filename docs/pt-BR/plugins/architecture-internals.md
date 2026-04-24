---
read_when:
    - Implementando hooks de runtime de provider, ciclo de vida de canal ou pacotes packs
    - Depurando ordem de carregamento de Plugins ou estado do registro
    - Adicionando uma nova capacidade de Plugin ou Plugin de mecanismo de contexto
summary: 'Internals da arquitetura de Plugins: pipeline de carregamento, registro, hooks de runtime, rotas HTTP e tabelas de referência'
title: Internals da arquitetura de Plugins
x-i18n:
    generated_at: "2026-04-24T06:02:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01e258ab1666f7aff112fa3f897a40bf28dccaa8d06265fcf21e53479ee1ebda
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Para o modelo público de capacidades, formatos de Plugin e contratos de propriedade/execução,
consulte [Arquitetura de Plugins](/pt-BR/plugins/architecture). Esta página é a
referência da mecânica interna: pipeline de carregamento, registro, hooks de runtime,
rotas HTTP do Gateway, caminhos de importação e tabelas de schema.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de Plugin
2. lê manifests de bundle nativos ou compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega módulos nativos habilitados: módulos incluídos compilados usam um carregador nativo;
   Plugins nativos não compilados usam jiti
7. chama hooks nativos `register(api)` e coleta registros no registro de Plugins
8. expõe o registro para superfícies de comandos/runtime

<Note>
`activate` é um alias legado para `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os Plugins incluídos usam `register`; prefira `register` para novos Plugins.
</Note>

Os controles de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do Plugin, o caminho é gravável por todos ou a
propriedade do caminho parece suspeita para Plugins não incluídos.

### Comportamento orientado por manifesto

O manifesto é a fonte da verdade do plano de controle. O OpenClaw o usa para:

- identificar o Plugin
- descobrir canais/Skills/schema de configuração declarados ou capacidades do bundle
- validar `plugins.entries.<id>.config`
- enriquecer rótulos/placeholders da UI de controle
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do Plugin

Para Plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
comportamentos reais, como hooks, ferramentas, comandos ou fluxos de provider.

Blocos opcionais `activation` e `setup` do manifesto permanecem no plano de controle.
Eles são descritores apenas de metadados para planejamento de ativação e descoberta de configuração;
não substituem registro em runtime, `register(...)` ou `setupEntry`.
Os primeiros consumidores de ativação ao vivo agora usam dicas do manifesto sobre comando, canal e provider
para restringir o carregamento de Plugins antes de uma materialização mais ampla do registro:

- O carregamento da CLI restringe-se a Plugins que possuem o comando principal solicitado
- A resolução de configuração/canal restringe-se a Plugins que possuem o
  ID de canal solicitado
- A resolução explícita de configuração/runtime de provider restringe-se a Plugins que possuem o
  ID de provider solicitado

O planejador de ativação expõe tanto uma API somente com IDs para chamadores existentes quanto uma
API de plano para novos diagnósticos. Entradas de plano informam por que um Plugin foi selecionado,
separando dicas explícitas do planejador `activation.*` do fallback de propriedade do manifesto,
como `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hooks. Essa separação de motivo é o limite de compatibilidade:
metadados existentes de Plugin continuam funcionando, enquanto código novo pode detectar dicas amplas
ou comportamento de fallback sem alterar a semântica de carregamento em runtime.

A descoberta de configuração agora prefere IDs pertencentes ao descritor, como `setup.providers` e
`setup.cliBackends`, para restringir candidatos de Plugin antes de recorrer a
`setup-api` para Plugins que ainda precisam de hooks de runtime no momento da configuração. Se mais de
um Plugin descoberto reivindicar o mesmo ID normalizado de provider ou backend CLI de configuração,
a busca de configuração recusa o proprietário ambíguo em vez de depender da ordem
de descoberta.

### O que o carregador armazena em cache

O OpenClaw mantém caches curtos em processo para:

- resultados de descoberta
- dados do registro de manifesto
- registros de Plugins carregados

Esses caches reduzem inicializações explosivas e a sobrecarga de comandos repetidos. É seguro
pensar neles como caches de desempenho de curta duração, não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desabilitar esses caches.
- Ajuste as janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não mutam diretamente globais aleatórios do core. Eles se registram em um
registro central de Plugins.

O registro rastreia:

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

Os recursos do core então leem desse registro em vez de falar diretamente com módulos de Plugin.
Isso mantém o carregamento em um só sentido:

- módulo do Plugin -> registro no registro
- runtime do core -> consumo do registro

Essa separação importa para a manutenção. Ela significa que a maioria das superfícies do core precisa
de apenas um ponto de integração: "ler o registro", não "criar caso especial para cada módulo de Plugin".

## Callbacks de vínculo de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback após uma solicitação de vínculo
ser aprovada ou negada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Um vínculo agora existe para este plugin + conversa.
        console.log(event.binding?.conversationId);
        return;
      }

      // A solicitação foi negada; limpe qualquer estado pendente local.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos do payload do callback:

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: o vínculo resolvido para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de desacoplamento, ID do remetente e
  metadados da conversa

Esse callback é apenas de notificação. Ele não altera quem tem permissão para vincular uma
conversa e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provider

Plugins de provider têm três camadas:

- **Metadados de manifesto** para busca barata antes do runtime: `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hooks em tempo de configuração**: `catalog` (legado `discovery`) mais
  `applyConfigDefaults`.
- **Hooks de runtime**: mais de 40 hooks opcionais cobrindo autenticação, resolução de modelo,
  encapsulamento de stream, níveis de thinking, política de replay e endpoints de uso. Consulte
  a lista completa em [Ordem e uso dos hooks](#hook-order-and-usage).

O OpenClaw ainda é o responsável pelo loop genérico do agente, failover, tratamento de transcrição e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de provider sem
precisar de um transporte de inferência totalmente personalizado.

Use `providerAuthEnvVars` do manifesto quando o provider tiver credenciais baseadas em env que
caminhos genéricos de autenticação/status/seletor de modelo devam enxergar sem carregar o runtime do Plugin.
Use `providerAuthAliases` do manifesto quando um ID de provider deve reutilizar as env vars,
perfis de autenticação, autenticação sustentada por configuração e escolha de onboarding de chave de API de outro provider. Use `providerAuthChoices` do manifesto quando
superfícies CLI de onboarding/escolha de autenticação devem conhecer o ID de escolha do provider, rótulos de grupo e fio simples de autenticação com uma flag sem carregar o runtime do provider. Mantenha `envVars` do runtime do provider para dicas voltadas ao operador, como rótulos de onboarding ou variáveis de configuração de client-id/client-secret OAuth.

Use `channelEnvVars` do manifesto quando um canal tiver autenticação ou configuração orientada por env que
fallback genérico de shell-env, verificações de config/status ou prompts de configuração devam enxergar
sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para Plugins de modelo/provider, o OpenClaw chama hooks aproximadamente nesta ordem.
A coluna "Quando usar" é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provider em `models.providers` durante a geração de `models.json`                   | O provider é proprietário de um catálogo ou de padrões de base URL                                                                            |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração pertencentes ao provider durante a materialização da configuração       | Os padrões dependem do modo de autenticação, do env ou da semântica da família de modelos do provider                                        |
| --  | _(busca integrada de modelo)_     | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                | _(não é um hook de Plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de preview de model-id antes da busca                                             | O provider é proprietário da limpeza de alias antes da resolução canônica do modelo                                                           |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provider antes da montagem genérica do modelo                       | O provider é proprietário da limpeza de transporte para IDs de provider personalizados na mesma família de transporte                         |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provider                                       | O provider precisa de limpeza de configuração que deve ficar com o Plugin; helpers incluídos da família Google também cobrem entradas compatíveis de configuração Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica regravações de compatibilidade de uso de streaming nativo a providers configurados                      | O provider precisa de correções de metadados de uso de streaming nativo baseadas em endpoint                                                 |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de env para providers configurados antes do carregamento de autenticação em runtime | O provider possui resolução de chave de API por marcador de env pertencente ao provider; `amazon-bedrock` também tem aqui um resolvedor integrado de marcador de env AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/autohospedada ou sustentada por configuração sem persistir texto simples             | O provider pode operar com um marcador de credencial sintética/local                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis externos de autenticação pertencentes ao provider; `persistence` padrão é `runtime-only` para credenciais pertencentes à CLI/app | O provider reutiliza credenciais externas de autenticação sem persistir tokens de atualização copiados; declare `contracts.externalAuthProviders` no manifesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders armazenados de perfil sintético abaixo da autenticação sustentada por env/configuração   | O provider armazena perfis placeholder sintéticos que não devem ganhar precedência                                                            |
| 11  | `resolveDynamicModel`             | Fallback síncrono para IDs de modelo pertencentes ao provider que ainda não estão no registro local           | O provider aceita IDs arbitrários de modelo upstream                                                                                          |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono; depois `resolveDynamicModel` é executado novamente                                     | O provider precisa de metadados de rede antes de resolver IDs desconhecidos                                                                   |
| 13  | `normalizeResolvedModel`          | Regravação final antes de o runner embutido usar o modelo resolvido                                            | O provider precisa de regravações de transporte, mas ainda usa um transporte do core                                                         |
| 14  | `contributeResolvedModelCompat`   | Contribui com sinalizadores de compatibilidade para modelos de vendor por trás de outro transporte compatível | O provider reconhece seus próprios modelos em transportes proxy sem assumir o provider                                                        |
| 15  | `capabilities`                    | Metadados de transcrição/ferramentas pertencentes ao provider usados pela lógica compartilhada do core        | O provider precisa de peculiaridades de transcrição/família de provider                                                                       |
| 16  | `normalizeToolSchemas`            | Normaliza schemas de ferramentas antes de o runner embutido vê-los                                             | O provider precisa de limpeza de schema da família de transporte                                                                              |
| 17  | `inspectToolSchemas`              | Expõe diagnósticos de schema pertencentes ao provider após a normalização                                      | O provider quer avisos de palavras-chave sem ensinar regras específicas de provider ao core                                                   |
| 18  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo vs com tags                                                   | O provider precisa de saída de raciocínio/final com tags em vez de campos nativos                                                            |
| 19  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes de wrappers genéricos de opções de stream                      | O provider precisa de parâmetros padrão de requisição ou de limpeza de parâmetros por provider                                               |
| 20  | `createStreamFn`                  | Substitui totalmente o caminho normal de stream por um transporte personalizado                                | O provider precisa de um protocolo de rede personalizado, não apenas de um wrapper                                                           |
| 21  | `wrapStreamFn`                    | Wrapper de stream após a aplicação de wrappers genéricos                                                       | O provider precisa de wrappers de compatibilidade de headers/corpo/modelo de requisição sem um transporte personalizado                      |
| 22  | `resolveTransportTurnState`       | Anexa headers ou metadados nativos por turno ao transporte                                                     | O provider quer que transportes genéricos enviem identidade nativa de turno do provider                                                      |
| 23  | `resolveWebSocketSessionPolicy`   | Anexa headers nativos de WebSocket ou política de cooldown de sessão                                           | O provider quer que transportes WS genéricos ajustem headers de sessão ou política de fallback                                               |
| 24  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado torna-se a string `apiKey` de runtime               | O provider armazena metadados extras de autenticação e precisa de um formato de token personalizado em runtime                               |
| 25  | `refreshOAuth`                    | Substituição de atualização OAuth para endpoints personalizados de refresh ou política de falha de refresh    | O provider não se encaixa nos refreshers compartilhados `pi-ai`                                                                              |
| 26  | `buildAuthDoctorHint`             | Dica de reparo acrescentada quando a atualização OAuth falha                                                   | O provider precisa de orientação de reparo de autenticação pertencente ao provider após falha de refresh                                     |
| 27  | `matchesContextOverflowError`     | Correspondência de overflow de janela de contexto pertencente ao provider                                      | O provider tem erros brutos de overflow que heurísticas genéricas não detectariam                                                            |
| 28  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provider                                                    | O provider pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                                    |
| 29  | `isCacheTtlEligible`              | Política de cache de prompt para providers proxy/backhaul                                                      | O provider precisa de controle de TTL de cache específico para proxy                                                                          |
| 30  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação para autenticação ausente                                     | O provider precisa de uma dica de recuperação de autenticação ausente específica do provider                                                  |
| 31  | `suppressBuiltInModel`            | Supressão de modelo upstream obsoleto mais dica opcional de erro voltada ao usuário                           | O provider precisa ocultar linhas upstream obsoletas ou substituí-las por uma dica do vendor                                                 |
| 32  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo acrescentadas após a descoberta                                           | O provider precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                               |
| 33  | `resolveThinkingProfile`          | Conjunto de níveis de `/think` específico do modelo, rótulos de exibição e padrão                             | O provider expõe uma escada personalizada de thinking ou rótulo binário para modelos selecionados                                            |
| 34  | `isBinaryThinking`                | Hook de compatibilidade para alternância de raciocínio on/off                                                  | O provider expõe apenas thinking binário ligado/desligado                                                                                     |
| 35  | `supportsXHighThinking`           | Hook de compatibilidade para suporte a raciocínio `xhigh`                                                      | O provider quer `xhigh` apenas em um subconjunto de modelos                                                                                   |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidade para nível padrão de `/think`                                                          | O provider é proprietário da política padrão de `/think` para uma família de modelos                                                         |
| 37  | `isModernModelRef`                | Correspondência de modelo moderno para filtros de perfil ao vivo e seleção de smoke                           | O provider é proprietário da correspondência de modelo preferido para live/smoke                                                            |
| 38  | `prepareRuntimeAuth`              | Troca uma credencial configurada pela chave/token real de runtime logo antes da inferência                    | O provider precisa de uma troca de token ou de uma credencial de requisição de curta duração                                                |
| 39  | `resolveUsageAuth`                | Resolve credenciais de uso/cobrança para `/usage` e superfícies de status relacionadas                        | O provider precisa de parsing personalizado de token de uso/cota ou de uma credencial diferente para uso                                    |
| 40  | `fetchUsageSnapshot`              | Busca e normaliza snapshots específicos de uso/cota do provider depois que a autenticação é resolvida        | O provider precisa de um endpoint específico de uso ou de um parser específico de payload                                                   |
| 41  | `createEmbeddingProvider`         | Constrói um adaptador de embeddings pertencente ao provider para memória/pesquisa                             | O comportamento de embeddings de memória deve ficar com o Plugin do provider                                                                 |
| 42  | `buildReplayPolicy`               | Retorna uma política de replay que controla o tratamento da transcrição para o provider                       | O provider precisa de uma política personalizada de transcrição (por exemplo, remoção de blocos de thinking)                                |
| 43  | `sanitizeReplayHistory`           | Regrava o histórico de replay após a limpeza genérica da transcrição                                          | O provider precisa de regravações específicas de replay além dos helpers compartilhados de Compaction                                       |
| 44  | `validateReplayTurns`             | Validação final ou remodelagem dos turnos de replay antes do runner embutido                                  | O transporte do provider precisa de validação mais rígida de turnos após a sanitização genérica                                             |
| 45  | `onModelSelected`                 | Executa efeitos colaterais pertencentes ao provider após a seleção                                            | O provider precisa de telemetria ou estado pertencente ao provider quando um modelo se torna ativo                                           |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
Plugin de provider correspondente, depois passam por outros Plugins de provider compatíveis com hooks
até que um realmente altere o ID do modelo ou o transporte/configuração. Isso mantém
funcionando shims de alias/provider compatível sem exigir que o chamador saiba qual
Plugin incluído é o proprietário da regravação. Se nenhum hook de provider regravar uma
entrada compatível de configuração da família Google, o normalizador incluído de configuração Google ainda aplica
essa limpeza de compatibilidade.

Se o provider precisar de um protocolo de rede totalmente personalizado ou de um executor personalizado de requisições,
essa é uma classe diferente de extensão. Esses hooks são para comportamento de provider
que ainda é executado no loop normal de inferência do OpenClaw.

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

Plugins de provider incluídos combinam os hooks acima para se ajustar às necessidades de catálogo,
autenticação, thinking, replay e uso de cada vendor. O conjunto autoritativo de hooks fica com
cada Plugin em `extensions/`; esta página ilustra os formatos em vez de
espelhar a lista.

<AccordionGroup>
  <Accordion title="Providers de catálogo pass-through">
    OpenRouter, Kilocode, Z.AI e xAI registram `catalog` mais
    `resolveDynamicModel` / `prepareDynamicModel` para poder expor IDs de modelo
    upstream antes do catálogo estático do OpenClaw.
  </Accordion>
  <Accordion title="Providers de OAuth e endpoint de uso">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi e z.ai combinam
    `prepareRuntimeAuth` ou `formatApiKey` com `resolveUsageAuth` +
    `fetchUsageSnapshot` para serem proprietários da troca de token e da integração com `/usage`.
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
    Headers beta, `/fast` / `serviceTier` e `context1m` ficam dentro da
    seam pública `api.ts` / `contract-api.ts` do Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) em vez de
    ficarem no SDK genérico.
  </Accordion>
</AccordionGroup>

## Helpers de runtime

Plugins podem acessar helpers selecionados do core via `api.runtime`. Para TTS:

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

- `textToSpeech` retorna a carga útil normal de saída TTS do core para superfícies de arquivo/nota de voz.
- Usa a configuração do core `messages.tts` e a seleção de provider.
- Retorna buffer de áudio PCM + sample rate. Plugins devem reamostrar/codificar para providers.
- `listVoices` é opcional por provider. Use-o para seletores de voz ou fluxos de configuração pertencentes ao vendor.
- Listagens de vozes podem incluir metadados mais ricos, como locale, gênero e tags de personalidade para seletores conscientes de provider.
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

- Mantenha política TTS, fallback e entrega de resposta no core.
- Use providers de fala para comportamento de síntese pertencente ao vendor.
- A entrada legada Microsoft `edge` é normalizada para o ID de provider `microsoft`.
- O modelo preferido de propriedade é orientado pela empresa: um Plugin de vendor pode ser o proprietário
  de providers de texto, fala, imagem e futuros providers de mídia à medida que o OpenClaw adicionar esses
  contratos de capacidade.

Para compreensão de imagem/áudio/vídeo, Plugins registram um provider tipado
de compreensão de mídia em vez de uma bolsa genérica de chave/valor:

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
- Mantenha comportamento de vendor no Plugin do provider.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos opcionais
  de resultado, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core é proprietário do contrato de capacidade e do helper de runtime
  - Plugins de vendor registram `api.registerVideoGenerationProvider(...)`
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
ou o alias STT mais antigo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional quando o MIME não pode ser inferido com confiabilidade:
  mime: "audio/ogg",
});
```

Observações:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferida para
  compreensão de imagem/áudio/vídeo.
- Usa a configuração de áudio de compreensão de mídia do core (`tools.media.audio`) e a ordem de fallback de provider.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não compatível).
- `api.runtime.stt.transcribeAudioFile(...)` permanece como um alias de compatibilidade.

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

- `provider` e `model` são substituições opcionais por execução, não mudanças persistentes de sessão.
- O OpenClaw só respeita esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback pertencentes ao Plugin, operadores devem optar por isso com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir Plugins confiáveis a destinos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer destino.
- Execuções de subagente de Plugin não confiável ainda funcionam, mas solicitações de substituição são rejeitadas em vez de recorrer silenciosamente ao fallback.

Para pesquisa web, Plugins podem consumir o helper compartilhado de runtime em vez de
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

Plugins também podem registrar providers de pesquisa web via
`api.registerWebSearchProvider(...)`.

Observações:

- Mantenha seleção de provider, resolução de credenciais e semântica compartilhada de requisição no core.
- Use providers de pesquisa web para transportes de pesquisa específicos de vendor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para Plugins de recurso/canal que precisam de comportamento de pesquisa sem depender do wrapper da ferramenta do agente.

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
- `listProviders(...)`: lista providers disponíveis de geração de imagem e suas capacidades.

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
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway ou `"plugin"` para autenticação/verificação de Webhook gerenciada pelo Plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo Plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a solicitação.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará erro de carregamento de Plugin. Use `api.registerHttpRoute(...)` em vez disso.
- Rotas de Plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um Plugin não pode substituir a rota de outro Plugin.
- Rotas sobrepostas com níveis de `auth` diferentes são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de autenticação.
- Rotas `auth: "plugin"` **não** recebem automaticamente escopos de runtime de operador. Elas são para Webhooks/verificação de assinatura gerenciados pelo Plugin, não para chamadas privilegiadas de helper do Gateway.
- Rotas `auth: "gateway"` são executadas dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém os escopos de runtime da rota do Plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) respeitam `x-openclaw-scopes` somente quando o header está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas solicitações de rota de Plugin com identidade, o escopo de runtime recorre a `operator.write`
- Regra prática: não presuma que uma rota de Plugin autenticada pelo gateway seja implicitamente uma superfície de admin. Se sua rota precisar de comportamento somente de admin, exija um modo de autenticação com identidade e documente o contrato explícito do header `x-openclaw-scopes`.

## Caminhos de importação do SDK de Plugin

Use subcaminhos estreitos do SDK em vez do barrel raiz monolítico `openclaw/plugin-sdk`
ao criar novos Plugins. Subcaminhos principais:

| Subcaminho                          | Finalidade                                         |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Helpers de entrada/build de canal                  |
| `openclaw/plugin-sdk/core`          | Helpers compartilhados genéricos e contrato guarda-chuva |
| `openclaw/plugin-sdk/config-schema` | Schema Zod raiz de `openclaw.json` (`OpenClawSchema`) |

Plugins de canal escolhem entre uma família de seams estreitas — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve se consolidar
em um único contrato `approvalCapability`, em vez de ser misturado em campos
não relacionados do Plugin. Consulte [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins).

Helpers de runtime e configuração ficam em subcaminhos `*-runtime`
correspondentes (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` está obsoleto — é um shim de compatibilidade para
Plugins mais antigos. Código novo deve importar primitivas genéricas mais estreitas.
</Info>

Pontos de entrada internos do repositório (por raiz de pacote de Plugin incluído):

- `index.js` — entrada do Plugin incluído
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel somente de runtime
- `setup-entry.js` — entrada do Plugin de configuração

Plugins externos devem importar apenas subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe `src/*` de outro pacote de Plugin a partir do core ou de outro Plugin.
Pontos de entrada carregados por facade preferem o snapshot ativo da configuração de runtime quando ele existe e, em seguida, recorrem ao arquivo de configuração resolvido em disco.

Subcaminhos específicos de capacidade, como `image-generation`, `media-understanding`
e `speech`, existem porque Plugins incluídos os usam hoje. Eles não são
automaticamente contratos externos congelados de longo prazo — consulte a página relevante
de referência do SDK ao depender deles.

## Schemas da ferramenta de mensagem

Plugins devem ser proprietários das contribuições de schema `describeMessageTool(...)`
específicas do canal para primitivas não relacionadas a mensagens, como reações, leituras e polls.
A apresentação compartilhada de envio deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos do provider para botões, componentes, blocos ou cartões.
Consulte [Apresentação de mensagem](/pt-BR/plugins/message-presentation) para o contrato,
regras de fallback, mapeamento por provider e checklist para autores de Plugin.

Plugins com capacidade de envio declaram o que conseguem renderizar por capacidades de mensagem:

- `presentation` para blocos semânticos de apresentação (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O core decide se renderiza a apresentação nativamente ou se a degrada para texto.
Não exponha escapes de UI nativos do provider a partir da ferramenta genérica de mensagem.
Helpers obsoletos do SDK para schemas nativos legados continuam exportados para
Plugins de terceiros existentes, mas novos Plugins não devem usá-los.

## Resolução de destino de canal

Plugins de canal devem ser proprietários da semântica específica do canal para destino. Mantenha o
host compartilhado de saída genérico e use a superfície do adaptador de mensagens para regras do provider:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca em diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve pular direto para resolução semelhante a ID em vez de busca em diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do Plugin quando o
  core precisa de uma resolução final pertencente ao provider após a normalização ou após uma
  falha na busca em diretório.
- `messaging.resolveOutboundSessionRoute(...)` é o responsável pela construção de rota
  de sessão específica do provider depois que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes
  da busca em peers/grupos.
- Use `looksLikeId` para verificações do tipo "trate isto como um ID de destino explícito/nativo".
- Use `resolveTarget` para fallback de normalização específico do provider, não para
  busca ampla em diretório.
- Mantenha IDs nativos do provider, como IDs de chat, IDs de thread, JIDs, handles e IDs de sala
  dentro de valores `target` ou parâmetros específicos do provider, não em campos
  genéricos do SDK.

## Diretórios sustentados por configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
Plugin e reutilizar os helpers compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de peers/grupos sustentados por configuração, como:

- peers de DM orientados por lista de permissão
- mapas configurados de canal/grupo
- fallbacks estáticos de diretório com escopo de conta

Os helpers compartilhados em `directory-runtime` tratam apenas operações genéricas:

- filtragem de consulta
- aplicação de limite
- helpers de desduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta específica do canal e normalização de ID devem permanecer na
implementação do Plugin.

## Catálogos de provider

Plugins de provider podem definir catálogos de modelos para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provider
- `{ providers }` para múltiplas entradas de provider

Use `catalog` quando o Plugin for proprietário de IDs específicos de modelo do provider, padrões
de base URL ou metadados de modelo controlados por autenticação.

`catalog.order` controla quando o catálogo de um Plugin é mesclado em relação aos
providers implícitos integrados do OpenClaw:

- `simple`: providers simples orientados por chave de API ou env
- `profile`: providers que aparecem quando perfis de autenticação existem
- `paired`: providers que sintetizam múltiplas entradas relacionadas de provider
- `late`: último passo, depois de outros providers implícitos

Providers posteriores vencem em colisão de chave, então Plugins podem intencionalmente substituir uma
entrada integrada de provider com o mesmo ID de provider.

Compatibilidade:

- `discovery` ainda funciona como um alias legado
- se `catalog` e `discovery` forem registrados, o OpenClaw usa `catalog`

## Inspeção somente leitura de canal

Se seu Plugin registra um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que credenciais
  estão totalmente materializadas e pode falhar rapidamente quando segredos exigidos estiverem ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de doctor/reparo de configuração
  não devem precisar materializar credenciais de runtime apenas para
  descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status de credencial quando relevantes, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para informar disponibilidade
  somente leitura. Retornar `tokenStatus: "available"` (e o campo correspondente de origem)
  é suficiente para comandos no estilo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura informem "configurado, mas indisponível neste caminho
de comando" em vez de falhar ou relatar incorretamente a conta como não configurada.

## Pacotes packs

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

Cada entrada se torna um Plugin. Se o pack listar múltiplas extensões, o ID do Plugin
torna-se `name/<fileBase>`.

Se seu Plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Proteção de segurança: cada entrada de `openclaw.extensions` deve permanecer dentro do diretório do Plugin
após a resolução de symlink. Entradas que escapam do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências do Plugin com
`npm install --omit=dev --ignore-scripts` (sem scripts de ciclo de vida, sem dependências de desenvolvimento em runtime). Mantenha as árvores de dependência do Plugin em "JS/TS puro" e evite pacotes que exigem builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve somente de configuração.
Quando o OpenClaw precisa de superfícies de configuração para um Plugin de canal desabilitado, ou
quando um Plugin de canal está habilitado mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do Plugin. Isso mantém inicialização e configuração mais leves
quando sua entrada principal do Plugin também conecta ferramentas, hooks ou outro código
somente de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode colocar um Plugin de canal no mesmo caminho `setupEntry` durante a fase
de inicialização pré-listen do gateway, mesmo quando o canal já está configurado.

Use isso apenas quando `setupEntry` cobrir totalmente a superfície de inicialização que deve existir
antes de o gateway começar a escutar. Na prática, isso significa que a entrada de configuração
deve registrar toda capacidade pertencente ao canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que devem estar disponíveis antes de o gateway começar a escutar
- quaisquer métodos, ferramentas ou serviços do gateway que devem existir durante essa mesma janela

Se sua entrada completa ainda for proprietária de qualquer capacidade de inicialização exigida, não habilite
esse sinalizador. Mantenha o Plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais incluídos também podem publicar helpers de superfície de contrato somente de configuração que o core
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual
de promoção de configuração é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O core usa essa superfície quando precisa promover uma configuração legada de canal de conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do Plugin.
Matrix é o exemplo incluído atual: ele move apenas chaves de autenticação/bootstrap para uma
conta promovida com nome quando contas nomeadas já existem, e pode preservar uma
chave configurada não canônica de conta padrão em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de configuração mantêm preguiçosa a descoberta de superfície de contrato incluída. O tempo de importação permanece leve; a superfície de promoção é carregada somente no primeiro uso, em vez de reentrar na inicialização do canal incluído na importação do módulo.

Quando essas superfícies de inicialização incluem métodos RPC do gateway, mantenha-os em um
prefixo específico do Plugin. Namespaces de admin do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre são resolvidos
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
      "blurb": "Chat autohospedado por bots de Webhook do Nextcloud Talk.",
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
- `docsLabel`: substitui o texto do link para a documentação
- `preferOver`: IDs de Plugin/canal de menor prioridade que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com Markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de configuração/configure quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: opta o canal pelo fluxo padrão de quickstart `allowFrom`
- `forceAccountBinding`: exige vínculo explícito de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca de sessão ao resolver destinos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canal** (por exemplo, uma exportação
de registro MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto são proprietários da orquestração do contexto de sessão para ingestão, montagem
e Compaction. Registre-os a partir do seu Plugin com
`api.registerContextEngine(id, factory)` e depois selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu Plugin precisar substituir ou estender o pipeline de contexto
padrão em vez de apenas adicionar pesquisa de memória ou hooks.

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

Se seu mecanismo **não** for o proprietário do algoritmo de Compaction, mantenha `compact()`
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

Quando um Plugin precisa de um comportamento que não se encaixa na API atual, não contorne
o sistema de Plugins com um acesso privado. Adicione a capacidade que falta.

Sequência recomendada:

1. defina o contrato do core
   Decida de qual comportamento compartilhado o core deve ser proprietário: política, fallback, mesclagem de configuração,
   ciclo de vida, semântica voltada ao canal e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de Plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada útil de capacidade.
3. conecte consumidores do core + canal/recurso
   Canais e Plugins de recurso devem consumir a nova capacidade pelo core,
   não importando diretamente uma implementação de vendor.
4. registre implementações de vendor
   Plugins de vendor então registram seus backends em relação à capacidade.
5. adicione cobertura de contrato
   Adicione testes para que a forma de propriedade e registro permaneça explícita ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar rigidamente acoplado à visão de mundo de
um único provider. Consulte o [Capability Cookbook](/pt-BR/plugins/architecture)
para um checklist concreto de arquivos e um exemplo completo.

### Checklist de capacidade

Quando você adiciona uma nova capacidade, a implementação normalmente deve tocar
essas superfícies em conjunto:

- tipos de contrato do core em `src/<capability>/types.ts`
- runner/helper de runtime do core em `src/<capability>/runtime.ts`
- superfície de registro da API de Plugin em `src/plugins/types.ts`
- conexão do registro de Plugins em `src/plugins/registry.ts`
- exposição de runtime de Plugin em `src/plugins/runtime/*` quando Plugins de recurso/canal
  precisam consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação para operador/Plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso geralmente é um sinal de que a capacidade
ainda não está totalmente integrada.

### Template de capacidade

Padrão mínimo:

```ts
// contrato do core
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API de Plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper compartilhado de runtime para Plugins de recurso/canal
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

- o core é proprietário do contrato de capacidade + orquestração
- Plugins de vendor são proprietários das implementações de vendor
- Plugins de recurso/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita

## Relacionado

- [Arquitetura de Plugins](/pt-BR/plugins/architecture) — modelo público de capacidades e formatos
- [Subcaminhos do SDK de Plugin](/pt-BR/plugins/sdk-subpaths)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Criando Plugins](/pt-BR/plugins/building-plugins)
