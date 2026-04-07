---
read_when:
    - Criando ou depurando plugins nativos do OpenClaw
    - Entendendo o modelo de capability de plugins ou limites de ownership
    - Trabalhando no pipeline de carregamento de plugins ou no registro
    - Implementando hooks de runtime de provedor ou plugins de canal
sidebarTitle: Internals
summary: 'Internos de plugins: modelo de capability, ownership, contratos, pipeline de carregamento e auxiliares de runtime'
title: Internos de plugins
x-i18n:
    generated_at: "2026-04-07T05:32:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9c4b0602df12965a29881eab33b0885f991aeefa2a3fdf3cefc1a7770d6dabe0
    source_path: plugins/architecture.md
    workflow: 15
---

# Internos de plugins

<Info>
  Esta é a **referência aprofundada de arquitetura**. Para guias práticos, consulte:
  - [Install and use plugins](/pt-BR/tools/plugin) — guia do usuário
  - [Getting Started](/pt-BR/plugins/building-plugins) — primeiro tutorial de plugin
  - [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins) — crie um canal de mensagens
  - [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins) — crie um provedor de modelo
  - [SDK Overview](/pt-BR/plugins/sdk-overview) — mapa de importação e API de registro
</Info>

Esta página cobre a arquitetura interna do sistema de plugins do OpenClaw.

## Modelo público de capability

Capabilities são o modelo público de **plugin nativo** dentro do OpenClaw. Todo
plugin nativo do OpenClaw é registrado em um ou mais tipos de capability:

| Capability             | Método de registro                              | Plugins de exemplo                  |
| ---------------------- | ----------------------------------------------- | ----------------------------------- |
| Inferência de texto    | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| Backend de inferência da CLI | `api.registerCliBackend(...)`            | `openai`, `anthropic`               |
| Fala                   | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                        |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`        | `openai`                            |
| Compreensão de mídia   | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                  |
| Geração de imagem      | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Geração de música      | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| Busca na web           | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Pesquisa na web        | `api.registerWebSearchProvider(...)`            | `google`                            |
| Canal / mensagens      | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |

Um plugin que registra zero capabilities, mas fornece hooks, ferramentas ou
serviços, é um plugin **legado somente com hooks**. Esse padrão ainda é totalmente compatível.

### Postura de compatibilidade externa

O modelo de capability já chegou ao core e é usado hoje por plugins
nativos/empacotados, mas a compatibilidade de plugins externos ainda precisa de um critério
mais rígido do que "está exportado, portanto está congelado".

Orientação atual:

- **plugins externos existentes:** mantenha integrações baseadas em hooks funcionando; trate
  isso como a base de compatibilidade
- **novos plugins nativos/empacotados:** prefira registro explícito de capabilities em vez de
  acessos específicos do fornecedor ou novos designs apenas com hook
- **plugins externos adotando registro de capabilities:** permitido, mas trate as
  superfícies auxiliares específicas de capability como algo em evolução, a menos que a documentação marque explicitamente um
  contrato como estável

Regra prática:

- APIs de registro de capabilities são a direção pretendida
- hooks legados continuam sendo o caminho mais seguro para evitar quebras em plugins externos durante
  a transição
- nem todos os subpaths auxiliares exportados são iguais; prefira o contrato
  documentado e estreito, não exports auxiliares incidentais

### Formatos de plugin

O OpenClaw classifica cada plugin carregado em um formato com base no seu
comportamento real de registro (não apenas em metadados estáticos):

- **plain-capability** -- registra exatamente um tipo de capability (por exemplo, um
  plugin somente de provedor como `mistral`)
- **hybrid-capability** -- registra múltiplos tipos de capability (por exemplo,
  `openai` controla inferência de texto, fala, compreensão de mídia e geração
  de imagem)
- **hook-only** -- registra apenas hooks (tipados ou personalizados), sem capabilities,
  ferramentas, comandos ou serviços
- **non-capability** -- registra ferramentas, comandos, serviços ou rotas, mas não
  capabilities

Use `openclaw plugins inspect <id>` para ver o formato de um plugin e o detalhamento de capabilities.
Consulte a [referência da CLI](/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como caminho de compatibilidade para
plugins somente com hooks. Plugins legados do mundo real ainda dependem dele.

Direção:

- mantenha-o funcionando
- documente-o como legado
- prefira `before_model_resolve` para trabalho de substituição de modelo/provedor
- prefira `before_prompt_build` para trabalho de mutação de prompt
- remova-o apenas quando o uso real cair e a cobertura de fixtures comprovar a segurança da migração

### Sinais de compatibilidade

Quando você executar `openclaw doctor` ou `openclaw plugins inspect <id>`, poderá ver
um destes rótulos:

| Sinal                     | Significado                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | A configuração é analisada corretamente e os plugins são resolvidos |
| **compatibility advisory** | O plugin usa um padrão compatível, mas mais antigo (por exemplo `hook-only`) |
| **legacy warning**        | O plugin usa `before_agent_start`, que está obsoleto         |
| **hard error**            | A configuração é inválida ou o plugin falhou ao carregar     |

Nem `hook-only` nem `before_agent_start` vão quebrar seu plugin hoje --
`hook-only` é apenas um aviso, e `before_agent_start` apenas gera um warning. Esses
sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

1. **Manifesto + descoberta**
   O OpenClaw encontra plugins candidatos a partir de caminhos configurados, raízes de workspace,
   raízes globais de extensão e extensões empacotadas. A descoberta lê primeiro os manifestos nativos
   `openclaw.plugin.json` e os manifestos de bundle compatíveis.
2. **Habilitação + validação**
   O core decide se um plugin descoberto está habilitado, desabilitado, bloqueado ou
   selecionado para um slot exclusivo, como memória.
3. **Carregamento em runtime**
   Plugins nativos do OpenClaw são carregados no processo via jiti e registram
   capabilities em um registro central. Bundles compatíveis são normalizados em
   registros do registro sem importar código de runtime.
4. **Consumo de superfícies**
   O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração de provedor,
   hooks, rotas HTTP, comandos da CLI e serviços.

Especificamente para a CLI de plugins, a descoberta de comandos raiz é dividida em duas fases:

- metadados em tempo de análise vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do plugin pode permanecer lazy e registrar na primeira invocação

Isso mantém o código da CLI controlado pelo plugin dentro do plugin, enquanto ainda permite que o OpenClaw
reserve nomes de comandos raiz antes da análise.

O limite importante de design:

- descoberta + validação de configuração devem funcionar a partir de **metadados de manifesto/schema**
  sem executar código do plugin
- o comportamento nativo de runtime vem do caminho `register(api)` do módulo do plugin

Essa divisão permite que o OpenClaw valide configuração, explique plugins ausentes/desabilitados e
crie dicas de UI/schema antes que o runtime completo esteja ativo.

### Plugins de canal e a ferramenta compartilhada de mensagem

Plugins de canal não precisam registrar uma ferramenta separada de enviar/editar/reagir para
ações normais de chat. O OpenClaw mantém uma ferramenta compartilhada `message` no core, e
os plugins de canal controlam a descoberta e a execução específicas do canal por trás dela.

O limite atual é:

- o core controla o host compartilhado da ferramenta `message`, a integração com prompts, o
  bookkeeping de sessão/thread e o despacho de execução
- plugins de canal controlam a descoberta de ações com escopo, descoberta de capabilities e quaisquer
  fragmentos de schema específicos do canal
- plugins de canal controlam a gramática de conversa da sessão específica do provedor, como
  IDs de conversa codificam IDs de thread ou são herdados de conversas pai
- plugins de canal executam a ação final por meio de seu adaptador de ação

Para plugins de canal, a superfície do SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta
permite que um plugin retorne suas ações visíveis, capabilities e contribuições de schema
juntas, para que essas partes não se desviem.

O core passa o escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` confiável de entrada

Isso importa para plugins sensíveis a contexto. Um canal pode ocultar ou expor
ações de mensagem com base na conta ativa, sala/thread/mensagem atual ou
identidade confiável do solicitante sem codificar ramificações específicas do canal na
ferramenta `message` do core.

É por isso que mudanças de roteamento do runner embutido ainda são trabalho do plugin: o runner é
responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta
do plugin, para que a ferramenta compartilhada `message` exponha a superfície correta controlada pelo canal
para o turno atual.

Para auxiliares de execução controlados pelo canal, plugins empacotados devem manter o runtime de execução
dentro de seus próprios módulos de extensão. O core não controla mais os runtimes de ação de mensagem de Discord,
Slack, Telegram ou WhatsApp em `src/agents/tools`.
Nós não publicamos subpaths separados `plugin-sdk/*-action-runtime`, e plugins empacotados
devem importar seu próprio código local de runtime diretamente de seus
módulos controlados pela extensão.

O mesmo limite se aplica a seams do SDK nomeados por provedor em geral: o core não
deve importar barrels de conveniência específicos de canal para Slack, Discord, Signal,
WhatsApp ou extensões semelhantes. Se o core precisar de um comportamento, consuma o
próprio barrel `api.ts` / `runtime-api.ts` do plugin empacotado ou promova a necessidade
a uma capability genérica e estreita no SDK compartilhado.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a base compartilhada para canais que se encaixam no modelo comum
  de enquete
- `actions.handleAction("poll")` é o caminho preferido para semântica de enquete específica do canal
  ou parâmetros extras de enquete

Agora o core adia a análise compartilhada de enquetes até depois que o despacho de enquete do plugin recusa
a ação, para que manipuladores de enquete controlados pelo plugin possam aceitar campos
específicos do canal sem serem bloqueados primeiro pelo parser genérico de enquetes.

Consulte [Load pipeline](#load-pipeline) para a sequência completa de inicialização.

## Modelo de ownership de capability

O OpenClaw trata um plugin nativo como o limite de ownership de uma **empresa** ou de um
**recurso**, não como um conjunto de integrações não relacionadas.

Isso significa que:

- um plugin de empresa geralmente deve controlar todas as superfícies do OpenClaw voltadas para essa empresa
- um plugin de recurso geralmente deve controlar toda a superfície do recurso que ele introduz
- canais devem consumir capabilities compartilhadas do core em vez de reimplementar
  comportamento de provedor de forma ad hoc

Exemplos:

- o plugin empacotado `openai` controla o comportamento de provedor de modelo da OpenAI e o comportamento de fala + voz em tempo real + compreensão de mídia + geração de imagem da OpenAI
- o plugin empacotado `elevenlabs` controla o comportamento de fala da ElevenLabs
- o plugin empacotado `microsoft` controla o comportamento de fala da Microsoft
- o plugin empacotado `google` controla o comportamento de provedor de modelo do Google mais o
  comportamento de compreensão de mídia + geração de imagem + pesquisa na web do Google
- o plugin empacotado `firecrawl` controla o comportamento de busca na web do Firecrawl
- os plugins empacotados `minimax`, `mistral`, `moonshot` e `zai` controlam seus
  backends de compreensão de mídia
- o plugin empacotado `qwen` controla o comportamento de provedor de texto do Qwen mais
  comportamento de compreensão de mídia e geração de vídeo
- o plugin `voice-call` é um plugin de recurso: ele controla transporte de chamadas, ferramentas,
  CLI, rotas e ponte de fluxo de mídia do Twilio, mas consome capabilities compartilhadas de fala
  mais transcrição em tempo real e voz em tempo real em vez de
  importar plugins de fornecedor diretamente

O estado final pretendido é:

- a OpenAI fica em um único plugin, mesmo que cubra modelos de texto, fala, imagens e
  vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual plugin de fornecedor controla o provedor; eles consomem o
  contrato de capability compartilhado exposto pelo core

Esta é a distinção principal:

- **plugin** = limite de ownership
- **capability** = contrato do core que múltiplos plugins podem implementar ou consumir

Assim, se o OpenClaw adicionar um novo domínio como vídeo, a primeira pergunta não é
"qual provedor deve codificar o tratamento de vídeo?" A primeira pergunta é "qual é
o contrato de capability de vídeo do core?" Quando esse contrato existir, plugins de fornecedor
poderão se registrar nele e plugins de canal/recurso poderão consumi-lo.

Se a capability ainda não existir, normalmente a ação correta é:

1. definir a capability ausente no core
2. expô-la por meio da API/runtime de plugin de forma tipada
3. conectar canais/recursos a essa capability
4. permitir que plugins de fornecedor registrem implementações

Isso mantém o ownership explícito, evitando comportamento do core que dependa de um
único fornecedor ou de um caminho específico de plugin.

### Camadas de capability

Use este modelo mental ao decidir onde o código deve ficar:

- **camada de capability do core**: orquestração compartilhada, política, fallback, configuração
  de regras de mesclagem, semântica de entrega e contratos tipados
- **camada de plugin do fornecedor**: APIs específicas do fornecedor, autenticação, catálogos de modelos, síntese de fala,
  geração de imagem, futuros backends de vídeo, endpoints de uso
- **camada de plugin de canal/recurso**: integração com Slack/Discord/voice-call/etc.
  que consome capabilities do core e as apresenta em uma superfície

Por exemplo, TTS segue este formato:

- o core controla política de TTS em respostas, ordem de fallback, preferências e entrega por canal
- `openai`, `elevenlabs` e `microsoft` controlam implementações de síntese
- `voice-call` consome o helper de runtime de TTS para telefonia

Esse mesmo padrão deve ser preferido para capabilities futuras.

### Exemplo de plugin de empresa com múltiplas capabilities

Um plugin de empresa deve parecer coeso externamente. Se o OpenClaw tiver contratos compartilhados
para modelos, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia,
geração de imagem, geração de vídeo, busca na web e pesquisa na web,
um fornecedor pode controlar todas as suas superfícies em um só lugar:

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
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
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
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

O importante não são os nomes exatos dos helpers. O importante é o formato:

- um plugin controla a superfície do fornecedor
- o core ainda controla os contratos de capability
- canais e plugins de recurso consomem helpers `api.runtime.*`, não código do fornecedor
- testes de contrato podem verificar se o plugin registrou as capabilities que
  ele afirma controlar

### Exemplo de capability: compreensão de vídeo

O OpenClaw já trata compreensão de imagem/áudio/vídeo como uma única
capability compartilhada. O mesmo modelo de ownership se aplica aqui:

1. o core define o contrato de media-understanding
2. plugins de fornecedor registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. canais e plugins de recurso consomem o comportamento compartilhado do core em vez de
   se conectar diretamente ao código do fornecedor

Isso evita embutir no core suposições de vídeo de um único provedor. O plugin controla
a superfície do fornecedor; o core controla o contrato de capability e o comportamento de fallback.

A geração de vídeo já segue essa mesma sequência: o core controla o contrato tipado
de capability e o helper de runtime, e plugins de fornecedor registram
implementações `api.registerVideoGenerationProvider(...)` nele.

Precisa de um checklist concreto de rollout? Consulte
[Capability Cookbook](/pt-BR/plugins/architecture).

## Contratos e enforcement

A superfície da API de plugins é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e
os helpers de runtime nos quais um plugin pode confiar.

Por que isso importa:

- autores de plugins recebem um único padrão interno estável
- o core pode rejeitar ownership duplicado, como dois plugins registrando o mesmo
  ID de provedor
- a inicialização pode expor diagnósticos acionáveis para registros malformados
- testes de contrato podem impor ownership de plugins empacotados e evitar desvios silenciosos

Há duas camadas de enforcement:

1. **enforcement de registro em runtime**
   O registro de plugins valida registros conforme os plugins são carregados. Exemplos:
   IDs de provedor duplicados, IDs de provedor de fala duplicados e registros
   malformados geram diagnósticos de plugin em vez de comportamento indefinido.
2. **testes de contrato**
   Plugins empacotados são capturados em registros de contrato durante as execuções de teste para que
   o OpenClaw possa afirmar ownership explicitamente. Hoje isso é usado para provedores de modelo,
   provedores de fala, provedores de pesquisa na web e ownership de registros empacotados.

O efeito prático é que o OpenClaw sabe, de antemão, qual plugin controla qual
superfície. Isso permite que core e canais componham sem atrito porque o ownership é
declarado, tipado e testável, em vez de implícito.

### O que pertence a um contrato

Bons contratos de plugin são:

- tipados
- pequenos
- específicos de capability
- controlados pelo core
- reutilizáveis por múltiplos plugins
- consumíveis por canais/recursos sem conhecimento do fornecedor

Maus contratos de plugin são:

- política específica de fornecedor escondida no core
- saídas de escape específicas de plugin que contornam o registro
- código de canal acessando diretamente uma implementação de fornecedor
- objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` ou
  `api.runtime`

Em caso de dúvida, eleve o nível de abstração: defina a capability primeiro, depois
permita que plugins se conectem a ela.

## Modelo de execução

Plugins nativos do OpenClaw são executados **no mesmo processo** do Gateway. Eles não
são sandboxed. Um plugin nativo carregado tem o mesmo limite de confiança em nível de processo que
o código do core.

Implicações:

- um plugin nativo pode registrar ferramentas, manipuladores de rede, hooks e serviços
- um bug em um plugin nativo pode travar ou desestabilizar o gateway
- um plugin nativo malicioso equivale a execução arbitrária de código dentro
  do processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente
Skills empacotadas.

Use allowlists e caminhos explícitos de instalação/carregamento para plugins não empacotados. Trate
plugins de workspace como código de desenvolvimento, não como padrão de produção.

Para nomes de pacote de workspace empacotados, mantenha o ID do plugin ancorado no nome
npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` quando
o pacote expõe intencionalmente um papel de plugin mais restrito.

Observação importante sobre confiança:

- `plugins.allow` confia em **IDs de plugin**, não na procedência da origem.
- Um plugin de workspace com o mesmo ID de um plugin empacotado intencionalmente sobrescreve
  a cópia empacotada quando esse plugin de workspace está habilitado/na allowlist.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.

## Limite de exportação

O OpenClaw exporta capabilities, não conveniências de implementação.

Mantenha o registro de capabilities público. Remova exports de helpers que não sejam contrato:

- subpaths específicos de helper de plugin empacotado
- subpaths de infraestrutura de runtime que não se destinam à API pública
- helpers de conveniência específicos de fornecedor
- helpers de configuração/onboarding que são detalhes de implementação

Alguns subpaths de helper de plugins empacotados ainda permanecem no mapa de exportação
gerado do SDK por compatibilidade e manutenção de plugins empacotados. Exemplos atuais incluem
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e vários seams `plugin-sdk/matrix*`. Trate-os como
exports reservados de detalhe de implementação, não como o padrão recomendado do SDK para
novos plugins de terceiros.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de plugin
2. lê manifestos nativos ou de bundle compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação de cada candidato
6. carrega módulos nativos habilitados via jiti
7. chama hooks nativos `register(api)` (ou `activate(api)` — um alias legado) e coleta registros no registro de plugins
8. expõe o registro para superfícies de comandos/runtime

<Note>
`activate` é um alias legado para `register` — o loader resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins empacotados usam `register`; prefira `register` para novos plugins.
</Note>

Os portões de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada sai da raiz do plugin, o caminho é gravável por todos, ou a
propriedade do caminho parece suspeita para plugins não empacotados.

### Comportamento manifesto-primeiro

O manifesto é a fonte de verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/Skills/schema de configuração declarados ou capabilities de bundle
- validar `plugins.entries.<id>.config`
- ampliar rótulos/placeholders da Control UI
- mostrar metadados de instalação/catálogo

Para plugins nativos, o módulo de runtime é a parte de plano de dados. Ele registra o
comportamento real, como hooks, ferramentas, comandos ou fluxos de provedor.

### O que o loader armazena em cache

O OpenClaw mantém caches curtos no processo para:

- resultados de descoberta
- dados de registro de manifesto
- registros de plugins carregados

Esses caches reduzem sobrecarga de inicialização em rajadas e de comandos repetidos. Eles podem ser
pensados com segurança como caches de desempenho de curta duração, não persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desativar esses caches.
- Ajuste as janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não mutam diretamente globais aleatórios do core. Eles se registram em um
registro central de plugins.

O registro acompanha:

- registros de plugin (identidade, origem, source, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- manipuladores de RPC do gateway
- rotas HTTP
- registradores da CLI
- serviços em segundo plano
- comandos controlados por plugin

Os recursos do core então leem esse registro em vez de falar com módulos de plugin
diretamente. Isso mantém o carregamento em um só sentido:

- módulo do plugin -> registro no registry
- runtime do core -> consumo do registry

Essa separação importa para a manutenção. Significa que a maioria das superfícies do core precisa apenas
de um ponto de integração: "leia o registry", não "crie tratamento especial para cada módulo
de plugin".

## Callbacks de binding de conversa

Plugins que fazem binding de uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma
solicitação de binding for aprovada ou negada:

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
- `binding`: o binding resolvido para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de detach, ID do remetente e
  metadados da conversa

Esse callback é apenas de notificação. Ele não muda quem tem permissão para fazer binding de uma
conversa, e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provedor

Plugins de provedor agora têm duas camadas:

- metadados do manifesto: `providerAuthEnvVars` para busca barata de autenticação de provedor via env
  antes do carregamento do runtime, `channelEnvVars` para busca barata de env/configuração de canal
  antes do carregamento do runtime, além de `providerAuthChoices` para rótulos baratos
  de onboarding/escolha de autenticação e metadados de flags da CLI antes do carregamento do runtime
- hooks de tempo de configuração: `catalog` / legado `discovery` mais `applyConfigDefaults`
- hooks de runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
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

O OpenClaw ainda controla o loop genérico do agente, failover, tratamento de transcrição e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de provedor sem
precisar de um transporte de inferência totalmente personalizado.

Use o manifesto `providerAuthEnvVars` quando o provedor tiver credenciais baseadas em env
que caminhos genéricos de autenticação/status/model-picker devam enxergar sem carregar o
runtime do plugin. Use o manifesto `providerAuthChoices` quando superfícies da CLI de onboarding/escolha de autenticação
devem conhecer o ID de escolha do provedor, rótulos de grupo e configuração simples
de autenticação por uma flag sem carregar o runtime do provedor. Mantenha `envVars` do runtime de provedor
para dicas voltadas ao operador, como rótulos de onboarding ou variáveis de configuração de
client-id/client-secret OAuth.

Use o manifesto `channelEnvVars` quando um canal tiver autenticação ou configuração orientada por env que
fallback genérico de env do shell, verificações de configuração/status ou prompts de configuração devam enxergar
sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para plugins de modelo/provedor, o OpenClaw chama hooks aproximadamente nesta ordem.
A coluna "Quando usar" é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | Publica configuração do provedor em `models.providers` durante a geração de `models.json`                     | O provedor controla um catálogo ou padrões de URL base                                                                                     |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração controlados pelo provedor durante a materialização da configuração      | Os padrões dependem do modo de autenticação, env ou semântica da família de modelos do provedor                                          |
| --  | _(built-in model lookup)_         | O OpenClaw tenta primeiro o caminho normal de registry/catálogo                                                | _(não é um hook de plugin)_                                                                                                               |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou preview de model-id antes da busca                                                | O provedor controla a limpeza de aliases antes da resolução canônica do modelo                                                            |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo                        | O provedor controla a limpeza do transporte para IDs de provedor personalizados na mesma família de transporte                           |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                       | O provedor precisa de limpeza de configuração que deve viver com o plugin; helpers empacotados da família Google também dão suporte retroativo a entradas compatíveis de configuração Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo a provedores de configuração                   | O provedor precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                          |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de env para provedores de configuração antes do carregamento da autenticação de runtime | O provedor tem resolução de chave de API por marcador de env controlada pelo provedor; `amazon-bedrock` também tem aqui um resolvedor integrado de marcador de env da AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/self-hosted ou baseada em configuração sem persistir texto puro                       | O provedor pode operar com um marcador de credencial sintética/local                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis externos de autenticação controlados pelo provedor; o padrão de `persistence` é `runtime-only` para credenciais controladas pela CLI/app | O provedor reutiliza credenciais externas de autenticação sem persistir tokens de refresh copiados                                      |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders sintéticos de perfil armazenados atrás de autenticação baseada em env/configuração        | O provedor armazena perfis placeholders sintéticos que não devem ter precedência                                                          |
| 11  | `resolveDynamicModel`             | Fallback síncrono para model ids controlados pelo provedor que ainda não estão no registry local              | O provedor aceita IDs arbitrários de modelo upstream                                                                                      |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono, então `resolveDynamicModel` é executado novamente                                      | O provedor precisa de metadados de rede antes de resolver IDs desconhecidos                                                               |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o runner embutido usar o modelo resolvido                                             | O provedor precisa de reescritas de transporte, mas ainda usa um transporte do core                                                      |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos de fornecedor por trás de outro transporte compatível          | O provedor reconhece seus próprios modelos em transportes proxy sem assumir o controle do provedor                                       |
| 15  | `capabilities`                    | Metadados de transcrição/ferramentas controlados pelo provedor usados pela lógica compartilhada do core        | O provedor precisa de particularidades de transcrição/família de provedor                                                                 |
| 16  | `normalizeToolSchemas`            | Normaliza schemas de ferramentas antes de o runner embutido vê-los                                             | O provedor precisa de limpeza de schema para a família de transporte                                                                      |
| 17  | `inspectToolSchemas`              | Expõe diagnósticos de schema controlados pelo provedor após a normalização                                     | O provedor quer avisos de palavras-chave sem ensinar regras específicas do provedor ao core                                              |
| 18  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de reasoning nativo vs com tags                                                    | O provedor precisa de saída final/reasoning com tags em vez de campos nativos                                                            |
| 19  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes de wrappers genéricos de opções de stream                       | O provedor precisa de parâmetros padrão de requisição ou limpeza de parâmetros por provedor                                              |
| 20  | `createStreamFn`                  | Substitui completamente o caminho normal de stream por um transporte personalizado                             | O provedor precisa de um protocolo de transporte personalizado, não apenas de um wrapper                                                 |
| 21  | `wrapStreamFn`                    | Wrapper de stream depois que wrappers genéricos são aplicados                                                  | O provedor precisa de wrappers de compatibilidade para cabeçalhos/corpo/modelo sem transporte personalizado                             |
| 22  | `resolveTransportTurnState`       | Anexa cabeçalhos ou metadados nativos de transporte por turno                                                  | O provedor quer que transportes genéricos enviem identidade de turno nativa do provedor                                                  |
| 23  | `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos nativos de WebSocket ou política de cooldown de sessão                                        | O provedor quer que transportes WS genéricos ajustem cabeçalhos de sessão ou política de fallback                                        |
| 24  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado vira a string `apiKey` de runtime                   | O provedor armazena metadados extras de autenticação e precisa de um formato personalizado de token em runtime                          |
| 25  | `refreshOAuth`                    | Substituição de refresh OAuth para endpoints personalizados de refresh ou política de falha de refresh         | O provedor não se encaixa nos refreshers compartilhados de `pi-ai`                                                                        |
| 26  | `buildAuthDoctorHint`             | Dica de reparo anexada quando o refresh OAuth falha                                                            | O provedor precisa de orientação de reparo de autenticação controlada pelo provedor após falha de refresh                               |
| 27  | `matchesContextOverflowError`     | Correspondência de overflow de janela de contexto controlada pelo provedor                                     | O provedor tem erros brutos de overflow que heurísticas genéricas deixariam passar                                                       |
| 28  | `classifyFailoverReason`          | Classificação de motivo de failover controlada pelo provedor                                                   | O provedor consegue mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                           |
| 29  | `isCacheTtlEligible`              | Política de cache de prompt para provedores proxy/backhaul                                                     | O provedor precisa de gating de TTL de cache específico de proxy                                                                          |
| 30  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação de autenticação ausente                                       | O provedor precisa de uma dica específica de recuperação para autenticação ausente                                                       |
| 31  | `suppressBuiltInModel`            | Supressão de modelo upstream desatualizado mais dica opcional de erro voltada ao usuário                       | O provedor precisa ocultar linhas upstream desatualizadas ou substituí-las por uma dica do fornecedor                                   |
| 32  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                                | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                           |
| 33  | `isBinaryThinking`                | Toggle de reasoning liga/desliga para provedores com thinking binário                                          | O provedor expõe apenas thinking binário ligado/desligado                                                                                 |
| 34  | `supportsXHighThinking`           | Suporte a reasoning `xhigh` para modelos selecionados                                                          | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                               |
| 35  | `resolveDefaultThinkingLevel`     | Nível padrão de `/think` para uma família específica de modelos                                                | O provedor controla a política padrão de `/think` para uma família de modelos                                                            |
| 36  | `isModernModelRef`                | Correspondência de modelo moderno para filtros de perfil live e seleção smoke                                  | O provedor controla a correspondência de modelo preferido live/smoke                                                                      |
| 37  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime pouco antes da inferência                    | O provedor precisa de uma troca de token ou credencial de requisição de curta duração                                                    |
| 38  | `resolveUsageAuth`                | Resolve credenciais de uso/faturamento para `/usage` e superfícies relacionadas de status                      | O provedor precisa de análise personalizada de token de uso/cota ou de uma credencial diferente para uso                               |
| 39  | `fetchUsageSnapshot`              | Busca e normaliza snapshots de uso/cota específicos do provedor depois que a autenticação é resolvida         | O provedor precisa de um endpoint ou parser de payload específico do provedor para uso                                                   |
| 40  | `createEmbeddingProvider`         | Cria um adaptador de embedding controlado pelo provedor para memória/pesquisa                                  | O comportamento de embedding de memória pertence ao plugin do provedor                                                                    |
| 41  | `buildReplayPolicy`               | Retorna uma política de replay que controla o tratamento de transcrição para o provedor                        | O provedor precisa de uma política personalizada de transcrição (por exemplo, remoção de blocos de thinking)                            |
| 42  | `sanitizeReplayHistory`           | Reescreve o histórico de replay após a limpeza genérica da transcrição                                         | O provedor precisa de reescritas de replay específicas do provedor além dos helpers de compactação compartilhados                       |
| 43  | `validateReplayTurns`             | Validação final ou remodelagem de turnos de replay antes do runner embutido                                    | O transporte do provedor precisa de validação de turnos mais rigorosa após a sanitização genérica                                        |
| 44  | `onModelSelected`                 | Executa efeitos colaterais pós-seleção controlados pelo provedor                                               | O provedor precisa de telemetria ou estado controlado pelo provedor quando um modelo se torna ativo                                      |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
plugin do provedor correspondente e depois passam para outros plugins de provedor com hooks
até que um realmente altere o model id ou transporte/configuração. Isso mantém
funcionando shims de alias/compatibilidade sem exigir que o chamador saiba qual plugin
empacotado controla a reescrita. Se nenhum hook de provedor reescrever uma
entrada compatível de configuração da família Google, o normalizador empacotado de configuração do Google
ainda aplicará essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de transporte totalmente personalizado ou de um executor de requisição
personalizado, isso é uma classe diferente de extensão. Esses hooks são para comportamento de provedor
que ainda funciona no loop normal de inferência do OpenClaw.

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

- Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  e `wrapStreamFn` porque controla compatibilidade futura do Claude 4.6,
  dicas de família de provedor, orientação de reparo de autenticação, integração com endpoint de uso,
  elegibilidade de cache de prompt, padrões de configuração sensíveis à autenticação, política
  padrão/adaptativa de thinking do Claude e modelagem de stream específica da Anthropic para
  cabeçalhos beta, `/fast` / `serviceTier` e `context1m`.
- Os helpers de stream específicos de Claude da Anthropic permanecem, por enquanto, no próprio
  seam público `api.ts` / `contract-api.ts` do plugin empacotado. Essa superfície de pacote
  exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e builders de wrapper
  Anthropic de nível mais baixo, em vez de ampliar o SDK genérico em torno das regras
  de cabeçalho beta de um provedor.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities`, além de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  porque controla compatibilidade futura do GPT-5.4, a normalização direta
  `openai-completions` -> `openai-responses` da OpenAI, dicas de autenticação
  ausente sensíveis a Codex, supressão de Spark, linhas sintéticas da lista da OpenAI
  e política de thinking / modelo live do GPT-5; a família de stream `openai-responses-defaults` controla os
  wrappers compartilhados nativos de OpenAI Responses para cabeçalhos de atribuição,
  `/fast`/`serviceTier`, verbosidade de texto, pesquisa nativa na web do Codex,
  modelagem de payload de compatibilidade de reasoning e gerenciamento de contexto de Responses.
- OpenRouter usa `catalog` mais `resolveDynamicModel` e
  `prepareDynamicModel` porque o provedor é pass-through e pode expor novos
  model ids antes que o catálogo estático do OpenClaw seja atualizado; ele também usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para manter
  cabeçalhos de requisição específicos do provedor, metadados de roteamento, patches de reasoning e
  política de cache de prompt fora do core. Sua política de replay vem da família
  `passthrough-gemini`, enquanto a família de stream `openrouter-thinking`
  controla injeção de reasoning por proxy e ignoros de modelo não compatível / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities`, além de `prepareRuntimeAuth` e `fetchUsageSnapshot` porque
  precisa de login de dispositivo controlado pelo provedor, comportamento de fallback de modelo, particularidades
  de transcrição do Claude, uma troca de token GitHub -> token Copilot e um endpoint
  de uso controlado pelo provedor.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog`, além de
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot` porque
  ainda funciona nos transportes OpenAI do core, mas controla sua normalização
  de transporte/base URL, política de fallback de refresh OAuth, escolha de transporte padrão,
  linhas sintéticas de catálogo Codex e integração com o endpoint de uso do ChatGPT; ele
  compartilha a mesma família de stream `openai-responses-defaults` da OpenAI direta.
- Google AI Studio e Gemini CLI OAuth usam `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque a
  família de replay `google-gemini` controla fallback de compatibilidade futura do Gemini 3.1,
  validação nativa de replay Gemini, sanitização de replay de bootstrap, modo
  de saída de reasoning com tags e correspondência de modelo moderno, enquanto a
  família de stream `google-thinking` controla a normalização de payload de thinking do Gemini;
  o OAuth do Gemini CLI também usa `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` para formatação de token, parsing de token e conexão com endpoint
  de cota.
- Anthropic Vertex usa `buildReplayPolicy` por meio da
  família de replay `anthropic-by-model`, para que a limpeza de replay específica de Claude fique
  restrita a IDs Claude em vez de todo transporte `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel` porque controla
  classificação de erro específica do Bedrock para throttling/não pronto/overflow de contexto
  em tráfego Anthropic-on-Bedrock; sua política de replay ainda compartilha a mesma
  proteção `anthropic-by-model` apenas para Claude.
- OpenRouter, Kilocode, Opencode e Opencode Go usam `buildReplayPolicy`
  por meio da família de replay `passthrough-gemini` porque fazem proxy de modelos Gemini
  por transportes compatíveis com OpenAI e precisam de
  sanitização de assinatura de pensamento Gemini sem validação nativa de replay Gemini nem
  reescritas de bootstrap.
- MiniMax usa `buildReplayPolicy` por meio da
  família de replay `hybrid-anthropic-openai` porque um único provedor controla semânticas
  tanto de Anthropic-message quanto compatíveis com OpenAI; ele mantém a remoção de blocos
  de thinking apenas do Claude no lado Anthropic enquanto substitui o modo de saída de reasoning
  de volta para nativo, e a família de stream `minimax-fast-mode` controla reescritas de modelo de modo rápido no caminho de stream compartilhado.
- Moonshot usa `catalog` mais `wrapStreamFn` porque ainda usa o transporte compartilhado
  OpenAI, mas precisa de normalização de payload de thinking controlada pelo provedor; a
  família de stream `moonshot-thinking` mapeia configuração mais estado de `/think` para seu
  payload nativo de thinking binário.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque precisa de cabeçalhos de requisição controlados pelo provedor,
  normalização de payload de reasoning, dicas de transcrição do Gemini e gating de TTL de cache
  Anthropic; a família de stream `kilocode-thinking` mantém a injeção de thinking do Kilo
  no caminho compartilhado de stream proxy enquanto ignora `kilo/auto` e outros IDs de modelo proxy que não suportam payloads explícitos de reasoning.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` porque controla fallback do GLM-5,
  padrões `tool_stream`, UX de thinking binário, correspondência de modelo moderno e tanto
  autenticação de uso quanto busca de cota; a família de stream `tool-stream-default-on` mantém
  o wrapper padrão ligado de `tool_stream` fora de cola manual por provedor.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque controla normalização nativa de transporte xAI Responses, reescritas
  de alias de modo rápido do Grok, padrão `tool_stream`, limpeza rigorosa
  de ferramenta / payload de reasoning, reutilização de autenticação de fallback para ferramentas controladas pelo plugin, resolução de modelo Grok com compatibilidade futura e patches de compatibilidade controlados pelo provedor como perfil de schema de ferramenta do xAI,
  palavras-chave de schema não compatíveis, `web_search` nativo e decodificação de argumentos de tool-call com entidades HTML.
- Mistral, OpenCode Zen e OpenCode Go usam apenas `capabilities` para manter
  particularidades de transcrição/ferramentas fora do core.
- Provedores empacotados somente com catálogo como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine` usam
  apenas `catalog`.
- Qwen usa `catalog` para seu provedor de texto mais registros compartilhados de compreensão de mídia e
  geração de vídeo para suas superfícies multimodais.
- MiniMax e Xiaomi usam `catalog` mais hooks de uso porque seu comportamento de `/usage`
  é controlado pelo plugin, embora a inferência ainda passe pelos transportes compartilhados.

## Auxiliares de runtime

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

- `textToSpeech` retorna a carga útil normal de saída TTS do core para superfícies de arquivo/mensagem de voz.
- Usa a configuração `messages.tts` do core e a seleção de provedor.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem fazer resample/encode para provedores.
- `listVoices` é opcional por provedor. Use-o para seletores de voz ou fluxos de configuração controlados pelo fornecedor.
- Listagens de vozes podem incluir metadados mais ricos, como localidade, gênero e tags de personalidade para seletores sensíveis ao provedor.
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

- Mantenha política de TTS, fallback e entrega de resposta no core.
- Use provedores de fala para comportamento de síntese controlado pelo fornecedor.
- A entrada legada Microsoft `edge` é normalizada para o ID de provedor `microsoft`.
- O modelo de ownership preferido é orientado à empresa: um plugin de fornecedor pode controlar
  provedores de texto, fala, imagem e futura mídia à medida que o OpenClaw adicionar esses
  contratos de capability.

Para compreensão de imagem/áudio/vídeo, plugins registram um único provedor tipado
de media-understanding em vez de um saco genérico chave/valor:

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
- Mantenha comportamento do fornecedor no plugin de provedor.
- Expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos opcionais
  de resultado, novas capabilities opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core controla o contrato de capability e o helper de runtime
  - plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - plugins de recurso/canal consomem `api.runtime.videoGeneration.*`

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
ou o alias antigo STT:

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
  compreensão de imagem/áudio/vídeo.
- Usa a configuração de áudio de media-understanding do core (`tools.media.audio`) e a ordem de fallback do provedor.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não compatível).
- `api.runtime.stt.transcribeAudioFile(...)` continua disponível como alias de compatibilidade.

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
- O OpenClaw só honra esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback controladas por plugin, operadores devem optar por isso com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de plugins não confiáveis ainda funcionam, mas solicitações de substituição são rejeitadas em vez de cair silenciosamente em fallback.

Para pesquisa na web, plugins podem consumir o helper compartilhado de runtime em vez de
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

- Mantenha seleção de provedor, resolução de credenciais e semântica compartilhada de requisição no core.
- Use provedores de pesquisa na web para transportes de busca específicos do fornecedor.
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
- `listProviders(...)`: lista os provedores de geração de imagem disponíveis e suas capabilities.

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
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway, ou `"plugin"` para autenticação/validação de webhook gerenciada pelo plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tratar a requisição.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará erro de carregamento de plugin. Use `api.registerHttpRoute(...)` em vez disso.
- Rotas de plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com diferentes níveis de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de auth.
- Rotas `auth: "plugin"` **não** recebem automaticamente escopos de runtime do operador. Elas são para verificação de assinatura/webhook gerenciada pelo plugin, não para chamadas privilegiadas de helpers do Gateway.
- Rotas `auth: "gateway"` são executadas dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém escopos de runtime de rota de plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) respeitam `x-openclaw-scopes` apenas quando o cabeçalho está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas requisições de rota de plugin com identidade, o escopo de runtime cai para `operator.write`
- Regra prática: não assuma que uma rota de plugin autenticada por gateway é implicitamente uma superfície de admin. Se sua rota precisar de comportamento apenas de admin, exija um modo de autenticação com identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.

## Caminhos de importação do Plugin SDK

Use subpaths do SDK em vez da importação monolítica `openclaw/plugin-sdk` ao
criar plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de plugin.
- `openclaw/plugin-sdk/core` para o contrato genérico compartilhado voltado a plugins.
- `openclaw/plugin-sdk/config-schema` para a exportação do schema Zod raiz de `openclaw.json`
  (`OpenClawSchema`).
- Primitivas estáveis de canal como `openclaw/plugin-sdk/channel-setup`,
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
  `openclaw/plugin-sdk/webhook-ingress` para configuração/autenticação/resposta/webhook
  compartilhadas. `channel-inbound` é a casa compartilhada para debounce, correspondência de menção,
  formatação de envelope e helpers de contexto de envelope de entrada.
  `channel-setup` é o seam estreito de configuração opcional de instalação.
  `setup-runtime` é a superfície de configuração segura em runtime usada por `setupEntry` /
  inicialização adiada, incluindo os adaptadores de patch de configuração seguros para importação.
  `setup-adapter-runtime` é o seam de adaptador de configuração de conta sensível a env.
  `setup-tools` é o pequeno seam auxiliar de CLI/arquivo/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subpaths de domínio como `openclaw/plugin-sdk/channel-config-helpers`,
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
  `telegram-command-config` é o seam público estreito para normalização/validação de comandos
  personalizados do Telegram e continua disponível mesmo que a superfície de contrato
  empacotada do Telegram esteja temporariamente indisponível.
  `text-runtime` é o seam compartilhado de texto/markdown/logging, incluindo
  remoção de texto visível para o assistente, helpers de renderização/fragmentação de markdown, helpers de redaction,
  helpers de tag de diretiva e utilitários de texto seguro.
- Seams de canal específicos de aprovação devem preferir um único contrato `approvalCapability`
  no plugin. O core então lê autenticação, entrega, renderização e comportamento
  de roteamento nativo de aprovação por meio dessa única capability em vez de misturar
  comportamento de aprovação em campos não relacionados do plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto e permanece apenas como um shim de compatibilidade para plugins antigos. Código novo deve importar primitivas genéricas mais estreitas em vez disso, e o código do repositório não deve adicionar novas importações do shim.
- Internos de extensões empacotadas permanecem privados. Plugins externos devem usar apenas subpaths `openclaw/plugin-sdk/*`. Código core/test do OpenClaw pode usar os pontos de entrada públicos do repositório sob a raiz do pacote do plugin, como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e arquivos com escopo estreito como
  `login-qr-api.js`. Nunca importe `src/*` de um pacote de plugin a partir do core ou de outra extensão.
- Divisão de ponto de entrada do repositório:
  `<plugin-package-root>/api.js` é o barrel de helpers/tipos,
  `<plugin-package-root>/runtime-api.js` é o barrel somente de runtime,
  `<plugin-package-root>/index.js` é a entrada do plugin empacotado
  e `<plugin-package-root>/setup-entry.js` é a entrada do plugin de configuração.
- Exemplos atuais de provedores empacotados:
  - Anthropic usa `api.js` / `contract-api.js` para helpers de stream do Claude como
    `wrapAnthropicProviderStream`, helpers de cabeçalho beta e parsing de `service_tier`.
  - OpenAI usa `api.js` para builders de provedor, helpers de modelo padrão e builders de provedor em tempo real.
  - OpenRouter usa `api.js` para seu builder de provedor mais helpers de onboarding/configuração,
    enquanto `register.runtime.js` ainda pode reexportar helpers genéricos
    `plugin-sdk/provider-stream` para uso local no repositório.
- Pontos de entrada públicos carregados por facade preferem o snapshot ativo de configuração do runtime
  quando ele existe, e depois recorrem ao arquivo de configuração resolvido em disco quando
  o OpenClaw ainda não está servindo um snapshot de runtime.
- Primitivas genéricas compartilhadas continuam sendo o contrato público preferido do SDK. Um pequeno
  conjunto reservado de compatibilidade de seams auxiliares de canal com marca ainda existe. Trate-os como seams de compatibilidade/manutenção empacotada, não como novos alvos de importação de terceiros; novos contratos entre canais ainda devem chegar em subpaths genéricos `plugin-sdk/*` ou nos barrels locais `api.js` /
  `runtime-api.js` do plugin.

Observação de compatibilidade:

- Evite o barrel raiz `openclaw/plugin-sdk` para código novo.
- Prefira primeiro as primitivas estáveis e estreitas. Os subpaths mais novos de
  setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool são o contrato pretendido para novo trabalho
  com plugins externos e empacotados.
  Parsing/correspondência de destino pertencem a `openclaw/plugin-sdk/channel-targets`.
  Portões de ação de mensagem e helpers de message-id de reação pertencem a
  `openclaw/plugin-sdk/channel-actions`.
- Barrels auxiliares específicos de extensão empacotada não são estáveis por padrão. Se um
  helper for necessário apenas por uma extensão empacotada, mantenha-o atrás do
  seam local `api.js` ou `runtime-api.js` da extensão em vez de promovê-lo a
  `openclaw/plugin-sdk/<extension>`.
- Novos seams de helper compartilhado devem ser genéricos, não com marca de canal. Parsing compartilhado
  de destinos pertence a `openclaw/plugin-sdk/channel-targets`; internos
  específicos de canal ficam atrás do seam local `api.js` ou `runtime-api.js` do plugin controlador.
- Subpaths específicos de capability como `image-generation`,
  `media-understanding` e `speech` existem porque plugins nativos/empacotados os usam
  hoje. Sua presença não significa, por si só, que todo helper exportado seja um
  contrato externo congelado de longo prazo.

## Schemas da ferramenta de mensagem

Plugins devem controlar contribuições de schema específicas de canal em `describeMessageTool(...)`.
Mantenha campos específicos de provedor no plugin, não no core compartilhado.

Para fragmentos portáveis de schema compartilhado, reutilize os helpers genéricos exportados por
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para payloads em estilo grade de botões
- `createMessageToolCardSchema()` para payloads estruturados de cartão

Se um formato de schema só fizer sentido para um provedor, defina-o no
próprio código-fonte do plugin em vez de promovê-lo ao SDK compartilhado.

## Resolução de alvo de canal

Plugins de canal devem controlar a semântica específica de alvo do canal. Mantenha o
host de saída genérico e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um alvo normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca no diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve pular direto para resolução semelhante a ID em vez de busca no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando
  o core precisa de uma resolução final controlada pelo provedor após normalização ou
  após falha de busca no diretório.
- `messaging.resolveOutboundSessionRoute(...)` controla a construção da rota de sessão
  específica do provedor depois que um alvo é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes de
  procurar peers/grupos.
- Use `looksLikeId` para verificações do tipo "trate isto como um ID/alvo nativo explícito".
- Use `resolveTarget` para fallback de normalização específico do provedor, não para
  busca ampla no diretório.
- Mantenha IDs nativos do provedor como IDs de chat, IDs de thread, JIDs, handles e IDs de sala
  dentro de valores `target` ou params específicos do provedor, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório da configuração devem manter essa lógica no
plugin e reutilizar os helpers compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de peers/grupos baseados em configuração, como:

- peers de DM orientados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de diretório com escopo de conta

Os helpers compartilhados em `directory-runtime` tratam apenas operações genéricas:

- filtragem de consulta
- aplicação de limite
- helpers de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta específica do canal e normalização de ID devem permanecer na implementação
do plugin.

## Catálogos de provedor

Plugins de provedor podem definir catálogos de modelos para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para várias entradas de provedor

Use `catalog` quando o plugin controlar model ids específicos do provedor, padrões de URL base
ou metadados de modelo protegidos por autenticação.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos
provedores implícitos integrados do OpenClaw:

- `simple`: provedores simples por chave de API ou env
- `profile`: provedores que aparecem quando existem perfis de autenticação
- `paired`: provedores que sintetizam várias entradas de provedor relacionadas
- `late`: última passagem, depois de outros provedores implícitos

Provedores posteriores vencem em caso de colisão de chave, então plugins podem intencionalmente substituir uma entrada integrada de provedor com o mesmo ID.

Compatibilidade:

- `discovery` ainda funciona como alias legado
- se `catalog` e `discovery` forem registrados, o OpenClaw usará `catalog`

## Inspeção de canal somente leitura

Se seu plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que as credenciais
  estejam totalmente materializadas e pode falhar rapidamente quando segredos obrigatórios estiverem ausentes.
- Caminhos de comando somente leitura como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de doctor/reparo de configuração
  não deveriam precisar materializar credenciais de runtime apenas para descrever configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status da credencial quando relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para informar disponibilidade
  em modo somente leitura. Retornar `tokenStatus: "available"` (e o campo de origem correspondente)
  já é suficiente para comandos de status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura informem "configurado, mas indisponível neste caminho de comando" em vez de travar ou informar incorretamente que a conta não está configurada.

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

Cada entrada se torna um plugin. Se o pack listar várias extensões, o ID do plugin
se tornará `name/<fileBase>`.

Se seu plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Proteção de segurança: cada entrada de `openclaw.extensions` deve permanecer dentro do diretório do plugin
após a resolução de symlink. Entradas que escaparem do diretório do pacote serão
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências de plugin com
`npm install --omit=dev --ignore-scripts` (sem scripts de lifecycle e sem dependências de dev em runtime). Mantenha árvores de dependência de plugin em "JS/TS puro" e evite pacotes que exijam builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve apenas de configuração.
Quando o OpenClaw precisa de superfícies de configuração para um plugin de canal desabilitado, ou
quando um plugin de canal está habilitado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso mantém inicialização e configuração mais leves
quando a entrada principal do plugin também conecta ferramentas, hooks ou outro
código apenas de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode fazer um plugin de canal optar pelo mesmo caminho `setupEntry` durante a
fase de inicialização pré-listen do gateway, mesmo quando o canal já está configurado.

Use isso apenas quando `setupEntry` cobrir totalmente a superfície de inicialização que precisa existir
antes de o gateway começar a escutar. Na prática, isso significa que a entrada de configuração
deve registrar toda capability controlada pelo canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes de o gateway começar a escutar
- quaisquer métodos do gateway, ferramentas ou serviços que precisem existir nessa mesma janela

Se sua entrada completa ainda controlar alguma capability obrigatória de inicialização, não habilite
essa flag. Mantenha o plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais empacotados também podem publicar helpers de superfície de contrato apenas de configuração que o core
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual
de promoção de configuração é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O core usa essa superfície quando precisa promover uma configuração legada de canal de conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
Matrix é o exemplo empacotado atual: ele move apenas chaves de autenticação/bootstrap para uma
conta promovida nomeada quando contas nomeadas já existem e pode preservar uma
chave de conta padrão não canônica configurada em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de configuração mantêm lazy a descoberta da superfície de contrato empacotada. O
tempo de importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso, em vez de reentrar na inicialização do canal empacotado durante a importação do módulo.

Quando essas superfícies de inicialização incluem métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces de admin do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) continuam reservados e sempre são resolvidos
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
dicas de instalação via `openclaw.install`. Isso mantém o catálogo do core sem dados fixos.

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
- `docsLabel`: substitui o texto do link dos docs
- `preferOver`: IDs de plugin/canal de prioridade mais baixa que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal de superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal de seletores interativos de configuração/onboarding quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação de docs
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: faz o canal aderir ao fluxo padrão de quickstart `allowFrom`
- `forceAccountBinding`: exige binding explícito de conta mesmo quando só existe uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca por sessão ao resolver alvos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canal** (por exemplo, uma
exportação de registry MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto controlam a orquestração do contexto da sessão para ingestão, montagem
e compactação. Registre-os do seu plugin com
`api.registerContextEngine(id, factory)` e então selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline padrão de contexto
em vez de apenas adicionar busca de memória ou hooks.

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

Se seu mecanismo **não** controlar o algoritmo de compactação, mantenha `compact()`
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
o sistema de plugins com um reach-in privado. Adicione a capability ausente.

Sequência recomendada:

1. defina o contrato do core
   Decida qual comportamento compartilhado o core deve controlar: política, fallback, mesclagem de configuração,
   ciclo de vida, semântica voltada a canais e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície útil
   tipada de capability.
3. conecte consumidores de core + canal/recurso
   Canais e plugins de recurso devem consumir a nova capability pelo core,
   não importando uma implementação de fornecedor diretamente.
4. registre implementações de fornecedores
   Plugins de fornecedor então registram seus backends na capability.
5. adicione cobertura de contrato
   Adicione testes para que o ownership e o formato de registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw continua opinativo sem ficar codificado segundo a visão de mundo
de um único provedor. Consulte o [Capability Cookbook](/pt-BR/plugins/architecture)
para um checklist concreto de arquivos e um exemplo completo.

### Checklist de capability

Quando você adicionar uma nova capability, a implementação normalmente deve tocar estas
superfícies juntas:

- tipos de contrato do core em `src/<capability>/types.ts`
- runner/helper de runtime do core em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- integração com o registro de plugins em `src/plugins/registry.ts`
- exposição do runtime de plugin em `src/plugins/runtime/*` quando plugins de recurso/canal
  precisarem consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- assertions de ownership/contrato em `src/plugins/contracts/registry.ts`
- documentação para operador/plugin em `docs/`

Se uma dessas superfícies estiver faltando, isso normalmente é um sinal de que a capability
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

- o core controla o contrato de capability + a orquestração
- plugins de fornecedor controlam implementações de fornecedor
- plugins de recurso/canal consomem helpers de runtime
- testes de contrato mantêm o ownership explícito
