---
read_when:
    - Criando ou depurando plugins nativos do OpenClaw
    - Entendendo o modelo de capability de plugin ou os limites de propriedade
    - Trabalhando no pipeline de carregamento de plugins ou no registro
    - Implementando hooks de runtime de provider ou plugins de canal
sidebarTitle: Internals
summary: 'Internals do plugin: modelo de capability, propriedade, contratos, pipeline de carregamento e helpers de runtime'
title: Internals do plugin
x-i18n:
    generated_at: "2026-04-06T03:11:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: d39158455701dedfb75f6c20b8c69fd36ed9841f1d92bed1915f448df57fd47b
    source_path: plugins/architecture.md
    workflow: 15
---

# Internals do plugin

<Info>
  Esta é a **referência de arquitetura profunda**. Para guias práticos, consulte:
  - [Instalar e usar plugins](/pt-BR/tools/plugin) — guia do usuário
  - [Primeiros passos](/pt-BR/plugins/building-plugins) — primeiro tutorial de plugin
  - [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — crie um canal de mensagens
  - [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) — crie um provider de modelo
  - [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — mapa de importação e API de registro
</Info>

Esta página cobre a arquitetura interna do sistema de plugins do OpenClaw.

## Modelo público de capability

Capabilities são o modelo público de **plugin nativo** dentro do OpenClaw. Todo
plugin nativo do OpenClaw registra uma ou mais capability types:

| Capability             | Método de registro                             | Plugins de exemplo                   |
| ---------------------- | ---------------------------------------------- | ------------------------------------ |
| Inferência de texto    | `api.registerProvider(...)`                    | `openai`, `anthropic`                |
| Fala                   | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`            |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                          |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`       | `openai`                             |
| Entendimento de mídia  | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                   |
| Geração de imagem      | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Geração de música      | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                  |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`     | `qwen`                               |
| Busca na web           | `api.registerWebFetchProvider(...)`            | `firecrawl`                          |
| Pesquisa na web        | `api.registerWebSearchProvider(...)`           | `google`                             |
| Canal / mensagens      | `api.registerChannel(...)`                     | `msteams`, `matrix`                  |

Um plugin que registra zero capabilities, mas fornece hooks, ferramentas ou
serviços, é um plugin **legado somente com hooks**. Esse padrão continua totalmente compatível.

### Posição de compatibilidade externa

O modelo de capability já está implementado no core e é usado por plugins
empacotados/nativos hoje, mas a compatibilidade com plugins externos ainda exige um critério mais rigoroso do que "está
exportado, portanto está congelado".

Diretriz atual:

- **plugins externos existentes:** mantenha integrações baseadas em hooks funcionando; trate
  isso como a linha de base de compatibilidade
- **novos plugins empacotados/nativos:** prefira registro explícito de capability em vez de
  acoplamentos específicos de fornecedor ou novos designs somente com hooks
- **plugins externos adotando registro de capability:** permitido, mas trate as
  superfícies helper específicas de capability como evolutivas, a menos que a documentação marque explicitamente um contrato como estável

Regra prática:

- APIs de registro de capability são a direção pretendida
- hooks legados continuam sendo o caminho mais seguro sem quebra para plugins externos durante
  a transição
- subpaths helper exportados não são todos iguais; prefira o contrato estreito documentado,
  não exports helper incidentais

### Formas de plugin

O OpenClaw classifica cada plugin carregado em uma forma com base em seu
comportamento real de registro (não apenas em metadados estáticos):

- **plain-capability** -- registra exatamente um capability type (por exemplo, um
  plugin somente de provider como `mistral`)
- **hybrid-capability** -- registra vários capability types (por exemplo,
  `openai` é dono de inferência de texto, fala, entendimento de mídia e geração
  de imagem)
- **hook-only** -- registra apenas hooks (tipados ou personalizados), sem capabilities,
  ferramentas, comandos ou serviços
- **non-capability** -- registra ferramentas, comandos, serviços ou rotas, mas nenhuma
  capability

Use `openclaw plugins inspect <id>` para ver a forma de um plugin e a
distribuição de capabilities. Consulte a [referência da CLI](/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como caminho de compatibilidade para
plugins somente com hooks. Plugins legados do mundo real ainda dependem dele.

Direção:

- mantenha funcionando
- documente-o como legado
- prefira `before_model_resolve` para trabalho de substituição de modelo/provider
- prefira `before_prompt_build` para trabalho de mutação de prompt
- remova-o somente depois que o uso real cair e a cobertura de fixtures comprovar a segurança da migração

### Sinais de compatibilidade

Quando você executa `openclaw doctor` ou `openclaw plugins inspect <id>`, pode ver
um destes rótulos:

| Sinal                      | Significado                                                 |
| -------------------------- | ----------------------------------------------------------- |
| **config valid**           | A configuração é analisada corretamente e os plugins são resolvidos |
| **compatibility advisory** | O plugin usa um padrão compatível, mas mais antigo (por exemplo, `hook-only`) |
| **legacy warning**         | O plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**             | A configuração é inválida ou o plugin não pôde ser carregado |

Nem `hook-only` nem `before_agent_start` quebrarão seu plugin hoje --
`hook-only` é apenas consultivo, e `before_agent_start` só dispara um aviso. Esses
sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

1. **Manifesto + descoberta**
   O OpenClaw encontra plugins candidatos em caminhos configurados, raízes de workspace,
   raízes globais de extensão e extensões empacotadas. A descoberta lê primeiro
   manifestos nativos `openclaw.plugin.json` e manifestos de bundle compatíveis.
2. **Habilitação + validação**
   O core decide se um plugin descoberto está habilitado, desabilitado, bloqueado ou
   selecionado para um slot exclusivo, como memória.
3. **Carregamento em runtime**
   Plugins nativos do OpenClaw são carregados in-process via jiti e registram
   capabilities em um registro central. Bundles compatíveis são normalizados em
   registros do registro sem importar código de runtime.
4. **Consumo da superfície**
   O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração de provider,
   hooks, rotas HTTP, comandos de CLI e serviços.

Especificamente para a CLI de plugin, a descoberta de comandos raiz é dividida em duas fases:

- metadados em tempo de parsing vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do plugin pode permanecer lazy e registrar na primeira invocação

Isso mantém o código da CLI pertencente ao plugin dentro do plugin, ao mesmo tempo que ainda permite ao OpenClaw
reservar nomes de comando raiz antes do parsing.

O limite de design importante:

- descoberta + validação de configuração devem funcionar a partir de **metadados de manifesto/schema**
  sem executar código do plugin
- comportamento nativo em runtime vem do caminho `register(api)` do módulo do plugin

Essa divisão permite ao OpenClaw validar configuração, explicar plugins ausentes/desabilitados e
construir dicas de UI/schema antes que o runtime completo esteja ativo.

### Plugins de canal e a ferramenta compartilhada de mensagens

Plugins de canal não precisam registrar uma ferramenta separada de enviar/editar/reagir para
ações normais de chat. O OpenClaw mantém uma ferramenta `message` compartilhada no core, e
plugins de canal são donos da descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o core é dono do host da ferramenta compartilhada `message`, da integração de prompt, do
  controle de sessão/thread e do despacho de execução
- plugins de canal são donos da descoberta de ações com escopo, da descoberta de capabilities e de quaisquer
  fragmentos de schema específicos do canal
- plugins de canal são donos da gramática específica do provider para conversa de sessão, como
  IDs de conversa codificam IDs de thread ou herdam de conversas pai
- plugins de canal executam a ação final por meio de seu adapter de ação

Para plugins de canal, a superfície do SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta
permite que um plugin retorne suas ações visíveis, capabilities e contribuições de schema
juntas para que essas partes não se desalinhem.

O core passa escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` confiável de entrada

Isso importa para plugins sensíveis ao contexto. Um canal pode ocultar ou expor
ações de mensagem com base na conta ativa, na sala/thread/mensagem atual ou
na identidade confiável do solicitante, sem codificar branches específicos de canal na ferramenta
`message` do core.

É por isso que mudanças de roteamento do embedded-runner ainda são trabalho do plugin: o runner é
responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta do plugin
para que a ferramenta compartilhada `message` exponha a superfície correta pertencente ao canal
para o turno atual.

Para helpers de execução pertencentes ao canal, plugins empacotados devem manter o runtime de execução
dentro de seus próprios módulos de extensão. O core não é mais dono dos
runtimes de ação de mensagem de Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`.
Nós não publicamos subpaths separados `plugin-sdk/*-action-runtime`, e plugins empacotados
devem importar seu próprio código local de runtime diretamente de seus
módulos pertencentes à extensão.

O mesmo limite se aplica a seams do SDK nomeados por provider em geral: o core não
deve importar barrels de conveniência específicos de canal para Slack, Discord, Signal,
WhatsApp ou extensões semelhantes. Se o core precisar de um comportamento, ou consome o
próprio barrel `api.ts` / `runtime-api.ts` do plugin empacotado ou promove a necessidade
para uma capability genérica estreita no SDK compartilhado.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a linha de base compartilhada para canais que se encaixam no modelo comum
  de enquete
- `actions.handleAction("poll")` é o caminho preferido para semântica de enquete específica do canal
  ou parâmetros extras de enquete

Agora o core adia o parsing compartilhado de enquete até depois que o despacho de enquete do plugin
recusa a ação, para que handlers de enquete pertencentes ao plugin possam aceitar
campos específicos do canal sem serem bloqueados primeiro pelo parser genérico de enquetes.

Consulte [Pipeline de carregamento](#load-pipeline) para ver a sequência completa de inicialização.

## Modelo de propriedade de capability

O OpenClaw trata um plugin nativo como o limite de propriedade de uma **empresa** ou de
uma **feature**, não como um amontoado de integrações não relacionadas.

Isso significa:

- um plugin de empresa normalmente deve ser dono de todas as superfícies do OpenClaw
  dessa empresa
- um plugin de feature normalmente deve ser dono da superfície completa da feature que introduz
- canais devem consumir capabilities compartilhadas do core em vez de reimplementar
  comportamento de provider de forma ad hoc

Exemplos:

- o plugin empacotado `openai` é dono do comportamento de model-provider da OpenAI e do comportamento
  de OpenAI speech + realtime-voice + media-understanding + image-generation
- o plugin empacotado `elevenlabs` é dono do comportamento de fala da ElevenLabs
- o plugin empacotado `microsoft` é dono do comportamento de fala da Microsoft
- o plugin empacotado `google` é dono do comportamento de model-provider do Google mais
  o comportamento de Google media-understanding + image-generation + web-search
- o plugin empacotado `firecrawl` é dono do comportamento de web-fetch da Firecrawl
- os plugins empacotados `minimax`, `mistral`, `moonshot` e `zai` são donos de seus
  backends de media-understanding
- o plugin `voice-call` é um plugin de feature: ele é dono do transporte de chamadas, de ferramentas,
  da CLI, de rotas e da ponte de media-stream da Twilio, mas consome
  capabilities compartilhadas de fala + realtime-transcription + realtime-voice em vez de
  importar plugins de fornecedor diretamente

O estado final pretendido é:

- OpenAI vive em um único plugin mesmo se abranger modelos de texto, fala, imagens e
  vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual plugin de fornecedor é dono do provider; eles consomem o
  contrato de capability compartilhado exposto pelo core

Esta é a distinção principal:

- **plugin** = limite de propriedade
- **capability** = contrato do core que vários plugins podem implementar ou consumir

Então, se o OpenClaw adicionar um novo domínio, como vídeo, a primeira pergunta não é
"qual provider deve codificar tratamento de vídeo?" A primeira pergunta é "qual é
o contrato de capability de vídeo do core?" Quando esse contrato existir, plugins de fornecedor
poderão registrá-lo e plugins de canal/feature poderão consumi-lo.

Se a capability ainda não existir, a jogada certa normalmente é:

1. definir a capability ausente no core
2. expô-la pela API/runtime de plugin de forma tipada
3. integrar canais/features a essa capability
4. deixar plugins de fornecedor registrarem implementações

Isso mantém a propriedade explícita e evita comportamento no core que dependa de um
único fornecedor ou de um caminho de código específico de plugin pontual.

### Estratificação de capabilities

Use este modelo mental ao decidir onde o código deve ficar:

- **camada de capability do core**: orquestração compartilhada, política, fallback, regras de merge
  de configuração, semântica de entrega e contratos tipados
- **camada de plugin de fornecedor**: APIs específicas do fornecedor, autenticação, catálogos de modelo, síntese
  de fala, geração de imagem, backends futuros de vídeo, endpoints de uso
- **camada de plugin de canal/feature**: integração com Slack/Discord/voice-call/etc.
  que consome capabilities do core e as apresenta em uma superfície

Por exemplo, TTS segue este formato:

- o core é dono da política de TTS no momento da resposta, da ordem de fallback, das preferências e da entrega por canal
- `openai`, `elevenlabs` e `microsoft` são donos das implementações de síntese
- `voice-call` consome o helper de runtime de TTS para telefonia

Esse mesmo padrão deve ser preferido para capabilities futuras.

### Exemplo de plugin de empresa com várias capabilities

Um plugin de empresa deve parecer coeso por fora. Se o OpenClaw tiver contratos compartilhados para
modelos, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia,
geração de imagem, geração de vídeo, busca na web e pesquisa na web,
um fornecedor pode ser dono de todas as suas superfícies em um só lugar:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // hooks de autenticação/catálogo de modelo/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // config de fala do fornecedor — implemente diretamente a interface SpeechProviderPlugin
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // lógica de credencial + fetch
      }),
    );
  },
};

export default plugin;
```

O que importa não são os nomes exatos dos helpers. A forma é o que importa:

- um plugin é dono da superfície do fornecedor
- o core ainda é dono dos contratos de capability
- canais e plugins de feature consomem helpers `api.runtime.*`, não código do fornecedor
- testes de contrato podem afirmar que o plugin registrou as capabilities que
  afirma possuir

### Exemplo de capability: entendimento de vídeo

O OpenClaw já trata entendimento de imagem/áudio/vídeo como uma capability compartilhada.
O mesmo modelo de propriedade se aplica aqui:

1. o core define o contrato de media-understanding
2. plugins de fornecedor registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. canais e plugins de feature consomem o comportamento compartilhado do core em vez de
   se conectar diretamente ao código do fornecedor

Isso evita incorporar no core as suposições de vídeo de um único provider. O plugin é dono
da superfície do fornecedor; o core é dono do contrato de capability e do comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o core é dono do contrato tipado de
capability e do helper de runtime, e plugins de fornecedor registram
implementações `api.registerVideoGenerationProvider(...)` para ele.

Precisa de um checklist concreto de rollout? Consulte
[Capability Cookbook](/pt-BR/plugins/architecture).

## Contratos e aplicação

A superfície da API de plugin é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e
os helpers de runtime nos quais um plugin pode confiar.

Por que isso importa:

- autores de plugin obtêm um padrão interno estável
- o core pode rejeitar propriedade duplicada, como dois plugins registrando o mesmo
  ID de provider
- a inicialização pode expor diagnósticos acionáveis para registros malformados
- testes de contrato podem aplicar a propriedade de plugins empacotados e evitar desvio silencioso

Há duas camadas de aplicação:

1. **aplicação de registro em runtime**
   O registro de plugins valida registros à medida que plugins são carregados. Exemplos:
   IDs duplicados de provider, IDs duplicados de speech provider e registros
   malformados produzem diagnósticos de plugin em vez de comportamento indefinido.
2. **testes de contrato**
   Plugins empacotados são capturados em registros de contrato durante execuções de teste, para que
   o OpenClaw possa afirmar a propriedade explicitamente. Hoje isso é usado para
   model providers, speech providers, web search providers e propriedade de registro empacotado.

O efeito prático é que o OpenClaw sabe antecipadamente qual plugin é dono de qual
superfície. Isso permite que o core e os canais componham sem atrito porque a propriedade é
declarada, tipada e testável, em vez de implícita.

### O que pertence a um contrato

Bons contratos de plugin são:

- tipados
- pequenos
- específicos de capability
- pertencentes ao core
- reutilizáveis por vários plugins
- consumíveis por canais/features sem conhecimento do fornecedor

Maus contratos de plugin são:

- política específica de fornecedor escondida no core
- escapatórias pontuais de plugin que contornam o registro
- código de canal acessando diretamente uma implementação de fornecedor
- objetos ad hoc de runtime que não fazem parte de `OpenClawPluginApi` ou
  `api.runtime`

Em caso de dúvida, eleve o nível de abstração: defina primeiro a capability e depois
deixe os plugins se conectarem a ela.

## Modelo de execução

Plugins nativos do OpenClaw executam **in-process** com o Gateway. Eles não são
sandboxed. Um plugin nativo carregado tem o mesmo limite de confiança em nível de processo que
o código do core.

Implicações:

- um plugin nativo pode registrar ferramentas, handlers de rede, hooks e serviços
- um bug em um plugin nativo pode derrubar ou desestabilizar o gateway
- um plugin nativo malicioso equivale a execução arbitrária de código dentro
  do processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente
Skills empacotadas.

Use allowlists e caminhos explícitos de instalação/carregamento para plugins não empacotados. Trate
plugins de workspace como código de desenvolvimento, não como padrões de produção.

Para nomes de pacotes de workspace empacotados, mantenha o ID do plugin ancorado no nome
npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado, como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding`, quando
o pacote intencionalmente expuser um papel de plugin mais estreito.

Observação importante sobre confiança:

- `plugins.allow` confia em **IDs de plugin**, não na origem da fonte.
- Um plugin de workspace com o mesmo ID de um plugin empacotado intencionalmente sombreia
  a cópia empacotada quando esse plugin de workspace está habilitado/na allowlist.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.

## Limite de exportação

O OpenClaw exporta capabilities, não conveniências de implementação.

Mantenha público o registro de capability. Remova exports helper que não fazem parte do contrato:

- subpaths específicos de helper de plugin empacotado
- subpaths de infraestrutura de runtime que não são destinados como API pública
- helpers de conveniência específicos de fornecedor
- helpers de configuração inicial/onboarding que são detalhes de implementação

Alguns subpaths helper de plugins empacotados ainda permanecem no mapa de exportação gerado do SDK
por compatibilidade e manutenção de plugins empacotados. Exemplos atuais incluem
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e vários seams `plugin-sdk/matrix*`. Trate-os como
exports reservados de detalhe de implementação, não como o padrão recomendado do SDK para
novos plugins de terceiros.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes de plugins candidatas
2. lê manifestos nativos ou de bundle compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega módulos nativos habilitados via jiti
7. chama os hooks nativos `register(api)` (ou `activate(api)` — um alias legado) e coleta registros no registro de plugins
8. expõe o registro para superfícies de comando/runtime

<Note>
`activate` é um alias legado de `register` — o loader resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins empacotados usam `register`; prefira `register` para novos plugins.
</Note>

Os gates de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do plugin, o caminho é gravável por qualquer usuário ou a
propriedade do caminho parece suspeita para plugins não empacotados.

### Comportamento manifest-first

O manifesto é a fonte de verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/Skills/schema de configuração declarados ou capabilities do bundle
- validar `plugins.entries.<id>.config`
- complementar rótulos/placeholders da Control UI
- mostrar metadados de instalação/catálogo

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
comportamento real, como hooks, ferramentas, comandos ou fluxos de provider.

### O que o loader armazena em cache

O OpenClaw mantém caches curtos in-process para:

- resultados de descoberta
- dados do registro de manifesto
- registros de plugins carregados

Esses caches reduzem rajadas de inicialização e overhead de comandos repetidos. É seguro
pensar neles como caches de desempenho de curta duração, não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desativar esses caches.
- Ajuste as janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não alteram diretamente globais aleatórios do core. Eles se registram em um
registro central de plugins.

O registro rastreia:

- registros de plugin (identidade, fonte, origem, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- providers
- handlers de RPC do gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos pertencentes ao plugin

Recursos do core então leem desse registro em vez de falar com módulos de plugin
diretamente. Isso mantém o carregamento em um único sentido:

- módulo de plugin -> registro no registro
- runtime do core -> consumo do registro

Essa separação é importante para manutenção. Significa que a maioria das superfícies do core só
precisa de um ponto de integração: "ler o registro", não "tratar cada módulo de plugin
de forma especial".

## Callbacks de vínculo de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma solicitação de vínculo é aprovada ou negada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Agora existe um vínculo para este plugin + conversa.
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
- `binding`: o vínculo resolvido para solicitações aprovadas
- `request`: o resumo original da solicitação, dica de detach, ID do remetente e
  metadados da conversa

Esse callback é apenas de notificação. Ele não altera quem tem permissão para vincular uma
conversa e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provider

Plugins de provider agora têm duas camadas:

- metadados de manifesto: `providerAuthEnvVars` para busca barata de autenticação via env antes do
  carregamento do runtime, além de `providerAuthChoices` para rótulos baratos de onboarding/escolha de autenticação
  e metadados de flags de CLI antes do carregamento do runtime
- hooks em tempo de configuração: `catalog` / legado `discovery` mais `applyConfigDefaults`
- hooks de runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

O OpenClaw ainda é dono do loop genérico do agente, failover, tratamento de transcrição e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de provider sem
precisar de um transporte de inferência totalmente personalizado.

Use o manifesto `providerAuthEnvVars` quando o provider tiver credenciais baseadas em env
que caminhos genéricos de autenticação/status/seletor de modelo devam enxergar sem carregar o runtime do plugin.
Use o manifesto `providerAuthChoices` quando superfícies de onboarding/escolha de autenticação na CLI
precisarem conhecer o ID da escolha do provider, rótulos de grupo e integração simples de autenticação
com uma única flag sem carregar o runtime do provider. Mantenha `envVars` de runtime do provider
para dicas voltadas ao operador, como rótulos de onboarding ou variáveis de
configuração de client-id/client-secret OAuth.

### Ordem e uso dos hooks

Para plugins de modelo/provider, o OpenClaw chama hooks aproximadamente nesta ordem.
A coluna "Quando usar" é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                              | Quando usar                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica configuração do provider em `models.providers` durante a geração de `models.json` | O provider é dono de um catálogo ou de padrões de base URL                                                                              |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração pertencentes ao provider durante a materialização da configuração | Os padrões dependem do modo de autenticação, env ou semântica da família de modelos do provider                                          |
| --  | _(busca interna de modelo)_       | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                        | _(não é um hook de plugin)_                                                                                                               |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de prévia de IDs de modelo antes da busca                 | O provider é dono da limpeza de aliases antes da resolução canônica do modelo                                                             |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provider antes da montagem genérica do modelo | O provider é dono da limpeza de transporte para IDs de provider personalizados na mesma família de transporte                             |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provider               | O provider precisa de limpeza de configuração que deve ficar no plugin; helpers empacotados da família Google também dão suporte a entradas de configuração Google compatíveis |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo a providers de configuração | O provider precisa de correções de metadados de uso nativo orientadas por endpoint                                                        |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador env para providers de configuração antes do carregamento da autenticação de runtime | O provider tem resolução de API key por marcador env pertencente ao provider; `amazon-bedrock` também tem um resolvedor interno de marcador env AWS aqui |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/self-hosted ou apoiada por configuração sem persistir texto simples | O provider pode operar com um marcador de credencial sintético/local                                                                      |
| 9   | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders sintéticos armazenados de perfil abaixo de autenticação apoiada por env/config | O provider armazena perfis sintéticos placeholder que não devem ter precedência                                                           |
| 10  | `resolveDynamicModel`             | Fallback síncrono para IDs de modelo pertencentes ao provider que ainda não estão no registro local | O provider aceita IDs arbitrários de modelos upstream                                                                                     |
| 11  | `prepareDynamicModel`             | Aquecimento assíncrono; depois `resolveDynamicModel` roda novamente                    | O provider precisa de metadados de rede antes de resolver IDs desconhecidos                                                               |
| 12  | `normalizeResolvedModel`          | Reescrita final antes que o embedded runner use o modelo resolvido                     | O provider precisa de reescritas de transporte, mas ainda usa um transporte do core                                                       |
| 13  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos de fornecedor atrás de outro transporte compatível | O provider reconhece seus próprios modelos em transportes proxy sem assumir o provider                                                    |
| 14  | `capabilities`                    | Metadados de transcrição/ferramentas pertencentes ao provider usados pela lógica compartilhada do core | O provider precisa de particularidades de transcrição/família de provider                                                                 |
| 15  | `normalizeToolSchemas`            | Normaliza schemas de ferramentas antes que o embedded runner os veja                   | O provider precisa de limpeza de schema da família de transporte                                                                          |
| 16  | `inspectToolSchemas`              | Expõe diagnósticos de schema pertencentes ao provider após a normalização              | O provider quer avisos de palavra-chave sem ensinar regras específicas de provider ao core                                                |
| 17  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de reasoning nativo vs marcado                             | O provider precisa de saída final/reasoning marcada em vez de campos nativos                                                              |
| 18  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes de wrappers genéricos de opções de stream | O provider precisa de parâmetros padrão de requisição ou limpeza de parâmetros por provider                                               |
| 19  | `createStreamFn`                  | Substitui totalmente o caminho normal de stream por um transporte personalizado        | O provider precisa de um protocolo de fio personalizado, não apenas de um wrapper                                                         |
| 20  | `wrapStreamFn`                    | Wrapper de stream depois que wrappers genéricos são aplicados                          | O provider precisa de wrappers de compatibilidade de headers/corpo/modelo de requisição sem um transporte personalizado                   |
| 21  | `resolveTransportTurnState`       | Anexa headers ou metadados nativos por turno ao transporte                             | O provider quer que transportes genéricos enviem identidade nativa de turno do provider                                                   |
| 22  | `resolveWebSocketSessionPolicy`   | Anexa headers nativos de WebSocket ou política de cooldown de sessão                   | O provider quer que transportes WS genéricos ajustem headers de sessão ou política de fallback                                            |
| 23  | `formatApiKey`                    | Formatador de perfil de autenticação: perfil armazenado se torna a string `apiKey` de runtime | O provider armazena metadados extras de autenticação e precisa de um formato personalizado de token em runtime                            |
| 24  | `refreshOAuth`                    | Substituição de refresh OAuth para endpoints de refresh personalizados ou política de falha de refresh | O provider não se encaixa nos refreshers compartilhados de `pi-ai`                                                                        |
| 25  | `buildAuthDoctorHint`             | Dica de reparo anexada quando o refresh OAuth falha                                    | O provider precisa de orientação de reparo de autenticação pertencente ao provider após falha de refresh                                  |
| 26  | `matchesContextOverflowError`     | Matcher de overflow de janela de contexto pertencente ao provider                      | O provider tem erros brutos de overflow que heurísticas genéricas deixariam passar                                                        |
| 27  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provider                            | O provider pode mapear erros brutos de API/transporte para rate-limit/sobrecarga/etc.                                                     |
| 28  | `isCacheTtlEligible`              | Política de prompt-cache para providers proxy/backhaul                                 | O provider precisa de gating de TTL de cache específico de proxy                                                                          |
| 29  | `buildMissingAuthMessage`         | Substituição para a mensagem genérica de recuperação de autenticação ausente           | O provider precisa de uma dica de recuperação de autenticação ausente específica do provider                                               |
| 30  | `suppressBuiltInModel`            | Supressão de modelo upstream obsoleto mais dica opcional de erro voltada ao usuário    | O provider precisa ocultar linhas upstream obsoletas ou substituí-las por uma dica do fornecedor                                          |
| 31  | `augmentModelCatalog`             | Linhas de catálogo sintéticas/finais anexadas após a descoberta                        | O provider precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                            |
| 32  | `isBinaryThinking`                | Alternância on/off de reasoning para providers de binary-thinking                      | O provider expõe apenas reasoning binário ligado/desligado                                                                                |
| 33  | `supportsXHighThinking`           | Suporte a reasoning `xhigh` para modelos selecionados                                  | O provider quer `xhigh` apenas em um subconjunto de modelos                                                                               |
| 34  | `resolveDefaultThinkingLevel`     | Nível padrão de `/think` para uma família específica de modelos                        | O provider é dono da política padrão de `/think` para uma família de modelos                                                              |
| 35  | `isModernModelRef`                | Matcher de modelo moderno para filtros de perfil ao vivo e seleção smoke               | O provider é dono da correspondência de modelo preferido ao vivo/smoke                                                                    |
| 36  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime pouco antes da inferência | O provider precisa de troca de token ou de credencial de requisição de curta duração                                                     |
| 37  | `resolveUsageAuth`                | Resolve credenciais de uso/faturamento para `/usage` e superfícies de status relacionadas | O provider precisa de parsing personalizado de token de uso/cota ou de uma credencial de uso diferente                                   |
| 38  | `fetchUsageSnapshot`              | Busca e normaliza snapshots de uso/cota específicos do provider depois que a autenticação é resolvida | O provider precisa de um endpoint específico de uso ou de um parser específico de payload                                                |
| 39  | `createEmbeddingProvider`         | Constrói um adapter de embedding pertencente ao provider para memória/pesquisa         | O comportamento de embeddings de memória pertence ao plugin do provider                                                                   |
| 40  | `buildReplayPolicy`               | Retorna uma política de replay controlando o tratamento de transcrição para o provider | O provider precisa de uma política personalizada de transcrição (por exemplo, remoção de blocos de thinking)                             |
| 41  | `sanitizeReplayHistory`           | Reescreve o histórico de replay após a limpeza genérica da transcrição                 | O provider precisa de reescritas específicas de provider no replay além dos helpers compartilhados de compactação                        |
| 42  | `validateReplayTurns`             | Validação ou remodelagem final de turnos de replay antes do embedded runner            | O transporte do provider precisa de validação mais rígida de turnos após a sanitização genérica                                           |
| 43  | `onModelSelected`                 | Executa efeitos colaterais pós-seleção pertencentes ao provider                        | O provider precisa de telemetria ou estado pertencente ao provider quando um modelo fica ativo                                            |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
plugin de provider correspondente e depois percorrem outros plugins de provider com suporte a hooks
até que um realmente altere o ID do modelo ou transporte/configuração. Isso mantém
shims de provider de alias/compatibilidade funcionando sem exigir que o chamador saiba qual
plugin empacotado é dono da reescrita. Se nenhum hook de provider reescrever uma entrada
compatível de configuração da família Google, o normalizador empacotado de configuração do Google ainda aplica
essa limpeza de compatibilidade.

Se o provider precisar de um protocolo de fio totalmente personalizado ou de um executor
personalizado de requisição, isso é uma classe diferente de extensão. Esses hooks servem para comportamento de provider
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

### Exemplos internos

- Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  e `wrapStreamFn` porque é dona da compatibilidade futura do Claude 4.6,
  das dicas de família do provider, da orientação de reparo de autenticação, da integração
  com endpoint de uso, da elegibilidade de prompt-cache, de padrões de configuração sensíveis à autenticação,
  da política padrão/adaptativa de thinking do Claude
  e da modelagem de stream específica da Anthropic para headers beta,
  `/fast` / `serviceTier` e `context1m`.
- Os helpers de stream específicos do Claude da Anthropic permanecem, por enquanto, no
  seam público `api.ts` / `contract-api.ts` do próprio plugin empacotado. Essa superfície
  de pacote exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os builders de wrapper
  de Anthropic de nível mais baixo, em vez de ampliar o SDK genérico em torno das regras
  de beta-header de um único provider.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities`, além de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`,
  porque é dona da compatibilidade futura do GPT-5.4, da normalização direta
  `openai-completions` -> `openai-responses`, das dicas de autenticação sensíveis ao Codex,
  da supressão do Spark, de linhas sintéticas de lista OpenAI e da política de thinking /
  modelo ao vivo do GPT-5; a família de stream `openai-responses-defaults` é dona dos
  wrappers compartilhados nativos de OpenAI Responses para headers de atribuição,
  `/fast`/`serviceTier`, verbosidade de texto, pesquisa web nativa do Codex,
  modelagem de payload de compatibilidade de reasoning e gerenciamento de contexto de Responses.
- OpenRouter usa `catalog`, além de `resolveDynamicModel` e
  `prepareDynamicModel`, porque o provider é pass-through e pode expor novos
  IDs de modelo antes que o catálogo estático do OpenClaw seja atualizado; também usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para manter
  headers de requisição específicos do provider, metadados de roteamento, patches de reasoning e
  política de prompt-cache fora do core. Sua política de replay vem da família
  `passthrough-gemini`, enquanto a família de stream `openrouter-thinking`
  é dona da injeção de reasoning de proxy e dos skips de modelo incompatível / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities`, além de `prepareRuntimeAuth` e `fetchUsageSnapshot`, porque
  precisa de login de dispositivo pertencente ao provider, comportamento de fallback de modelo,
  particularidades de transcrição do Claude, uma troca de token GitHub -> token Copilot
  e um endpoint de uso pertencente ao provider.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog`, além de
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot`, porque
  ainda roda nos transportes OpenAI do core, mas é dono da sua normalização de
  transporte/base URL, da política de fallback de refresh OAuth, da escolha de transporte padrão,
  de linhas sintéticas de catálogo do Codex e da integração com endpoint de uso do ChatGPT; ele
  compartilha a mesma família de stream `openai-responses-defaults` da OpenAI direta.
- Google AI Studio e Gemini CLI OAuth usam `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque a
  família de replay `google-gemini` é dona do fallback de compatibilidade futura do Gemini 3.1,
  da validação nativa de replay do Gemini, da sanitização de replay de bootstrap,
  do modo de saída de reasoning marcado e da correspondência de modelo moderno, enquanto a
  família de stream `google-thinking` é dona da normalização de payload de thinking do Gemini;
  Gemini CLI OAuth também usa `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` para formatação de token, parsing de token e integração com endpoint de cota.
- Anthropic Vertex usa `buildReplayPolicy` por meio da família de replay
  `anthropic-by-model`, para que a limpeza de replay específica do Claude fique
  restrita a IDs Claude, e não a todo transporte `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel` porque é dona da classificação
  específica do Bedrock para erros de throttle/not-ready/context-overflow
  em tráfego Anthropic-on-Bedrock; sua política de replay ainda compartilha a mesma
  guarda `anthropic-by-model` apenas para Claude.
- OpenRouter, Kilocode, Opencode e Opencode Go usam `buildReplayPolicy`
  por meio da família de replay `passthrough-gemini` porque fazem proxy de
  modelos Gemini por transportes compatíveis com OpenAI e precisam de
  sanitização de thought-signature do Gemini sem validação nativa de replay do Gemini nem
  reescritas de bootstrap.
- MiniMax usa `buildReplayPolicy` por meio da família de replay
  `hybrid-anthropic-openai` porque um provider é dono tanto da semântica
  anthropric-message quanto da semântica compatível com OpenAI; ele mantém a remoção
  de thinking-block apenas do Claude no lado Anthropic enquanto substitui o modo de saída de
  reasoning de volta para nativo, e a família de stream `minimax-fast-mode` é dona das reescritas de modelo
  fast-mode no caminho compartilhado de stream.
- Moonshot usa `catalog` e `wrapStreamFn` porque ainda usa o transporte
  OpenAI compartilhado, mas precisa de normalização de payload de thinking pertencente ao provider; a
  família de stream `moonshot-thinking` mapeia configuração + estado `/think` para seu payload
  nativo de thinking binário.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque precisa de headers de requisição pertencentes ao provider,
  normalização de payload de reasoning, dicas de transcrição do Gemini e gating
  de cache-TTL da Anthropic; a família de stream `kilocode-thinking` mantém a injeção
  de Kilo thinking no caminho compartilhado de stream proxy, pulando `kilo/auto` e
  outros IDs de modelo proxy que não suportam payload explícito de reasoning.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` porque é dona do fallback GLM-5,
  dos padrões `tool_stream`, da UX de thinking binário, da correspondência de modelo moderno
  e tanto da autenticação de uso quanto da busca de cota; a família de stream
  `tool-stream-default-on` mantém o wrapper padrão-ativado `tool_stream` fora da cola manuscrita por provider.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque é dona da normalização nativa do transporte xAI Responses, das reescritas
  de alias fast-mode do Grok, do padrão `tool_stream`, da limpeza de strict-tool /
  reasoning-payload, da reutilização de autenticação de fallback para ferramentas pertencentes ao plugin,
  da resolução de modelo Grok com compatibilidade futura e de patches de compatibilidade pertencentes ao provider, como perfil de tool-schema do xAI,
  palavras-chave de schema não compatíveis, `web_search` nativo e decodificação de
  argumentos de tool-call com entidades HTML.
- Mistral, OpenCode Zen e OpenCode Go usam apenas `capabilities`
  para manter particularidades de transcrição/ferramentas fora do core.
- Providers empacotados somente com catálogo, como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine`, usam
  apenas `catalog`.
- Qwen usa `catalog` para seu provider de texto, além de registros compartilhados de
  media-understanding e video-generation para suas superfícies multimodais.
- MiniMax e Xiaomi usam `catalog` mais hooks de uso porque seu comportamento
  de `/usage` pertence ao plugin, embora a inferência ainda rode pelos transportes compartilhados.

## Helpers de runtime

Plugins podem acessar helpers selecionados do core por `api.runtime`. Para TTS:

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

- `textToSpeech` retorna a carga normal de saída de TTS do core para superfícies de arquivo/mensagem de voz.
- Usa a configuração do core `messages.tts` e a seleção de provider.
- Retorna buffer de áudio PCM + sample rate. Plugins devem reamostrar/codificar para providers.
- `listVoices` é opcional por provider. Use-o para seletores de voz ou fluxos de configuração pertencentes ao fornecedor.
- Listagens de vozes podem incluir metadados mais ricos, como locale, gênero e tags de personalidade para seletores conscientes do provider.
- OpenAI e ElevenLabs suportam telefonia hoje. Microsoft não.

Plugins também podem registrar speech providers via `api.registerSpeechProvider(...)`.

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

- Mantenha política de TTS, fallback e entrega de resposta no core.
- Use speech providers para comportamento de síntese pertencente ao fornecedor.
- A entrada legada Microsoft `edge` é normalizada para o ID de provider `microsoft`.
- O modelo de propriedade preferido é orientado à empresa: um plugin de fornecedor pode ser dono de
  texto, fala, imagem e futuros providers de mídia à medida que o OpenClaw adiciona esses
  contratos de capability.

Para entendimento de imagem/áudio/vídeo, plugins registram um provider tipado único de
media-understanding, em vez de um saco genérico chave/valor:

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

- Mantenha orquestração, fallback, configuração e integração de canal no core.
- Mantenha comportamento do fornecedor no plugin de provider.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos opcionais
  de resultado, novas capabilities opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core é dono do contrato de capability e do helper de runtime
  - plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - plugins de feature/canal consomem `api.runtime.videoGeneration.*`

Para helpers de runtime de media-understanding, plugins podem chamar:

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

Para transcrição de áudio, plugins podem usar o runtime de media-understanding
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
  entendimento de imagem/áudio/vídeo.
- Usa a configuração de áudio de media-understanding do core (`tools.media.audio`) e a ordem de fallback do provider.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não compatível).
- `api.runtime.stt.transcribeAudioFile(...)` continua como alias de compatibilidade.

Plugins também podem iniciar execuções de subagente em segundo plano por `api.runtime.subagent`:

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

- `provider` e `model` são substituições por execução opcionais, não mudanças persistentes de sessão.
- O OpenClaw só honra esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback pertencentes ao plugin, operadores precisam fazer opt-in com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de plugins não confiáveis ainda funcionam, mas solicitações de substituição são rejeitadas em vez de cair silenciosamente em fallback.

Para pesquisa na web, plugins podem consumir o helper compartilhado de runtime em vez de
acessar diretamente a integração da ferramenta do agente:

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

Plugins também podem registrar web-search providers por
`api.registerWebSearchProvider(...)`.

Observações:

- Mantenha seleção de provider, resolução de credenciais e semântica compartilhada de requisição no core.
- Use web-search providers para transportes de pesquisa específicos do fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para plugins de feature/canal que precisam de comportamento de pesquisa sem depender do wrapper da ferramenta do agente.

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
- `listProviders(...)`: lista providers disponíveis de geração de imagem e suas capabilities.

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
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway ou `"plugin"` para autenticação gerenciada por plugin/verificação de webhook.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a requisição.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará erro de carregamento de plugin. Use `api.registerHttpRoute(...)` no lugar.
- Rotas de plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com níveis diferentes de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de auth.
- Rotas `auth: "plugin"` **não** recebem automaticamente escopos de runtime de operador. Elas são para webhooks/verificação de assinatura gerenciados por plugin, não para chamadas privilegiadas de helper do Gateway.
- Rotas `auth: "gateway"` executam dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém escopos de runtime de rota de plugin fixos em `operator.write`, mesmo se o chamador enviar `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo, `trusted-proxy` ou `gateway.auth.mode = "none"` em um ingresso privado) honram `x-openclaw-scopes` apenas quando o header está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas requisições de rota de plugin com identidade, o escopo de runtime cai para `operator.write`
- Regra prática: não assuma que uma rota de plugin com autenticação de gateway seja uma superfície implícita de admin. Se sua rota precisar de comportamento apenas de admin, exija um modo de autenticação com identidade e documente o contrato explícito do header `x-openclaw-scopes`.

## Caminhos de importação do Plugin SDK

Use subpaths do SDK em vez da importação monolítica `openclaw/plugin-sdk` ao
criar plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de plugin.
- `openclaw/plugin-sdk/core` para o contrato compartilhado genérico voltado ao plugin.
- `openclaw/plugin-sdk/config-schema` para o export Zod schema raiz de `openclaw.json`
  (`OpenClawSchema`).
- Primitivas estáveis de canal, como `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` e
  `openclaw/plugin-sdk/webhook-ingress` para integração compartilhada de
  configuração/autenticação/resposta/webhook. `channel-inbound` é a casa compartilhada para debounce, correspondência de menção,
  formatação de envelope e helpers de contexto de envelope de entrada.
  `channel-setup` é o seam estreito de configuração de instalação opcional.
  `setup-runtime` é a superfície de configuração segura para runtime usada por `setupEntry` /
  inicialização adiada, incluindo adapters de patch de configuração seguros para importação.
  `setup-adapter-runtime` é o seam de adapter de configuração de conta sensível a env.
  `setup-tools` é o pequeno seam helper para CLI/arquivo/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subpaths de domínio, como `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` e
  `openclaw/plugin-sdk/directory-runtime` para helpers compartilhados de runtime/configuração.
  `telegram-command-config` é o seam público estreito para normalização/validação de comandos personalizados do Telegram e continua disponível mesmo se a superfície de contrato empacotada do Telegram estiver temporariamente indisponível.
  `text-runtime` é o seam compartilhado de texto/Markdown/logs, incluindo
  remoção de texto visível ao assistente, helpers de renderização/fragmentação Markdown, helpers de redação, helpers de directive-tag e utilitários de texto seguro.
- Seams de canal específicos de aprovação devem preferir um único contrato `approvalCapability` no plugin. O core então lê autenticação, entrega, renderização e comportamento de roteamento nativo de aprovação por meio dessa única capability em vez de misturar comportamento de aprovação em campos não relacionados do plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto e permanece apenas como um
  shim de compatibilidade para plugins mais antigos. Código novo deve importar as
  primitivas genéricas mais estreitas, e o código do repositório não deve adicionar novas importações do
  shim.
- Internals de extensão empacotada permanecem privados. Plugins externos devem usar apenas
  subpaths `openclaw/plugin-sdk/*`. Código/teste do core do OpenClaw pode usar os
  pontos de entrada públicos do repositório sob a raiz de pacote de um plugin, como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e arquivos de escopo estreito, como
  `login-qr-api.js`. Nunca importe `src/*` de um pacote de plugin a partir do core ou de outra extensão.
- Divisão do ponto de entrada do repositório:
  `<plugin-package-root>/api.js` é o barrel de helpers/tipos,
  `<plugin-package-root>/runtime-api.js` é o barrel somente de runtime,
  `<plugin-package-root>/index.js` é a entrada do plugin empacotado
  e `<plugin-package-root>/setup-entry.js` é a entrada do plugin de configuração.
- Exemplos atuais de provider empacotado:
  - Anthropic usa `api.js` / `contract-api.js` para helpers de stream do Claude, como
    `wrapAnthropicProviderStream`, helpers de beta-header e parsing de `service_tier`.
  - OpenAI usa `api.js` para builders de provider, helpers de modelo padrão e builders de provider em tempo real.
  - OpenRouter usa `api.js` para seu builder de provider mais helpers de onboarding/configuração,
    enquanto `register.runtime.js` ainda pode reexportar helpers genéricos
    `plugin-sdk/provider-stream` para uso local do repositório.
- Pontos de entrada públicos carregados por facade preferem o snapshot ativo da configuração de runtime
  quando existir um, e depois recorrem ao arquivo de configuração resolvido em disco quando
  o OpenClaw ainda não estiver servindo um snapshot de runtime.
- Primitivas compartilhadas genéricas continuam sendo o contrato público preferido do SDK. Um pequeno conjunto reservado de compatibilidade de seams helper com marca de canal empacotado ainda existe. Trate-os como seams de manutenção/compatibilidade empacotados, não como novos alvos de importação de terceiros; novos contratos entre canais ainda devem ir para subpaths genéricos `plugin-sdk/*` ou para os barrels locais `api.js` /
  `runtime-api.js` do plugin.

Observação de compatibilidade:

- Evite o barrel raiz `openclaw/plugin-sdk` em código novo.
- Prefira primeiro as primitivas estáveis mais estreitas. Os subpaths mais novos de setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool são o contrato pretendido para novo trabalho em plugins
  empacotados e externos.
  Parsing/correspondência de alvo pertencem a `openclaw/plugin-sdk/channel-targets`.
  Gates de ação de mensagem e helpers de ID de mensagem de reação pertencem a
  `openclaw/plugin-sdk/channel-actions`.
- Barrels helper específicos de extensão empacotada não são estáveis por padrão. Se um
  helper for necessário apenas para uma extensão empacotada, mantenha-o atrás do seam local `api.js` ou `runtime-api.js` da extensão, em vez de promovê-lo para
  `openclaw/plugin-sdk/<extension>`.
- Novos seams helper compartilhados devem ser genéricos, não marcados por canal. Parsing compartilhado de alvo pertence a `openclaw/plugin-sdk/channel-targets`; internals específicos de canal ficam atrás do seam local `api.js` ou `runtime-api.js`
  do plugin proprietário.
- Subpaths específicos de capability, como `image-generation`,
  `media-understanding` e `speech`, existem porque plugins empacotados/nativos os usam
  hoje. Sua presença não significa, por si só, que todo helper exportado seja um contrato externo congelado de longo prazo.

## Schemas da ferramenta de mensagens

Plugins devem ser donos das contribuições de schema específicas de canal em `describeMessageTool(...)`.
Mantenha campos específicos de provider no plugin, não no core compartilhado.

Para fragmentos portáveis de schema compartilhado, reutilize os helpers genéricos exportados por
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para payloads no estilo grade de botões
- `createMessageToolCardSchema()` para payloads estruturados de card

Se um formato de schema só fizer sentido para um provider, defina-o no próprio
código-fonte desse plugin em vez de promovê-lo ao SDK compartilhado.

## Resolução de alvo de canal

Plugins de canal devem ser donos da semântica de alvo específica do canal. Mantenha o host
compartilhado de saída genérico e use a superfície do adapter de mensagens para regras do provider:

- `messaging.inferTargetChatType({ to })` decide se um alvo normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca em diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve pular direto para a resolução do tipo ID, em vez de busca em diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando o
  core precisa de uma resolução final pertencente ao provider após normalização ou após falha de diretório.
- `messaging.resolveOutboundSessionRoute(...)` é dono da construção de rota de sessão específica do provider
  quando um alvo é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes
  de pesquisar pares/grupos.
- Use `looksLikeId` para verificações do tipo "tratar isto como ID de alvo explícito/nativo".
- Use `resolveTarget` para fallback de normalização específico do provider, não para
  pesquisa ampla em diretório.
- Mantenha IDs nativos do provider, como IDs de chat, IDs de thread, JIDs, handles e IDs de sala
  dentro de valores `target` ou parâmetros específicos do provider, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório a partir de configuração devem manter essa lógica no
plugin e reutilizar os helpers compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de pares/grupos baseados em configuração, como:

- pares de DM orientados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de diretório com escopo por conta

Os helpers compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consulta
- aplicação de limite
- helpers de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta específica de canal e normalização de ID devem permanecer na
implementação do plugin.

## Catálogos de provider

Plugins de provider podem definir catálogos de modelo para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provider
- `{ providers }` para várias entradas de provider

Use `catalog` quando o plugin for dono de IDs específicos de modelo do provider, de padrões de base URL
ou de metadados de modelo protegidos por autenticação.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos
providers implícitos internos do OpenClaw:

- `simple`: providers simples com API key ou orientados por env
- `profile`: providers que aparecem quando existem perfis de autenticação
- `paired`: providers que sintetizam várias entradas relacionadas de provider
- `late`: última passagem, depois de outros providers implícitos

Providers posteriores vencem em colisão de chave, então plugins podem intencionalmente substituir
uma entrada de provider interna com o mesmo ID de provider.

Compatibilidade:

- `discovery` continua funcionando como alias legado
- se `catalog` e `discovery` forem registrados, o OpenClaw usa `catalog`

## Inspeção de canal somente leitura

Se seu plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode presumir que credenciais
  estejam totalmente materializadas e pode falhar rapidamente quando segredos exigidos estiverem ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de
  reparo de doctor/configuração não devem precisar materializar credenciais de runtime só para
  descrever a configuração.

Comportamento recomendado para `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de fonte/status de credencial quando relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token só para relatar
  disponibilidade em leitura. Retornar `tokenStatus: "available"` (e o campo de fonte correspondente) é suficiente para comandos do tipo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef mas indisponível no caminho de comando atual.

Isso permite que comandos somente leitura relatem "configurado, mas indisponível neste caminho de comando" em vez de quebrar ou reportar incorretamente a conta como não configurada.

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

Cada entrada vira um plugin. Se o pack listar várias extensões, o ID do plugin
se torna `name/<fileBase>`.

Se seu plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` fique disponível (`npm install` / `pnpm install`).

Proteção de segurança: toda entrada `openclaw.extensions` deve permanecer dentro do diretório do plugin
após resolução de symlink. Entradas que escapam do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências de plugin com
`npm install --omit=dev --ignore-scripts` (sem scripts de ciclo de vida, sem dependências de desenvolvimento em runtime). Mantenha as árvores de dependência
do plugin "JS/TS puro" e evite pacotes que exijam compilações em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve apenas de configuração.
Quando o OpenClaw precisa de superfícies de configuração para um plugin de canal desabilitado, ou
quando um plugin de canal está habilitado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso mantém a inicialização e a configuração mais leves
quando a entrada principal do plugin também conecta ferramentas, hooks ou outro código apenas de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode incluir um plugin de canal no mesmo caminho de `setupEntry` durante a fase de
pré-listen da inicialização do gateway, mesmo quando o canal já está configurado.

Use isso somente quando `setupEntry` cobrir totalmente a superfície de inicialização que deve existir
antes que o gateway comece a escutar. Na prática, isso significa que a entrada de configuração
deve registrar toda capability pertencente ao canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes que o gateway comece a escutar
- quaisquer métodos do gateway, ferramentas ou serviços que precisem existir durante essa mesma janela

Se sua entrada completa ainda for dona de alguma capability exigida na inicialização, não habilite
essa flag. Mantenha o comportamento padrão do plugin e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais empacotados também podem publicar helpers de superfície de contrato apenas de configuração que o core
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual de
promoção de configuração é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O core usa essa superfície quando precisa promover uma configuração legada de canal com conta única para
`channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
Matrix é o exemplo empacotado atual: ele move apenas chaves de autenticação/bootstrap para uma
conta nomeada promovida quando contas nomeadas já existem e pode preservar uma
chave configurada não canônica de conta padrão em vez de sempre criar
`accounts.default`.

Esses patch adapters de configuração mantêm a descoberta lazy da superfície de contrato empacotada. O tempo
de importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso, em vez de
reentrar na inicialização do canal empacotado ao importar o módulo.

Quando essas superfícies de inicialização incluírem métodos RPC do gateway, mantenha-os sob um
prefixo específico do plugin. Namespaces de admin do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre resolvem
para `operator.admin`, mesmo que um plugin solicite um escopo mais estreito.

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
dicas de instalação via `openclaw.install`. Isso mantém os dados de catálogo fora do core.

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
- `docsLabel`: substitui o texto do link para a documentação
- `preferOver`: IDs de plugin/canal de menor prioridade que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de cópia da superfície de seleção
- `markdownCapable`: marca o canal como compatível com Markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de setup/configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação de docs
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: inclui o canal no fluxo padrão de quickstart `allowFrom`
- `forceAccountBinding`: exige vínculo explícito de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca de sessão ao resolver alvos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canal** (por exemplo, uma
exportação de registro MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto são donos da orquestração do contexto da sessão para ingestão, montagem
e compactação. Registre-os em seu plugin com
`api.registerContextEngine(id, factory)` e selecione o engine ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline padrão de contexto, em vez de apenas adicionar busca em memória ou hooks.

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Se seu engine **não** for dono do algoritmo de compactação, mantenha `compact()`
implementado e delegue-o explicitamente:

```ts
import { delegateCompactionToRuntime } from "openclaw/plugin-sdk/core";

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
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Adicionando uma nova capability

Quando um plugin precisar de comportamento que não se encaixe na API atual, não contorne
o sistema de plugins com um alcance privado. Adicione a capability ausente.

Sequência recomendada:

1. defina o contrato do core
   Decida qual comportamento compartilhado o core deve possuir: política, fallback, merge de configuração,
   ciclo de vida, semântica voltada ao canal e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície útil
   tipada de capability.
3. integre consumidores do core + canal/feature
   Canais e plugins de feature devem consumir a nova capability por meio do core,
   não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends na capability.
5. adicione cobertura de contrato
   Adicione testes para que a forma de propriedade e registro permaneça explícita ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar preso à visão de mundo de um único
provider. Consulte o [Capability Cookbook](/pt-BR/plugins/architecture)
para um checklist concreto de arquivos e um exemplo completo.

### Checklist de capability

Quando você adiciona uma nova capability, a implementação normalmente deve tocar estas
superfícies juntas:

- tipos de contrato do core em `src/<capability>/types.ts`
- runner/helper de runtime do core em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- integração do registro de plugins em `src/plugins/registry.ts`
- exposição do runtime de plugin em `src/plugins/runtime/*` quando plugins de feature/canal
  precisarem consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- afirmações de propriedade/contrato em `src/plugins/contracts/registry.ts`
- docs para operador/plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso normalmente é um sinal de que a capability ainda
não está totalmente integrada.

### Template de capability

Padrão mínimo:

```ts
// contrato do core
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

// helper de runtime compartilhado para plugins de feature/canal
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

- o core é dono do contrato de capability + orquestração
- plugins de fornecedor são donos das implementações do fornecedor
- plugins de feature/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita
