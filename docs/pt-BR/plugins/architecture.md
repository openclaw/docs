---
read_when:
    - Criando ou depurando plugins nativos do OpenClaw
    - Entendendo o modelo de capacidades de plugins ou os limites de ownership
    - Trabalhando no pipeline de carregamento ou no registro de plugins
    - Implementando hooks de runtime de provedores ou plugins de canal
sidebarTitle: Internals
summary: 'Internals de plugins: modelo de capacidades, ownership, contratos, pipeline de carregamento e auxiliares de runtime'
title: Internals de plugins
x-i18n:
    generated_at: "2026-04-08T02:19:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: c40ecf14e2a0b2b8d332027aed939cd61fb4289a489f4cd4c076c96d707d1138
    source_path: plugins/architecture.md
    workflow: 15
---

# Internals de plugins

<Info>
  Esta é a **referência aprofundada de arquitetura**. Para guias práticos, consulte:
  - [Install and use plugins](/pt-BR/tools/plugin) — guia do usuário
  - [Getting Started](/pt-BR/plugins/building-plugins) — primeiro tutorial de plugin
  - [Channel Plugins](/pt-BR/plugins/sdk-channel-plugins) — crie um canal de mensagens
  - [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins) — crie um provedor de modelos
  - [SDK Overview](/pt-BR/plugins/sdk-overview) — mapa de importação e API de registro
</Info>

Esta página cobre a arquitetura interna do sistema de plugins do OpenClaw.

## Modelo de capacidades públicas

Capacidades são o modelo público de **plugin nativo** dentro do OpenClaw. Todo
plugin nativo do OpenClaw se registra em um ou mais tipos de capacidade:

| Capability             | Registration method                              | Example plugins                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferência de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferência da CLI | `api.registerCliBackend(...)`              | `openai`, `anthropic`                |
| Fala                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                          |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Compreensão de mídia   | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Geração de imagem      | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Geração de música      | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Busca web via fetch    | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Busca na web           | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensagens      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Um plugin que registra zero capacidades, mas fornece hooks, ferramentas ou
serviços, é um plugin **legado somente com hooks**. Esse padrão ainda é totalmente suportado.

### Postura de compatibilidade externa

O modelo de capacidades já foi integrado ao core e é usado hoje por plugins
agrupados/nativos, mas a compatibilidade de plugins externos ainda exige um padrão mais rígido do que "está
exportado, portanto está congelado".

Orientação atual:

- **plugins externos existentes:** mantenha integrações baseadas em hooks funcionando; trate
  isso como a base de compatibilidade
- **novos plugins agrupados/nativos:** prefira registro explícito de capacidades em vez de
  acessos específicos de fornecedor ou novos designs somente com hooks
- **plugins externos adotando registro de capacidades:** permitido, mas trate as
  superfícies auxiliares específicas de cada capacidade como evolutivas, a menos que a documentação marque explicitamente um
  contrato como estável

Regra prática:

- APIs de registro de capacidades são a direção pretendida
- hooks legados continuam sendo o caminho mais seguro para evitar quebras em plugins externos durante
  a transição
- subcaminhos auxiliares exportados não são todos iguais; prefira o contrato
  estreito e documentado, não exports auxiliares incidentais

### Formatos de plugins

O OpenClaw classifica cada plugin carregado em um formato com base em seu
comportamento real de registro (não apenas em metadados estáticos):

- **plain-capability** -- registra exatamente um tipo de capacidade (por exemplo, um
  plugin somente de provedor como `mistral`)
- **hybrid-capability** -- registra múltiplos tipos de capacidade (por exemplo,
  `openai` controla inferência de texto, fala, compreensão de mídia e geração
  de imagem)
- **hook-only** -- registra apenas hooks (tipados ou customizados), sem capacidades,
  ferramentas, comandos ou serviços
- **non-capability** -- registra ferramentas, comandos, serviços ou rotas, mas sem
  capacidades

Use `openclaw plugins inspect <id>` para ver o formato de um plugin e o detalhamento
de capacidades. Consulte a [referência da CLI](/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua suportado como caminho de compatibilidade para
plugins somente com hooks. Plugins legados reais ainda dependem dele.

Direção:

- mantenha funcionando
- documente como legado
- prefira `before_model_resolve` para trabalho de substituição de modelo/provedor
- prefira `before_prompt_build` para mutação de prompts
- remova apenas depois que o uso real cair e a cobertura de fixtures provar a segurança da migração

### Sinais de compatibilidade

Quando você executa `openclaw doctor` ou `openclaw plugins inspect <id>`, pode ver
um destes rótulos:

| Signal                     | Meaning                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **configuração válida**    | A configuração é analisada corretamente e os plugins são resolvidos |
| **aviso de compatibilidade** | O plugin usa um padrão suportado, mas mais antigo (por exemplo `hook-only`) |
| **aviso de legado**        | O plugin usa `before_agent_start`, que está obsoleto         |
| **erro grave**             | A configuração é inválida ou o plugin não foi carregado      |

Nem `hook-only` nem `before_agent_start` vão quebrar seu plugin hoje --
`hook-only` é apenas informativo, e `before_agent_start` aciona somente um aviso. Esses
sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

1. **Manifesto + descoberta**
   O OpenClaw encontra plugins candidatos em caminhos configurados, raízes do workspace,
   raízes globais de extensões e extensões agrupadas. A descoberta lê primeiro os manifestos nativos
   `openclaw.plugin.json` e os manifestos de bundle compatíveis suportados.
2. **Ativação + validação**
   O core decide se um plugin descoberto está ativado, desativado, bloqueado ou
   selecionado para um slot exclusivo, como memória.
3. **Carregamento em runtime**
   Plugins nativos do OpenClaw são carregados in-process via jiti e registram
   capacidades em um registro central. Bundles compatíveis são normalizados em
   registros do registro sem importar código de runtime.
4. **Consumo da superfície**
   O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração de provedores,
   hooks, rotas HTTP, comandos de CLI e serviços.

Especificamente para a CLI de plugins, a descoberta do comando raiz é dividida em duas fases:

- os metadados em tempo de parsing vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do plugin pode permanecer lazy e registrar-se na primeira invocação

Isso mantém o código da CLI controlado pelo plugin dentro do plugin, ao mesmo tempo que permite ao OpenClaw
reservar nomes de comandos raiz antes do parsing.

O limite de design importante:

- descoberta + validação de configuração devem funcionar a partir de **metadados de manifesto/schema**
  sem executar código do plugin
- o comportamento nativo de runtime vem do caminho `register(api)` do módulo do plugin

Essa divisão permite ao OpenClaw validar configuração, explicar plugins ausentes/desativados e
construir dicas de UI/schema antes que o runtime completo esteja ativo.

### Plugins de canal e a ferramenta compartilhada de mensagens

Plugins de canal não precisam registrar uma ferramenta separada de enviar/editar/reagir para
ações normais de chat. O OpenClaw mantém uma ferramenta compartilhada `message` no core, e
plugins de canal controlam a descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o core controla o host compartilhado da ferramenta `message`, a conexão com prompts, o
  bookkeeping de sessão/thread e o despacho da execução
- plugins de canal controlam a descoberta de ações com escopo, a descoberta de capacidades e quaisquer
  fragmentos de schema específicos do canal
- plugins de canal controlam a gramática de conversa de sessão específica do provedor, como
  IDs de conversa codificam IDs de thread ou herdam de conversas pai
- plugins de canal executam a ação final por meio do seu action adapter

Para plugins de canal, a superfície do SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta
permite que um plugin retorne em conjunto suas ações visíveis, capacidades e contribuições
de schema, para que essas partes não se desencontrem.

O core passa o escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` de entrada confiável

Isso importa para plugins sensíveis ao contexto. Um canal pode ocultar ou expor
ações de mensagem com base na conta ativa, sala/thread/mensagem atual ou
identidade confiável do solicitante, sem codificar branches específicos de canal na
ferramenta `message` do core.

É por isso que mudanças de roteamento do embedded runner ainda são trabalho de plugin: o runner é
responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta do plugin, para que a
ferramenta compartilhada `message` exponha a superfície controlada pelo canal correta para o turno atual.

Para auxiliares de execução controlados pelo canal, plugins agrupados devem manter o runtime de execução
dentro de seus próprios módulos de extensão. O core não controla mais os runtimes de ação de mensagem
do Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`.
Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e plugins agrupados
devem importar seu próprio código de runtime local diretamente de seus
módulos controlados pela extensão.

O mesmo limite se aplica a seams do SDK nomeadas por provedor em geral: o core não
deve importar convenience barrels específicas de canal para Slack, Discord, Signal,
WhatsApp ou extensões semelhantes. Se o core precisar de um comportamento, ele deve ou consumir
o barrel `api.ts` / `runtime-api.ts` do próprio plugin agrupado ou promover a necessidade
a uma capacidade genérica e estreita no SDK compartilhado.

Especificamente para polls, há dois caminhos de execução:

- `outbound.sendPoll` é a base compartilhada para canais que se encaixam no modelo
  comum de polls
- `actions.handleAction("poll")` é o caminho preferido para semânticas de poll
  específicas do canal ou parâmetros extras de poll

Agora o core adia o parsing compartilhado de polls até depois que o despacho de polls do plugin
recusar a ação, para que handlers de poll controlados pelo plugin possam aceitar
campos de poll específicos do canal sem serem bloqueados antes pelo parser genérico de polls.

Consulte [Pipeline de carregamento](#load-pipeline) para a sequência completa de inicialização.

## Modelo de ownership de capacidades

O OpenClaw trata um plugin nativo como o limite de ownership de uma **empresa** ou de uma
**funcionalidade**, não como um conjunto de integrações não relacionadas.

Isso significa:

- um plugin de empresa normalmente deve controlar todas as superfícies do OpenClaw
  dessa empresa
- um plugin de funcionalidade normalmente deve controlar toda a superfície da funcionalidade que ele introduz
- canais devem consumir capacidades compartilhadas do core em vez de reimplementar
  comportamento de provedor de forma ad hoc

Exemplos:

- o plugin agrupado `openai` controla o comportamento de provedor de modelos da OpenAI e o comportamento de
  fala + voz em tempo real + compreensão de mídia + geração de imagem da OpenAI
- o plugin agrupado `elevenlabs` controla o comportamento de fala da ElevenLabs
- o plugin agrupado `microsoft` controla o comportamento de fala da Microsoft
- o plugin agrupado `google` controla o comportamento de provedor de modelos do Google, além do comportamento de
  compreensão de mídia + geração de imagem + busca na web do Google
- o plugin agrupado `firecrawl` controla o comportamento de busca web via fetch do Firecrawl
- os plugins agrupados `minimax`, `mistral`, `moonshot` e `zai` controlam seus
  backends de compreensão de mídia
- o plugin agrupado `qwen` controla o comportamento do provedor de texto do Qwen, além do
  comportamento de compreensão de mídia e geração de vídeo
- o plugin `voice-call` é um plugin de funcionalidade: controla transporte de chamadas, ferramentas,
  CLI, rotas e bridging de media stream do Twilio, mas consome capacidades compartilhadas de fala
  mais transcrição em tempo real e voz em tempo real, em vez de
  importar plugins de fornecedor diretamente

O estado final pretendido é:

- OpenAI fica em um único plugin, mesmo que abranja modelos de texto, fala, imagens e
  vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual plugin de fornecedor controla o provedor; eles consomem o
  contrato de capacidade compartilhado exposto pelo core

Esta é a distinção principal:

- **plugin** = limite de ownership
- **capability** = contrato central que múltiplos plugins podem implementar ou consumir

Portanto, se o OpenClaw adicionar um novo domínio, como vídeo, a primeira pergunta não é
"qual provedor deve codificar o tratamento de vídeo?" A primeira pergunta é "qual é
o contrato central de capacidade de vídeo?" Assim que esse contrato existir, plugins de fornecedor
podem se registrar nele e plugins de canal/funcionalidade podem consumi-lo.

Se a capacidade ainda não existir, o movimento correto normalmente é:

1. definir a capacidade ausente no core
2. expô-la por meio da API/runtime de plugins de forma tipada
3. conectar canais/funcionalidades a essa capacidade
4. permitir que plugins de fornecedor registrem implementações

Isso mantém o ownership explícito, evitando comportamento no core que dependa de um
único fornecedor ou de um caminho de código pontual específico de plugin.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código pertence:

- **camada central de capacidade**: orquestração compartilhada, política, fallback, regras de merge
  de configuração, semântica de entrega e contratos tipados
- **camada de plugin do fornecedor**: APIs específicas do fornecedor, autenticação, catálogos de modelos, síntese de fala,
  geração de imagem, futuros backends de vídeo, endpoints de uso
- **camada de plugin de canal/funcionalidade**: integração com Slack/Discord/voice-call/etc.
  que consome capacidades centrais e as apresenta em uma superfície

Por exemplo, TTS segue este formato:

- o core controla política de TTS no momento da resposta, ordem de fallback, preferências e entrega no canal
- `openai`, `elevenlabs` e `microsoft` controlam implementações de síntese
- `voice-call` consome o auxiliar de runtime de TTS para telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de plugin de empresa com múltiplas capacidades

Um plugin de empresa deve parecer coeso visto de fora. Se o OpenClaw tiver
contratos compartilhados para modelos, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia,
geração de imagem, geração de vídeo, web fetch e busca na web,
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
      // hooks de auth/catálogo de modelos/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configuração de fala do fornecedor — implemente diretamente a interface SpeechProviderPlugin
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

O importante não são os nomes exatos dos auxiliares. O que importa é o formato:

- um único plugin controla a superfície do fornecedor
- o core ainda controla os contratos de capacidade
- plugins de canal e funcionalidade consomem auxiliares `api.runtime.*`, não código do fornecedor
- testes de contrato podem verificar se o plugin registrou as capacidades que
  afirma controlar

### Exemplo de capacidade: compreensão de vídeo

O OpenClaw já trata compreensão de imagem/áudio/vídeo como uma única
capacidade compartilhada. O mesmo modelo de ownership se aplica aqui:

1. o core define o contrato de media-understanding
2. plugins de fornecedor registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. plugins de canal e funcionalidade consomem o comportamento compartilhado do core em vez de
   se conectarem diretamente ao código do fornecedor

Isso evita incorporar ao core as suposições de vídeo de um provedor. O plugin controla
a superfície do fornecedor; o core controla o contrato de capacidade e o comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o core controla o contrato tipado
de capacidade e o auxiliar de runtime, e plugins de fornecedor registram
implementações `api.registerVideoGenerationProvider(...)` para essa capacidade.

Precisa de um checklist concreto de rollout? Consulte
[Capability Cookbook](/pt-BR/plugins/architecture).

## Contratos e enforcement

A superfície da API de plugins é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro suportados e
os auxiliares de runtime nos quais um plugin pode confiar.

Por que isso importa:

- autores de plugins têm um padrão interno estável
- o core pode rejeitar ownership duplicado, como dois plugins registrando o mesmo
  ID de provedor
- a inicialização pode mostrar diagnósticos acionáveis para registros malformados
- testes de contrato podem reforçar o ownership de plugins agrupados e evitar deriva silenciosa

Há duas camadas de enforcement:

1. **enforcement de registro em runtime**
   O registro de plugins valida registros à medida que os plugins são carregados. Exemplos:
   IDs duplicados de provedor, IDs duplicados de provedor de fala e registros
   malformados produzem diagnósticos de plugin em vez de comportamento indefinido.
2. **testes de contrato**
   Plugins agrupados são capturados em registros de contrato durante execuções de teste, para que
   o OpenClaw possa afirmar o ownership explicitamente. Hoje isso é usado para
   provedores de modelos, provedores de fala, provedores de busca na web e ownership
   de registro agrupado.

O efeito prático é que o OpenClaw sabe, de antemão, qual plugin controla qual
superfície. Isso permite que core e canais componham sem atrito, porque o ownership é
declarado, tipado e testável, em vez de implícito.

### O que pertence a um contrato

Bons contratos de plugin são:

- tipados
- pequenos
- específicos de capacidade
- controlados pelo core
- reutilizáveis por múltiplos plugins
- consumíveis por canais/funcionalidades sem conhecimento do fornecedor

Contratos ruins de plugin são:

- política específica de fornecedor escondida no core
- escape hatches pontuais de plugin que contornam o registro
- código de canal acessando direto uma implementação de fornecedor
- objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` ou
  `api.runtime`

Em caso de dúvida, eleve o nível de abstração: defina primeiro a capacidade e depois
deixe os plugins se conectarem a ela.

## Modelo de execução

Plugins nativos do OpenClaw são executados **in-process** com o Gateway. Eles não são
sandboxed. Um plugin nativo carregado tem o mesmo limite de confiança em nível de processo que
o código do core.

Implicações:

- um plugin nativo pode registrar ferramentas, handlers de rede, hooks e serviços
- um bug em um plugin nativo pode derrubar ou desestabilizar o gateway
- um plugin nativo malicioso equivale à execução arbitrária de código dentro do
  processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente
Skills agrupadas.

Use allowlists e caminhos explícitos de instalação/carregamento para plugins não agrupados. Trate
plugins do workspace como código de tempo de desenvolvimento, não como padrões de produção.

Para nomes de pacotes agrupados do workspace, mantenha o ID do plugin ancorado no nome npm:
`@openclaw/<id>` por padrão, ou um sufixo tipado aprovado, como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding`, quando
o pacote expõe intencionalmente um papel de plugin mais estreito.

Observação importante sobre confiança:

- `plugins.allow` confia em **IDs de plugin**, não na procedência da origem.
- Um plugin do workspace com o mesmo ID de um plugin agrupado intencionalmente sombreia
  a cópia agrupada quando esse plugin do workspace está ativado/na allowlist.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.

## Limite de exportação

O OpenClaw exporta capacidades, não conveniências de implementação.

Mantenha público o registro de capacidades. Remova exports auxiliares fora de contrato:

- subcaminhos auxiliares específicos de plugins agrupados
- subcaminhos de plumbing de runtime não destinados a ser API pública
- auxiliares de conveniência específicos de fornecedor
- auxiliares de setup/onboarding que são detalhes de implementação

Alguns subcaminhos auxiliares de plugins agrupados ainda permanecem no mapa de exportação
gerado do SDK por motivos de compatibilidade e manutenção de plugins agrupados. Exemplos
atuais incluem `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e várias seams `plugin-sdk/matrix*`. Trate esses caminhos como
exports reservados de detalhes de implementação, não como o padrão de SDK recomendado para
novos plugins de terceiros.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes de plugins candidatas
2. lê manifestos nativos ou de bundles compatíveis e metadados de pacotes
3. rejeita candidatos inseguros
4. normaliza a configuração de plugins (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a ativação de cada candidato
6. carrega módulos nativos ativados via jiti
7. chama hooks nativos `register(api)` (ou `activate(api)` — um alias legado) e coleta os registros no registro de plugins
8. expõe o registro para superfícies de comandos/runtime

<Note>
`activate` é um alias legado para `register` — o loader resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins agrupados usam `register`; prefira `register` para novos plugins.
</Note>

Os gates de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do plugin, o caminho tem permissão de escrita global, ou a
propriedade do caminho parece suspeita para plugins não agrupados.

### Comportamento orientado por manifesto

O manifesto é a fonte de verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/Skills/schema de configuração declarados ou capacidades do bundle
- validar `plugins.entries.<id>.config`
- enriquecer rótulos/placeholders da Control UI
- mostrar metadados de instalação/catálogo

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
o comportamento real, como hooks, ferramentas, comandos ou fluxos de provedor.

### O que o loader armazena em cache

O OpenClaw mantém caches curtos in-process para:

- resultados de descoberta
- dados do registro de manifestos
- registros de plugins carregados

Esses caches reduzem inicialização em rajadas e sobrecarga de comandos repetidos. Eles podem ser vistos com segurança
como caches de desempenho de curta duração, não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desativar esses caches.
- Ajuste as janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não alteram diretamente globais aleatórios do core. Eles se registram em um
registro central de plugins.

O registro rastreia:

- registros de plugin (identidade, origem, procedência, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- handlers RPC do gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos controlados por plugin

Recursos do core então leem esse registro em vez de falar diretamente com módulos de plugin.
Isso mantém o carregamento em um único sentido:

- módulo do plugin -> registro no registro
- runtime do core -> consumo do registro

Essa separação importa para a manutenção. Isso significa que a maioria das superfícies do core
precisa de apenas um ponto de integração: "leia o registro", e não "crie casos especiais para cada módulo de plugin".

## Callbacks de vínculo de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma solicitação de vínculo for aprovada ou negada:

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

Campos do payload do callback:

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: o vínculo resolvido para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de detach, ID do remetente e
  metadados da conversa

Esse callback é apenas notificativo. Ele não muda quem tem permissão para vincular uma
conversa, e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provedores

Agora plugins de provedor têm duas camadas:

- metadados de manifesto: `providerAuthEnvVars` para lookup barato de auth de provedor via ambiente
  antes do carregamento do runtime, `channelEnvVars` para lookup barato de canal/env/setup
  antes do carregamento do runtime, além de `providerAuthChoices` para rótulos
  baratos de onboarding/auth-choice e metadados de flags da CLI antes do carregamento do runtime
- hooks em tempo de configuração: `catalog` / legado `discovery` mais `applyConfigDefaults`
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
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico do provedor sem
precisar de um transporte inteiro de inferência customizado.

Use o manifesto `providerAuthEnvVars` quando o provedor tiver credenciais via ambiente
que caminhos genéricos de auth/status/seletor de modelo devam enxergar sem carregar o
runtime do plugin. Use o manifesto `providerAuthChoices` quando superfícies de CLI de onboarding/auth-choice
devem conhecer o ID de escolha do provedor, rótulos de grupo e wiring simples de autenticação
com uma única flag sem carregar o runtime do provedor. Mantenha `envVars` do runtime do provedor
para dicas voltadas ao operador, como rótulos de onboarding ou variáveis de
configuração de client-id/client-secret OAuth.

Use o manifesto `channelEnvVars` quando um canal tiver auth ou setup guiados por ambiente que
fallback genérico de shell-env, verificações de config/status ou prompts de setup devam enxergar
sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para plugins de modelo/provedor, o OpenClaw chama hooks aproximadamente nesta ordem.
A coluna "Quando usar" é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica configuração do provedor em `models.providers` durante a geração de `models.json`                     | O provedor controla um catálogo ou valores padrão de URL base                                                                             |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração controlados pelo provedor durante a materialização da configuração      | Os padrões dependem do modo de auth, ambiente ou semântica da família de modelos do provedor                                             |
| --  | _(lookup integrado de modelo)_    | O OpenClaw tenta primeiro o caminho normal do registro/catálogo                                                | _(não é um hook de plugin)_                                                                                                               |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de preview de IDs de modelo antes do lookup                                      | O provedor controla a limpeza de aliases antes da resolução canônica do modelo                                                            |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provedor antes da montagem genérica do modelo                       | O provedor controla a limpeza de transporte para IDs de provedor customizados na mesma família de transporte                             |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                      | O provedor precisa de limpeza de configuração que deve ficar com o plugin; auxiliares agrupados da família Google também cobrem entradas Google compatíveis |
| 6   | `applyNativeStreamingUsageCompat` | Aplica regravações de compatibilidade de uso nativo em streaming a provedores de configuração                | O provedor precisa de correções de metadados de uso nativo em streaming guiadas por endpoint                                             |
| 7   | `resolveConfigApiKey`             | Resolve auth por marcador de ambiente para provedores de configuração antes do carregamento da auth de runtime | O provedor tem resolução própria de chave de API por marcador de ambiente; `amazon-bedrock` também tem aqui um resolvedor integrado de marcador AWS |
| 8   | `resolveSyntheticAuth`            | Exibe auth local/self-hosted ou baseada em configuração sem persistir texto simples                            | O provedor pode operar com um marcador de credencial sintética/local                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis de auth externos controlados pelo provedor; `persistence` padrão é `runtime-only` para creds controladas por CLI/app | O provedor reutiliza credenciais externas de auth sem persistir tokens de refresh copiados                                               |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders de perfis sintéticos armazenados atrás de auth baseada em env/config                     | O provedor armazena perfis sintéticos placeholder que não devem ter precedência                                                           |
| 11  | `resolveDynamicModel`             | Fallback síncrono para IDs de modelo controlados pelo provedor ainda não presentes no registro local          | O provedor aceita IDs arbitrários de modelo upstream                                                                                      |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono e depois `resolveDynamicModel` é executado novamente                                   | O provedor precisa de metadados de rede antes de resolver IDs desconhecidos                                                               |
| 13  | `normalizeResolvedModel`          | Regravação final antes que o embedded runner use o modelo resolvido                                           | O provedor precisa de regravações de transporte, mas ainda usa um transporte do core                                                     |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos do fornecedor por trás de outro transporte compatível         | O provedor reconhece seus próprios modelos em transportes proxy sem assumir o controle do provedor                                       |
| 15  | `capabilities`                    | Metadados de transcrição/ferramentas controlados pelo provedor usados pela lógica compartilhada do core       | O provedor precisa de peculiaridades de transcrição/família de provedor                                                                   |
| 16  | `normalizeToolSchemas`            | Normaliza schemas de ferramentas antes que o embedded runner os veja                                          | O provedor precisa de limpeza de schema da família de transporte                                                                          |
| 17  | `inspectToolSchemas`              | Exibe diagnósticos de schema controlados pelo provedor após a normalização                                    | O provedor quer avisos sobre palavras-chave sem ensinar regras específicas do provedor ao core                                           |
| 18  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo ou marcado                                                   | O provedor precisa de saída de raciocínio/final marcada em vez de campos nativos                                                         |
| 19  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes de wrappers genéricos de opções de stream                     | O provedor precisa de parâmetros padrão de requisição ou limpeza de parâmetros por provedor                                              |
| 20  | `createStreamFn`                  | Substitui completamente o caminho normal de stream por um transporte customizado                              | O provedor precisa de um protocolo de wire customizado, não apenas um wrapper                                                            |
| 21  | `wrapStreamFn`                    | Wrapper de stream após aplicação dos wrappers genéricos                                                       | O provedor precisa de wrappers de compatibilidade de headers/corpo/modelo da requisição sem um transporte customizado                   |
| 22  | `resolveTransportTurnState`       | Anexa headers ou metadados nativos por turno do transporte                                                    | O provedor quer que transportes genéricos enviem identidade nativa de turno do provedor                                                  |
| 23  | `resolveWebSocketSessionPolicy`   | Anexa headers nativos de WebSocket ou política de cooldown da sessão                                          | O provedor quer que transportes WS genéricos ajustem headers de sessão ou política de fallback                                           |
| 24  | `formatApiKey`                    | Formatador de perfil de auth: o perfil armazenado se torna a string `apiKey` de runtime                      | O provedor armazena metadados extras de auth e precisa de um formato customizado de token de runtime                                     |
| 25  | `refreshOAuth`                    | Sobrescrita de refresh OAuth para endpoints customizados ou política de falha de refresh                      | O provedor não se encaixa nos refreshers compartilhados de `pi-ai`                                                                        |
| 26  | `buildAuthDoctorHint`             | Dica de reparo anexada quando o refresh OAuth falha                                                           | O provedor precisa de orientação de reparo de auth controlada pelo provedor após falha de refresh                                        |
| 27  | `matchesContextOverflowError`     | Matcher controlado pelo provedor para estouro de janela de contexto                                           | O provedor tem erros brutos de estouro que heurísticas genéricas perderiam                                                                |
| 28  | `classifyFailoverReason`          | Classificação controlada pelo provedor para motivo de failover                                                | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                                |
| 29  | `isCacheTtlEligible`              | Política de cache de prompt para provedores proxy/backhaul                                                    | O provedor precisa de gating de TTL de cache específico de proxy                                                                          |
| 30  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação de auth ausente                                              | O provedor precisa de uma dica específica do provedor para recuperar auth ausente                                                         |
| 31  | `suppressBuiltInModel`            | Supressão de modelo upstream desatualizado, mais dica opcional de erro voltada ao usuário                    | O provedor precisa ocultar linhas upstream desatualizadas ou substituí-las por uma dica do fornecedor                                    |
| 32  | `augmentModelCatalog`             | Linhas sintéticas/finais do catálogo anexadas após a descoberta                                               | O provedor precisa de linhas sintéticas de forward-compat em `models list` e seletores                                                   |
| 33  | `isBinaryThinking`                | Toggle de raciocínio ligado/desligado para provedores de thinking binário                                     | O provedor expõe apenas thinking binário ligado/desligado                                                                                 |
| 34  | `supportsXHighThinking`           | Suporte a raciocínio `xhigh` para modelos selecionados                                                        | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                               |
| 35  | `resolveDefaultThinkingLevel`     | Nível padrão de `/think` para uma família específica de modelos                                               | O provedor controla a política padrão de `/think` para uma família de modelos                                                             |
| 36  | `isModernModelRef`                | Matcher de modelo moderno para filtros de perfil live e seleção smoke                                         | O provedor controla a correspondência de modelo preferido em live/smoke                                                                   |
| 37  | `prepareRuntimeAuth`              | Converte uma credencial configurada no token/chave real de runtime imediatamente antes da inferência         | O provedor precisa de troca de token ou credencial de requisição de curta duração                                                         |
| 38  | `resolveUsageAuth`                | Resolve credenciais de uso/faturamento para `/usage` e superfícies relacionadas de status                    | O provedor precisa de parsing customizado de token de uso/cota ou de uma credencial de uso diferente                                     |
| 39  | `fetchUsageSnapshot`              | Busca e normaliza snapshots de uso/cota específicos do provedor depois que a auth é resolvida                | O provedor precisa de um endpoint de uso específico ou parser de payload                                                                  |
| 40  | `createEmbeddingProvider`         | Constrói um adapter de embeddings controlado pelo provedor para memória/busca                                | O comportamento de embeddings de memória pertence ao plugin do provedor                                                                   |
| 41  | `buildReplayPolicy`               | Retorna uma política de replay controlando o tratamento da transcrição para o provedor                       | O provedor precisa de política customizada de transcrição (por exemplo, remoção de blocos de thinking)                                   |
| 42  | `sanitizeReplayHistory`           | Regrava o histórico de replay após a limpeza genérica da transcrição                                          | O provedor precisa de regravações específicas de replay além de auxiliares compartilhados de compactação                                 |
| 43  | `validateReplayTurns`             | Validação ou remodelagem final dos turnos de replay antes do embedded runner                                  | O transporte do provedor precisa de validação mais rígida dos turnos após sanitização genérica                                           |
| 44  | `onModelSelected`                 | Executa efeitos colaterais pós-seleção controlados pelo provedor                                              | O provedor precisa de telemetria ou estado controlado pelo provedor quando um modelo se torna ativo                                      |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` verificam primeiro o
plugin de provedor correspondente e depois percorrem outros plugins de provedor com suporte a hooks
até que um realmente altere o ID do modelo ou o transporte/configuração. Isso mantém
shims de alias/compatibilidade de provedor funcionando sem exigir que o chamador saiba qual
plugin agrupado controla a regravação. Se nenhum hook de provedor regravar uma
entrada de configuração compatível da família Google, o normalizador de configuração agrupado do Google ainda aplica
essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo de wire totalmente customizado ou de um executor de requisição customizado,
isso é uma classe diferente de extensão. Esses hooks são para comportamento de provedor
que ainda é executado no loop normal de inferência do OpenClaw.

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
  e `wrapStreamFn` porque controla a forward-compat do Claude 4.6,
  dicas de família de provedor, orientação de reparo de auth, integração com endpoint de uso,
  elegibilidade de cache de prompt, padrões de configuração sensíveis à auth, política
  padrão/adaptativa de thinking do Claude e modelagem de stream específica da Anthropic para
  headers beta, `/fast` / `serviceTier` e `context1m`.
- Os auxiliares de stream específicos do Claude na Anthropic permanecem na
  própria seam pública `api.ts` / `contract-api.ts` do plugin agrupado por enquanto. Essa
  superfície do pacote exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os builders de wrapper
  Anthropic de nível mais baixo, em vez de ampliar o SDK genérico em torno das regras de
  header beta de um único provedor.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities`, além de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  porque controla a forward-compat do GPT-5.4, a normalização direta da OpenAI
  `openai-completions` -> `openai-responses`, dicas de auth sensíveis ao Codex,
  supressão de Spark, linhas sintéticas da lista OpenAI e política
  de thinking / modelo live do GPT-5; a família de stream `openai-responses-defaults` controla os
  wrappers nativos compartilhados do OpenAI Responses para headers de atribuição,
  `/fast`/`serviceTier`, verbosidade de texto, busca web nativa do Codex,
  modelagem de payload de compatibilidade de raciocínio e gerenciamento de contexto do Responses.
- OpenRouter usa `catalog`, além de `resolveDynamicModel` e
  `prepareDynamicModel`, porque o provedor é pass-through e pode expor novos
  IDs de modelo antes de o catálogo estático do OpenClaw ser atualizado; também usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para manter
  headers específicos do provedor, metadados de roteamento, patches de raciocínio e
  política de cache de prompt fora do core. Sua política de replay vem da família
  `passthrough-gemini`, enquanto a família de stream `openrouter-thinking`
  controla a injeção de raciocínio por proxy e os casos sem suporte em modelos / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities`, além de `prepareRuntimeAuth` e `fetchUsageSnapshot`, porque
  precisa de login por dispositivo controlado pelo provedor, comportamento de fallback de modelo, peculiaridades
  da transcrição do Claude, uma troca de token GitHub -> Copilot e um endpoint de uso
  controlado pelo provedor.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog`, além de
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot`, porque
  ainda roda sobre os transportes OpenAI do core, mas controla sua normalização de transporte/URL base,
  política de fallback de refresh OAuth, escolha padrão de transporte,
  linhas sintéticas do catálogo Codex e integração com endpoint de uso do ChatGPT; ele
  compartilha a mesma família de stream `openai-responses-defaults` da OpenAI direta.
- Google AI Studio e OAuth do Gemini CLI usam `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque a
  família de replay `google-gemini` controla fallback de forward-compat do Gemini 3.1,
  validação nativa de replay do Gemini, sanitização de replay de bootstrap, modo
  de saída de raciocínio marcado e correspondência de modelo moderno, enquanto a
  família de stream `google-thinking` controla a normalização do payload de thinking do Gemini;
  o OAuth do Gemini CLI também usa `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` para formatação de token, parsing de token e ligação com endpoint de cota.
- Anthropic Vertex usa `buildReplayPolicy` por meio da
  família de replay `anthropic-by-model`, para que a limpeza de replay específica do Claude permaneça
  restrita a IDs Claude, em vez de atingir todo transporte `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel` porque controla
  a classificação Bedrock-específica de erros de throttle/não pronto/estouro de contexto
  em tráfego Anthropic-on-Bedrock; sua política de replay ainda compartilha a mesma
  guarda `anthropic-by-model` restrita a Claude.
- OpenRouter, Kilocode, Opencode e Opencode Go usam `buildReplayPolicy`
  por meio da família de replay `passthrough-gemini`, porque fazem proxy de modelos Gemini
  por transportes compatíveis com OpenAI e precisam de sanitização da
  thought-signature do Gemini sem validação nativa de replay do Gemini nem
  regravações de bootstrap.
- MiniMax usa `buildReplayPolicy` por meio da
  família de replay `hybrid-anthropic-openai`, porque um único provedor controla semânticas
  tanto de mensagem Anthropic quanto compatíveis com OpenAI; ele mantém a remoção de
  blocos de thinking restrita ao Claude do lado Anthropic, enquanto substitui o modo de saída
  de raciocínio de volta para nativo, e a família de stream `minimax-fast-mode` controla
  regravações de modelo fast-mode no caminho de stream compartilhado.
- Moonshot usa `catalog`, além de `wrapStreamFn`, porque ainda usa o
  transporte OpenAI compartilhado, mas precisa de normalização de payload de thinking
  controlada pelo provedor; a família de stream `moonshot-thinking` mapeia configuração + estado de `/think`
  para seu payload nativo de thinking binário.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible`, porque precisa de headers de requisição controlados pelo provedor,
  normalização de payload de raciocínio, dicas de transcrição Gemini e
  gating de cache-TTL da Anthropic; a família de stream `kilocode-thinking` mantém a injeção
  de thinking do Kilo no caminho compartilhado de stream proxy, enquanto ignora `kilo/auto` e
  outros IDs de modelo proxy que não suportam payloads explícitos de raciocínio.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot`, porque controla fallback de GLM-5,
  padrões de `tool_stream`, UX de thinking binário, correspondência de modelo moderno e tanto
  auth de uso quanto busca de cota; a família de stream `tool-stream-default-on` mantém
  o wrapper `tool_stream` ativado por padrão fora do glue manual por provedor.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque controla normalização nativa de transporte xAI Responses, regravações de alias
  de fast-mode do Grok, `tool_stream` padrão, limpeza estrita de ferramentas / payload de raciocínio,
  reutilização de auth de fallback para ferramentas controladas pelo plugin, resolução de modelo Grok
  com forward-compat e patches de compat controlados pelo provedor, como o perfil de
  schema de ferramenta do xAI, palavras-chave de schema sem suporte, `web_search`
  nativo e decodificação de argumentos de chamada de ferramenta com entidades HTML.
- Mistral, OpenCode Zen e OpenCode Go usam apenas `capabilities` para manter
  peculiaridades de transcrição/ferramentas fora do core.
- Provedores agrupados somente com catálogo, como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine`, usam
  apenas `catalog`.
- Qwen usa `catalog` para seu provedor de texto, além de registros compartilhados de
  media-understanding e geração de vídeo para suas superfícies multimodais.
- MiniMax e Xiaomi usam `catalog` mais hooks de uso, porque seu comportamento de `/usage`
  é controlado pelo plugin, embora a inferência ainda rode pelos transportes compartilhados.

## Auxiliares de runtime

Plugins podem acessar auxiliares centrais selecionados por meio de `api.runtime`. Para TTS:

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

- `textToSpeech` retorna o payload normal de saída de TTS do core para superfícies de arquivo/nota de voz.
- Usa a configuração central `messages.tts` e a seleção de provedor.
- Retorna buffer de áudio PCM + sample rate. Plugins devem fazer resample/encode para provedores.
- `listVoices` é opcional por provedor. Use para seletores de voz ou fluxos de setup controlados pelo fornecedor.
- Listagens de vozes podem incluir metadados mais ricos, como locale, gênero e tags de personalidade para seletores sensíveis ao provedor.
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
- A entrada legada `edge` da Microsoft é normalizada para o ID de provedor `microsoft`.
- O modelo de ownership preferido é orientado por empresa: um único plugin de fornecedor pode controlar
  texto, fala, imagem e futuros provedores de mídia à medida que o OpenClaw adicionar esses
  contratos de capacidade.

Para compreensão de imagem/áudio/vídeo, plugins registram um único provedor tipado de
media-understanding em vez de um saco genérico de chave/valor:

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

- Mantenha orquestração, fallback, configuração e conexão com canais no core.
- Mantenha comportamento do fornecedor no plugin de provedor.
- Expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos
  opcionais de resultado, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core controla o contrato de capacidade e o auxiliar de runtime
  - plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - plugins de funcionalidade/canal consomem `api.runtime.videoGeneration.*`

Para auxiliares de runtime de media-understanding, plugins podem chamar:

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
  // Opcional quando o MIME não pode ser inferido com confiabilidade:
  mime: "audio/ogg",
});
```

Observações:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferida para
  compreensão de imagem/áudio/vídeo.
- Usa a configuração central de áudio de media-understanding (`tools.media.audio`) e a ordem de fallback do provedor.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não suportada).
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

- `provider` e `model` são substituições por execução opcionais, não mudanças persistentes de sessão.
- O OpenClaw só honra esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback controladas por plugin, operadores devem ativar explicitamente com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de plugins não confiáveis ainda funcionam, mas solicitações de substituição são rejeitadas em vez de cair silenciosamente em fallback.

Para busca na web, plugins podem consumir o auxiliar de runtime compartilhado em vez de
acessar diretamente a conexão da ferramenta do agente:

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

- Mantenha seleção de provedor, resolução de credenciais e semântica compartilhada de requisição no core.
- Use provedores de busca na web para transportes de busca específicos do fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para plugins de funcionalidade/canal que precisam de comportamento de busca sem depender do wrapper da ferramenta do agente.

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

Campos da rota:

- `path`: caminho da rota sob o servidor HTTP do gateway.
- `auth`: obrigatório. Use `"gateway"` para exigir a auth normal do gateway, ou `"plugin"` para auth/validação de webhook gerenciada pelo plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a requisição.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará erro de carregamento do plugin. Use `api.registerHttpRoute(...)`.
- Rotas de plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com níveis diferentes de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de auth.
- Rotas com `auth: "plugin"` **não** recebem automaticamente escopos de runtime do operador. Elas são para webhooks/verificação de assinatura gerenciados pelo plugin, não para chamadas privilegiadas a auxiliares do Gateway.
- Rotas com `auth: "gateway"` rodam dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - auth bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém os escopos de runtime da rota do plugin fixos em `operator.write`, mesmo se o chamador enviar `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) só honram `x-openclaw-scopes` quando o header está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas requisições de rota de plugin com identidade, o escopo de runtime volta para `operator.write`
- Regra prática: não presuma que uma rota de plugin autenticada por gateway seja implicitamente uma superfície de admin. Se sua rota precisar de comportamento somente admin, exija um modo de auth com identidade e documente o contrato explícito do header `x-openclaw-scopes`.

## Caminhos de importação do Plugin SDK

Use subcaminhos do SDK em vez da importação monolítica `openclaw/plugin-sdk` ao
criar plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de plugins.
- `openclaw/plugin-sdk/core` para o contrato genérico e compartilhado voltado a plugins.
- `openclaw/plugin-sdk/config-schema` para o export do schema Zod raiz de `openclaw.json`
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
  `openclaw/plugin-sdk/webhook-ingress` para wiring compartilhado de
  setup/auth/resposta/webhook. `channel-inbound` é o lar compartilhado para debounce, correspondência
  de menções, auxiliares de política de menção de entrada, formatação de envelope e
  auxiliares de contexto de envelope de entrada.
  `channel-setup` é a seam estreita de setup com instalação opcional.
  `setup-runtime` é a superfície de setup segura para runtime usada por `setupEntry` /
  inicialização adiada, incluindo os patch adapters de setup seguros para importação.
  `setup-adapter-runtime` é a seam de adapter de setup de conta sensível ao ambiente.
  `setup-tools` é a seam pequena de auxiliares de CLI/arquivo/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subcaminhos de domínio como `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
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
  `openclaw/plugin-sdk/directory-runtime` para auxiliares compartilhados de runtime/configuração.
  `telegram-command-config` é a seam pública estreita para normalização/validação de comandos
  customizados do Telegram e permanece disponível mesmo que a superfície de contrato agrupada do
  Telegram fique temporariamente indisponível.
  `text-runtime` é a seam compartilhada de texto/markdown/logging, incluindo
  remoção de texto visível ao assistente, auxiliares de renderização/fragmentação de markdown,
  auxiliares de redação, auxiliares de tags de diretiva e utilitários de texto seguro.
- Seams de canal específicas de aprovação devem preferir um único contrato
  `approvalCapability` no plugin. O core então lê auth, entrega, renderização,
  roteamento nativo e comportamento lazy de handler nativo de aprovação por meio dessa
  capacidade única, em vez de misturar comportamento de aprovação em campos não relacionados do plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto e permanece apenas como
  shim de compatibilidade para plugins antigos. Código novo deve importar as primitivas genéricas mais estreitas, e o código do repositório não deve adicionar novas importações do
  shim.
- Internals de extensões agrupadas permanecem privados. Plugins externos devem usar apenas
  subcaminhos `openclaw/plugin-sdk/*`. Código central/de teste do OpenClaw pode usar os
  pontos de entrada públicos do repositório sob a raiz de um pacote de plugin, como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e arquivos de escopo estreito como
  `login-qr-api.js`. Nunca importe `src/*` de um pacote de plugin a partir do core nem de outra extensão.
- Divisão do ponto de entrada do repositório:
  `<plugin-package-root>/api.js` é o barrel de auxiliares/tipos,
  `<plugin-package-root>/runtime-api.js` é o barrel apenas de runtime,
  `<plugin-package-root>/index.js` é a entrada do plugin agrupado
  e `<plugin-package-root>/setup-entry.js` é a entrada do plugin de setup.
- Exemplos atuais de provedores agrupados:
  - Anthropic usa `api.js` / `contract-api.js` para auxiliares de stream do Claude, como
    `wrapAnthropicProviderStream`, auxiliares de beta-header e parsing de `service_tier`.
  - OpenAI usa `api.js` para builders de provedor, auxiliares de modelo padrão e
    builders de provedor de tempo real.
  - OpenRouter usa `api.js` para seu builder de provedor e auxiliares de onboarding/configuração,
    enquanto `register.runtime.js` ainda pode reexportar auxiliares genéricos
    `plugin-sdk/provider-stream` para uso local no repositório.
- Pontos de entrada públicos carregados por facade preferem o snapshot ativo de configuração em runtime
  quando ele existe e, se não existir, recorrem ao arquivo de configuração resolvido em disco quando
  o OpenClaw ainda não está servindo um snapshot de runtime.
- Primitivas compartilhadas genéricas continuam sendo o contrato público preferido do SDK. Ainda existe
  um pequeno conjunto reservado de seams auxiliares com marca de canal agrupado para compatibilidade.
  Trate essas seams como destinadas à manutenção/compatibilidade de plugins agrupados, não como novos alvos de importação de terceiros; novos contratos entre canais ainda devem ser publicados em
  subcaminhos genéricos `plugin-sdk/*` ou nos barrels locais `api.js` /
  `runtime-api.js` do plugin.

Observação de compatibilidade:

- Evite o barrel raiz `openclaw/plugin-sdk` em código novo.
- Prefira primeiro as primitivas estáveis mais estreitas. Os subcaminhos mais recentes de
  setup/pairing/reply/feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool são o contrato pretendido para novo trabalho em plugins agrupados e externos.
  Parsing/matching de alvos pertence a `openclaw/plugin-sdk/channel-targets`.
  Gates de ação de mensagem e auxiliares de ID de mensagem de reação pertencem a
  `openclaw/plugin-sdk/channel-actions`.
- Barrels auxiliares específicos de extensões agrupadas não são estáveis por padrão. Se um
  auxiliar for necessário apenas para uma extensão agrupada, mantenha-o atrás da seam local
  `api.js` ou `runtime-api.js` da extensão, em vez de promovê-lo para
  `openclaw/plugin-sdk/<extension>`.
- Novas seams de auxiliares compartilhados devem ser genéricas, não marcadas por canal. Parsing
  compartilhado de alvos pertence a `openclaw/plugin-sdk/channel-targets`; internals específicos
  de canal ficam atrás da seam local `api.js` ou `runtime-api.js` do plugin controlador.
- Subcaminhos específicos de capacidade, como `image-generation`,
  `media-understanding` e `speech`, existem porque plugins agrupados/nativos os usam
  hoje. Sua presença não significa, por si só, que todo auxiliar exportado seja um
  contrato externo congelado de longo prazo.

## Schemas da ferramenta de mensagens

Plugins devem controlar contribuições de schema de `describeMessageTool(...)` específicas do canal.
Mantenha campos específicos do provedor no plugin, não no core compartilhado.

Para fragmentos portáveis de schema compartilhado, reutilize os auxiliares genéricos exportados por
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para payloads no estilo grade de botões
- `createMessageToolCardSchema()` para payloads estruturados de cartão

Se um formato de schema fizer sentido apenas para um provedor, defina-o no
próprio código-fonte desse plugin em vez de promovê-lo ao SDK compartilhado.

## Resolução de alvo de canal

Plugins de canal devem controlar semânticas de alvo específicas do canal. Mantenha o
host compartilhado de saída genérico e use a superfície do adapter de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um alvo normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes do lookup no diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve ir direto para resolução por ID, em vez de busca no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando
  o core precisa de uma resolução final controlada pelo provedor após a normalização ou depois
  de não encontrar nada no diretório.
- `messaging.resolveOutboundSessionRoute(...)` controla a construção da rota de sessão de saída
  específica do provedor depois que um alvo é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes
  de buscar peers/grupos.
- Use `looksLikeId` para verificações do tipo "trate isto como um ID de alvo explícito/nativo".
- Use `resolveTarget` para fallback específico do provedor após a normalização, não para
  busca ampla no diretório.
- Mantenha IDs nativos do provedor, como chat ids, thread ids, JIDs, handles e room
  ids, dentro de valores `target` ou parâmetros específicos do provedor, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório a partir de configuração devem manter essa lógica no
plugin e reutilizar os auxiliares compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de peers/grupos baseados em configuração, como:

- peers de DM orientados por allowlist
- mapas configurados de canais/grupos
- fallbacks de diretório estático por escopo de conta

Os auxiliares compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consulta
- aplicação de limite
- auxiliares de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta específica do canal e normalização de ID devem permanecer na implementação do
plugin.

## Catálogos de provedores

Plugins de provedor podem definir catálogos de modelos para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para múltiplas entradas de provedor

Use `catalog` quando o plugin controlar IDs de modelo específicos do provedor, padrões de URL base
ou metadados de modelo dependentes de auth.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos
provedores implícitos integrados do OpenClaw:

- `simple`: provedores simples por chave de API ou ambiente
- `profile`: provedores que aparecem quando existem perfis de auth
- `paired`: provedores que sintetizam múltiplas entradas de provedor relacionadas
- `late`: última passagem, depois de outros provedores implícitos

Provedores posteriores vencem em colisão de chave, então plugins podem intencionalmente sobrescrever
uma entrada integrada de provedor com o mesmo ID de provedor.

Compatibilidade:

- `discovery` ainda funciona como alias legado
- se `catalog` e `discovery` forem registrados, o OpenClaw usa `catalog`

## Inspeção de canal somente leitura

Se seu plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Motivo:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que credenciais
  estão totalmente materializadas e falhar rapidamente quando segredos obrigatórios estão ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de
  repair do doctor/config, não devem precisar materializar credenciais de runtime apenas para
  descrever a configuração.

Comportamento recomendado para `inspectAccount(...)`:

- Retorne apenas o estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status da credencial quando relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para relatar disponibilidade em modo somente leitura. Retornar `tokenStatus: "available"` (e o campo de origem correspondente) é suficiente para comandos no estilo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho atual do comando.

Isso permite que comandos somente leitura relatem "configurado, mas indisponível neste caminho de comando" em vez de falhar ou informar incorretamente que a conta não está configurada.

## Pacotes pack

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

Cada entrada se torna um plugin. Se o pack listar múltiplas extensões, o ID do plugin
passa a ser `name/<fileBase>`.

Se seu plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Medida de segurança: toda entrada `openclaw.extensions` deve permanecer dentro do diretório do plugin
após resolução de symlink. Entradas que escaparem do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências de plugins com
`npm install --omit=dev --ignore-scripts` (sem lifecycle scripts, sem dev dependencies em runtime). Mantenha as árvores de dependência
dos plugins em "JS/TS puro" e evite pacotes que exijam builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve apenas de setup.
Quando o OpenClaw precisa de superfícies de setup para um plugin de canal desativado, ou
quando um plugin de canal está ativado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso mantém inicialização e setup mais leves
quando a entrada principal do plugin também conecta ferramentas, hooks ou outro código apenas de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode incluir um plugin de canal no mesmo caminho `setupEntry` durante a fase de
inicialização pré-listen do gateway, mesmo quando o canal já estiver configurado.

Use isso apenas quando `setupEntry` cobrir totalmente a superfície de inicialização que deve existir
antes que o gateway comece a escutar. Na prática, isso significa que a entrada de setup
deve registrar toda capacidade controlada pelo canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes de o gateway começar a escutar
- quaisquer métodos, ferramentas ou serviços do gateway que precisem existir durante essa mesma janela

Se sua entrada completa ainda controlar alguma capacidade de inicialização obrigatória, não ative
essa flag. Mantenha o plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais agrupados também podem publicar auxiliares da superfície de contrato apenas de setup que o core
pode consultar antes do carregamento do runtime completo do canal. A superfície atual de promoção
de setup é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O core usa essa superfície quando precisa promover uma configuração legada de canal de conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
O Matrix é o exemplo agrupado atual: ele move apenas chaves de auth/bootstrap para uma
conta promovida com nome quando contas nomeadas já existem e pode preservar uma
chave configurada de conta padrão não canônica, em vez de sempre criar
`accounts.default`.

Esses patch adapters de setup mantêm lazy a descoberta da superfície de contrato agrupada. O tempo
de importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso, em vez de
reentrar na inicialização do canal agrupado no momento da importação do módulo.

Quando essas superfícies de inicialização incluem métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces centrais de admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre são resolvidos
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

Plugins de canal podem anunciar metadados de setup/descoberta por meio de `openclaw.channel` e
dicas de instalação por meio de `openclaw.install`. Isso mantém os dados de catálogo fora do core.

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
      "blurb": "Chat self-hosted via bots de webhook do Nextcloud Talk.",
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
- `preferOver`: IDs de plugin/canal de prioridade menor que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de setup/configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação de docs
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos para compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: inclui o canal no fluxo padrão de quickstart `allowFrom`
- `forceAccountBinding`: exige vínculo explícito de conta, mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere lookup de sessão ao resolver alvos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canais** (por exemplo, um export de
registro MPM). Coloque um arquivo JSON em um destes caminhos:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (separados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto controlam a orquestração do contexto da sessão para ingestão, montagem
e compactação. Registre-os a partir do seu plugin com
`api.registerContextEngine(id, factory)` e depois selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline padrão de contexto em vez
de apenas adicionar busca em memória ou hooks.

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

Se seu mecanismo **não** controlar o algoritmo de compactação, mantenha `compact()`
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

Quando um plugin precisar de um comportamento que não se encaixe na API atual, não contorne
o sistema de plugins com um reach-in privado. Adicione a capacidade que está faltando.

Sequência recomendada:

1. defina o contrato central
   Decida qual comportamento compartilhado o core deve controlar: política, fallback, merge de configuração,
   ciclo de vida, semântica voltada para canais e formato do auxiliar de runtime.
2. adicione superfícies tipadas de registro/runtime de plugins
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície de capacidade
   tipada e útil.
3. conecte consumidores do core e de canais/funcionalidades
   Canais e plugins de funcionalidade devem consumir a nova capacidade pelo core,
   não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends nessa capacidade.
5. adicione cobertura de contrato
   Adicione testes para que o formato de ownership e registro permaneça explícito ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar codificado para a visão de mundo de
um único provedor. Consulte o [Capability Cookbook](/pt-BR/plugins/architecture)
para um checklist concreto de arquivos e um exemplo completo.

### Checklist de capacidade

Ao adicionar uma nova capacidade, a implementação normalmente deve tocar estas
superfícies em conjunto:

- tipos de contrato central em `src/<capability>/types.ts`
- runner/auxiliar de runtime central em `src/<capability>/runtime.ts`
- superfície de registro da API de plugins em `src/plugins/types.ts`
- wiring do registro de plugins em `src/plugins/registry.ts`
- exposição de runtime de plugins em `src/plugins/runtime/*` quando plugins de funcionalidade/canal
  precisarem consumi-la
- auxiliares de captura/teste em `src/test-utils/plugin-registration.ts`
- assertions de ownership/contrato em `src/plugins/contracts/registry.ts`
- docs para operadores/plugins em `docs/`

Se uma dessas superfícies estiver faltando, isso normalmente é um sinal de que a capacidade
ainda não está totalmente integrada.

### Template de capacidade

Padrão mínimo:

```ts
// contrato central
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

// auxiliar compartilhado de runtime para plugins de funcionalidade/canal
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

- o core controla o contrato de capacidade + a orquestração
- plugins de fornecedor controlam implementações de fornecedor
- plugins de funcionalidade/canal consomem auxiliares de runtime
- testes de contrato mantêm o ownership explícito
