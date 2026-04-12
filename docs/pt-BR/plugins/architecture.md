---
read_when:
    - Criando ou depurando Plugins nativos do OpenClaw
    - Entender o modelo de capacidades de Plugin ou os limites de propriedade
    - Trabalhar no pipeline de carregamento ou no registro de Plugin
    - Implementar hooks de runtime de provider ou plugins de canal
sidebarTitle: Internals
summary: 'Internos de Plugin: modelo de capacidades, propriedade, contratos, pipeline de carregamento e helpers de runtime'
title: Internos de Plugin
x-i18n:
    generated_at: "2026-04-12T23:28:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37361c1e9d2da57c77358396f19dfc7f749708b66ff68f1bf737d051b5d7675d
    source_path: plugins/architecture.md
    workflow: 15
---

# Internos de Plugin

<Info>
  Esta é a **referência aprofundada de arquitetura**. Para guias práticos, consulte:
  - [Instalar e usar plugins](/pt-BR/tools/plugin) — guia do usuário
  - [Primeiros passos](/pt-BR/plugins/building-plugins) — primeiro tutorial de Plugin
  - [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — crie um canal de mensagens
  - [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins) — crie um provider de modelo
  - [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — mapa de importação e API de registro
</Info>

Esta página cobre a arquitetura interna do sistema de Plugin do OpenClaw.

## Modelo público de capacidades

Capacidades são o modelo público de **Plugin nativo** dentro do OpenClaw. Todo
Plugin nativo do OpenClaw se registra em um ou mais tipos de capacidade:

| Capacidade            | Método de registro                              | Plugins de exemplo                   |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| Inferência de texto   | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend de inferência da CLI | `api.registerCliBackend(...)`            | `openai`, `anthropic`                |
| Fala                  | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                          |
| Voz em tempo real     | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Entendimento de mídia | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Geração de imagem     | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Geração de música     | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Geração de vídeo      | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Busca na web          | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Pesquisa na web       | `api.registerWebSearchProvider(...)`            | `google`                             |
| Canal / mensagens     | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Um Plugin que registra zero capacidades, mas fornece hooks, ferramentas ou
serviços, é um Plugin **legado somente com hooks**. Esse padrão continua sendo totalmente compatível.

### Posição de compatibilidade externa

O modelo de capacidades já está implementado no core e é usado hoje por
plugins nativos/embutidos, mas a compatibilidade de plugins externos ainda
precisa de uma barra mais rígida do que “está exportado, portanto está congelado”.

Orientação atual:

- **plugins externos existentes:** mantenha integrações baseadas em hooks funcionando; trate
  isso como a linha de base de compatibilidade
- **novos plugins nativos/embutidos:** prefira registro explícito de capacidades em vez de
  acessos específicos de fornecedor ou novos designs somente com hooks
- **plugins externos adotando registro de capacidades:** permitido, mas trate as superfícies de helper
  específicas de capacidade como em evolução, a menos que a documentação marque explicitamente um contrato como estável

Regra prática:

- as APIs de registro de capacidades são a direção pretendida
- hooks legados continuam sendo o caminho mais seguro, sem quebra, para plugins externos durante
  a transição
- nem todos os subcaminhos de helper exportados são equivalentes; prefira o contrato estreito e documentado, não exports incidentais

### Formatos de Plugin

O OpenClaw classifica cada Plugin carregado em um formato com base em seu comportamento real
de registro (não apenas em metadados estáticos):

- **plain-capability** -- registra exatamente um tipo de capacidade (por exemplo, um
  Plugin somente de provider como `mistral`)
- **hybrid-capability** -- registra múltiplos tipos de capacidade (por exemplo,
  `openai` é proprietário de inferência de texto, fala, entendimento de mídia e
  geração de imagem)
- **hook-only** -- registra apenas hooks (tipados ou personalizados), sem
  capacidades, ferramentas, comandos ou serviços
- **non-capability** -- registra ferramentas, comandos, serviços ou rotas, mas nenhuma
  capacidade

Use `openclaw plugins inspect <id>` para ver o formato de um Plugin e o detalhamento
de capacidades. Consulte [Referência da CLI](/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como um caminho de compatibilidade para
plugins somente com hooks. Plugins legados do mundo real ainda dependem dele.

Direção:

- mantenha-o funcionando
- documente-o como legado
- prefira `before_model_resolve` para trabalho de substituição de modelo/provider
- prefira `before_prompt_build` para trabalho de mutação de prompt
- remova-o somente depois que o uso real cair e a cobertura de fixtures comprovar a segurança da migração

### Sinais de compatibilidade

Quando você executa `openclaw doctor` ou `openclaw plugins inspect <id>`, pode ver
um destes rótulos:

| Sinal                     | Significado                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | A configuração é analisada corretamente e os plugins são resolvidos |
| **compatibility advisory** | O Plugin usa um padrão compatível, mas mais antigo (por exemplo, `hook-only`) |
| **legacy warning**        | O Plugin usa `before_agent_start`, que está obsoleto         |
| **hard error**            | A configuração é inválida ou o Plugin não conseguiu carregar |

Nem `hook-only` nem `before_agent_start` vão quebrar seu Plugin hoje --
`hook-only` é apenas informativo, e `before_agent_start` dispara somente um aviso. Esses
sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de Plugin do OpenClaw tem quatro camadas:

1. **Manifesto + descoberta**
   O OpenClaw encontra Plugins candidatos em caminhos configurados, raízes de workspace,
   raízes globais de extensões e extensões embutidas. A descoberta lê primeiro
   manifestos nativos `openclaw.plugin.json` e manifestos de bundle compatíveis.
2. **Habilitação + validação**
   O core decide se um Plugin descoberto está habilitado, desabilitado, bloqueado ou
   selecionado para um slot exclusivo, como memória.
3. **Carregamento em runtime**
   Plugins nativos do OpenClaw são carregados em processo via jiti e registram
   capacidades em um registro central. Bundles compatíveis são normalizados em
   registros do registro sem importar código de runtime.
4. **Consumo de superfícies**
   O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração
   de provider, hooks, rotas HTTP, comandos de CLI e serviços.

Especificamente para a CLI de Plugin, a descoberta do comando raiz é dividida em duas fases:

- os metadados em tempo de parsing vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real de CLI do Plugin pode continuar lazy e se registrar na primeira invocação

Isso mantém o código de CLI pertencente ao Plugin dentro do próprio Plugin, enquanto ainda permite que o OpenClaw
reserve nomes de comando raiz antes do parsing.

O limite de design importante:

- descoberta + validação de configuração devem funcionar a partir de **metadados de manifesto/schema**
  sem executar código do Plugin
- o comportamento nativo em runtime vem do caminho `register(api)` do módulo do Plugin

Essa divisão permite ao OpenClaw validar configuração, explicar plugins ausentes/desabilitados e
construir dicas de UI/schema antes que o runtime completo esteja ativo.

### Plugins de canal e a ferramenta compartilhada de mensagem

Plugins de canal não precisam registrar uma ferramenta separada de enviar/editar/reagir para
ações normais de chat. O OpenClaw mantém uma única ferramenta compartilhada `message` no core, e
plugins de canal são proprietários da descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o core é proprietário do host da ferramenta compartilhada `message`, da integração com prompt, do
  controle de sessão/thread e do despacho de execução
- plugins de canal são proprietários da descoberta de ações com escopo, da descoberta de capacidades e de quaisquer fragmentos de schema específicos do canal
- plugins de canal são proprietários da gramática de conversa de sessão específica do provider, como
  ids de conversa codificando ids de thread ou herdando de conversas pai
- plugins de canal executam a ação final por meio de seu adaptador de ação

Para plugins de canal, a superfície do SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta
permite que um Plugin retorne, em conjunto, suas ações visíveis, capacidades e contribuições para schema
para que essas partes não se desencontrem.

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
ações de mensagem com base na conta ativa, sala/thread/mensagem atuais ou
identidade confiável do solicitante sem codificar branches específicos do canal na
ferramenta `message` do core.

É por isso que mudanças de roteamento do runner embutido ainda são trabalho de Plugin: o runner é
responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta do Plugin, para que a
ferramenta compartilhada `message` exponha a superfície correta, pertencente ao canal, para o turno atual.

Para helpers de execução pertencentes ao canal, plugins embutidos devem manter o runtime de execução
dentro de seus próprios módulos de extensão. O core não é mais proprietário dos runtimes de ação de mensagem de
Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`.
Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e plugins embutidos
devem importar seu próprio código local de runtime diretamente de seus
módulos pertencentes à extensão.

O mesmo limite se aplica, em geral, a seams do SDK nomeadas por provider: o core não
deve importar barrels de conveniência específicos de canal para Slack, Discord, Signal,
WhatsApp ou extensões similares. Se o core precisa de um comportamento, ou deve consumir o
próprio barrel `api.ts` / `runtime-api.ts` do Plugin embutido, ou promover a necessidade
para uma capacidade genérica e estreita no SDK compartilhado.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a linha de base compartilhada para canais que se encaixam no modelo comum
  de enquete
- `actions.handleAction("poll")` é o caminho preferido para semântica de enquete específica do canal
  ou parâmetros extras de enquete

Agora o core adia o parsing compartilhado de enquete até depois que o despacho de enquete do Plugin recusa
a ação, para que handlers de enquete pertencentes ao Plugin possam aceitar campos de enquete
específicos do canal sem serem bloqueados antes pelo parser genérico de enquete.

Consulte [Pipeline de carregamento](#load-pipeline) para a sequência completa de inicialização.

## Modelo de propriedade de capacidade

O OpenClaw trata um Plugin nativo como o limite de propriedade para uma **empresa** ou um
**recurso**, não como uma coleção desorganizada de integrações sem relação.

Isso significa:

- um Plugin de empresa normalmente deve ser proprietário de todas as superfícies voltadas ao OpenClaw
  dessa empresa
- um Plugin de recurso normalmente deve ser proprietário da superfície completa do recurso que ele introduz
- canais devem consumir capacidades compartilhadas do core em vez de reimplementar
  comportamento de provider de forma ad hoc

Exemplos:

- o Plugin embutido `openai` é proprietário do comportamento de provider de modelos da OpenAI e do comportamento da OpenAI para
  fala + voz em tempo real + entendimento de mídia + geração de imagem
- o Plugin embutido `elevenlabs` é proprietário do comportamento de fala da ElevenLabs
- o Plugin embutido `microsoft` é proprietário do comportamento de fala da Microsoft
- o Plugin embutido `google` é proprietário do comportamento de provider de modelos do Google, além do comportamento do Google para
  entendimento de mídia + geração de imagem + pesquisa na web
- o Plugin embutido `firecrawl` é proprietário do comportamento de busca na web do Firecrawl
- os Plugins embutidos `minimax`, `mistral`, `moonshot` e `zai` são proprietários de seus
  backends de entendimento de mídia
- o Plugin embutido `qwen` é proprietário do comportamento de provider de texto do Qwen, além do
  comportamento de entendimento de mídia e geração de vídeo
- o Plugin `voice-call` é um Plugin de recurso: ele é proprietário de transporte de chamadas, ferramentas,
  CLI, rotas e ponte de media-stream do Twilio, mas consome capacidades compartilhadas de fala,
  transcrição em tempo real e voz em tempo real em vez de importar plugins de fornecedor diretamente

O estado final pretendido é:

- A OpenAI fica em um único Plugin mesmo que abranja modelos de texto, fala, imagens e
  vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual Plugin de fornecedor é proprietário do provider; eles consomem o
  contrato de capacidade compartilhada exposto pelo core

Esta é a distinção principal:

- **plugin** = limite de propriedade
- **capability** = contrato do core que múltiplos plugins podem implementar ou consumir

Portanto, se o OpenClaw adicionar um novo domínio, como vídeo, a primeira pergunta não é
“qual provider deve codificar o tratamento de vídeo?” A primeira pergunta é “qual é
o contrato de capacidade de vídeo do core?” Assim que esse contrato existir, plugins de fornecedor
podem se registrar nele e plugins de canal/recurso podem consumi-lo.

Se a capacidade ainda não existir, a ação correta normalmente é:

1. definir a capacidade ausente no core
2. expô-la por meio da API/runtime de Plugin de forma tipada
3. conectar canais/recursos a essa capacidade
4. permitir que plugins de fornecedor registrem implementações

Isso mantém a propriedade explícita, ao mesmo tempo que evita comportamento no core que dependa de um
único fornecedor ou de um caminho de código específico de Plugin.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código deve ficar:

- **camada de capacidade do core**: orquestração compartilhada, política, fallback, regras
  de merge de configuração, semântica de entrega e contratos tipados
- **camada de Plugin de fornecedor**: APIs específicas do fornecedor, autenticação, catálogos de modelos, síntese
  de fala, geração de imagens, backends futuros de vídeo, endpoints de uso
- **camada de Plugin de canal/recurso**: integração com Slack/Discord/voice-call/etc.
  que consome capacidades do core e as apresenta em uma superfície

Por exemplo, TTS segue este formato:

- o core é proprietário da política de TTS em tempo de resposta, da ordem de fallback, das preferências e da entrega por canal
- `openai`, `elevenlabs` e `microsoft` são proprietários das implementações de síntese
- `voice-call` consome o helper de runtime de TTS para telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de Plugin de empresa com múltiplas capacidades

Um Plugin de empresa deve parecer coeso visto de fora. Se o OpenClaw tiver contratos compartilhados
para modelos, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia,
geração de imagem, geração de vídeo, busca na web e pesquisa na web,
um fornecedor pode ser proprietário de todas as suas superfícies em um só lugar:

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

O importante não é o nome exato dos helpers. O formato é o que importa:

- um Plugin é proprietário da superfície do fornecedor
- o core continua sendo proprietário dos contratos de capacidade
- canais e plugins de recurso consomem helpers `api.runtime.*`, não código do fornecedor
- testes de contrato podem verificar se o Plugin registrou as capacidades que
  afirma possuir

### Exemplo de capacidade: entendimento de vídeo

O OpenClaw já trata entendimento de imagem/áudio/vídeo como uma única
capacidade compartilhada. O mesmo modelo de propriedade se aplica aqui:

1. o core define o contrato de entendimento de mídia
2. plugins de fornecedor registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. canais e plugins de recurso consomem o comportamento compartilhado do core em vez de
   se conectar diretamente ao código do fornecedor

Isso evita incorporar no core as suposições de vídeo de um provider. O Plugin é proprietário
da superfície do fornecedor; o core é proprietário do contrato de capacidade e do comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o core é proprietário do
contrato tipado de capacidade e do helper de runtime, e plugins de fornecedor registram
implementações `api.registerVideoGenerationProvider(...)` nele.

Precisa de uma checklist concreta de rollout? Consulte
[Livro de receitas de capacidade](/pt-BR/plugins/architecture).

## Contratos e aplicação

A superfície da API de Plugin é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e
os helpers de runtime nos quais um Plugin pode confiar.

Por que isso importa:

- autores de plugins têm um padrão interno estável
- o core pode rejeitar propriedade duplicada, como dois plugins registrando o mesmo
  id de provider
- a inicialização pode expor diagnósticos acionáveis para registros malformados
- testes de contrato podem aplicar a propriedade de plugins embutidos e evitar desvios silenciosos

Há duas camadas de aplicação:

1. **aplicação de registro em runtime**
   O registro de plugins valida registros à medida que os plugins são carregados. Exemplos:
   ids de provider duplicados, ids de provider de fala duplicados e registros
   malformados produzem diagnósticos de Plugin em vez de comportamento indefinido.
2. **testes de contrato**
   Plugins embutidos são capturados em registros de contrato durante execuções de teste para que o
   OpenClaw possa verificar a propriedade explicitamente. Hoje isso é usado para
   providers de modelo, providers de fala, providers de pesquisa na web e propriedade
   de registro embutido.

O efeito prático é que o OpenClaw sabe, de antemão, qual Plugin é proprietário de qual
superfície. Isso permite que o core e os canais componham sem atrito, porque a propriedade é
declarada, tipada e testável, em vez de implícita.

### O que pertence a um contrato

Bons contratos de Plugin são:

- tipados
- pequenos
- específicos de capacidade
- pertencentes ao core
- reutilizáveis por múltiplos plugins
- consumíveis por canais/recursos sem conhecimento do fornecedor

Contratos ruins de Plugin são:

- política específica de fornecedor escondida no core
- rotas de escape pontuais de Plugin que ignoram o registro
- código de canal acessando diretamente uma implementação de fornecedor
- objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` nem de
  `api.runtime`

Em caso de dúvida, eleve o nível de abstração: defina primeiro a capacidade, depois
permita que os plugins se conectem a ela.

## Modelo de execução

Plugins nativos do OpenClaw executam **em processo** com o Gateway. Eles não
são isolados em sandbox. Um Plugin nativo carregado tem o mesmo limite de confiança em nível de processo que
o código do core.

Implicações:

- um Plugin nativo pode registrar ferramentas, handlers de rede, hooks e serviços
- um bug em um Plugin nativo pode derrubar ou desestabilizar o gateway
- um Plugin nativo malicioso equivale a execução arbitrária de código dentro
  do processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente
Skills embutidas.

Use allowlists e caminhos explícitos de instalação/carregamento para plugins não embutidos. Trate
plugins de workspace como código de desenvolvimento, não como padrões de produção.

Para nomes de pacote de workspace embutido, mantenha o id do Plugin ancorado no
nome npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` quando
o pacote expõe intencionalmente uma função de Plugin mais restrita.

Observação importante de confiança:

- `plugins.allow` confia em **ids de Plugin**, não na proveniência da origem.
- Um Plugin de workspace com o mesmo id de um Plugin embutido intencionalmente substitui
  a cópia embutida quando esse Plugin de workspace está habilitado/em allowlist.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.

## Limite de exportação

O OpenClaw exporta capacidades, não conveniências de implementação.

Mantenha o registro de capacidades público. Reduza exports de helpers fora de contrato:

- subcaminhos de helper específicos de Plugin embutido
- subcaminhos de infraestrutura de runtime não destinados a API pública
- helpers de conveniência específicos de fornecedor
- helpers de configuração/onboarding que são detalhes de implementação

Alguns subcaminhos de helper de Plugin embutido ainda permanecem no mapa de exportação
gerado do SDK por compatibilidade e manutenção de plugins embutidos. Exemplos atuais incluem
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e vários seams `plugin-sdk/matrix*`. Trate-os como
exports reservados de detalhe de implementação, não como o padrão de SDK recomendado para
novos plugins de terceiros.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes de Plugins candidatas
2. lê manifestos nativos ou de bundle compatível e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a habilitação para cada candidato
6. carrega módulos nativos habilitados via jiti
7. chama hooks nativos `register(api)` (ou `activate(api)` — um alias legado) e coleta registros no registro de plugins
8. expõe o registro para comandos/superfícies de runtime

<Note>
`activate` é um alias legado para `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins embutidos usam `register`; prefira `register` para novos plugins.
</Note>

As portas de segurança ocorrem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do Plugin, o caminho tem permissão de escrita global ou a
propriedade do caminho parece suspeita para plugins não embutidos.

### Comportamento orientado a manifesto

O manifesto é a fonte de verdade do plano de controle. O OpenClaw o usa para:

- identificar o Plugin
- descobrir canais/Skills/schema de configuração declarados ou capacidades do bundle
- validar `plugins.entries.<id>.config`
- complementar rótulos/placeholders da Control UI
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do Plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
o comportamento real, como hooks, ferramentas, comandos ou fluxos de provider.

Blocos opcionais `activation` e `setup` do manifesto permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de setup;
não substituem registro em runtime, `register(...)` ou `setupEntry`.
Os primeiros consumidores de ativação ao vivo agora usam dicas de comando, canal e provider do manifesto
para restringir o carregamento de plugins antes de uma materialização mais ampla do registro:

- o carregamento da CLI se restringe aos plugins que são proprietários do comando primário solicitado
- a resolução de setup/canal de Plugin se restringe aos plugins que são proprietários do
  id de canal solicitado
- a resolução explícita de setup/runtime de provider se restringe aos plugins que são proprietários do
  id de provider solicitado

A descoberta de setup agora prefere ids pertencentes ao descritor, como `setup.providers` e
`setup.cliBackends`, para restringir plugins candidatos antes de recorrer a
`setup-api` para plugins que ainda precisam de hooks de runtime em tempo de setup. Se mais de
um Plugin descoberto reivindicar o mesmo id normalizado de provider de setup ou backend de CLI,
a busca de setup recusa o proprietário ambíguo em vez de depender da ordem de descoberta.

### O que o carregador armazena em cache

O OpenClaw mantém caches curtos em processo para:

- resultados de descoberta
- dados do registro de manifesto
- registros de plugins carregados

Esses caches reduzem sobrecarga de inicialização em rajadas e repetição de comandos. É seguro
pensar neles como caches de desempenho de curta duração, não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desativar esses caches.
- Ajuste as janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não alteram diretamente globais aleatórias do core. Eles se registram em um
registro central de plugins.

O registro rastreia:

- registros de Plugin (identidade, origem, procedência, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- providers
- handlers de RPC do Gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos pertencentes ao Plugin

Recursos do core então leem desse registro em vez de falar diretamente com módulos de Plugin.
Isso mantém o carregamento unidirecional:

- módulo do Plugin -> registro no registro
- runtime do core -> consumo do registro

Essa separação importa para a manutenção. Isso significa que a maioria das superfícies do core só
precisa de um ponto de integração: “ler o registro”, não “criar caso especial para cada módulo de Plugin”.

## Callbacks de vinculação de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma solicitação de vínculo for aprovada ou negada:

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
- `request`: o resumo da solicitação original, dica de desanexação, id do remetente e
  metadados da conversa

Esse callback é apenas de notificação. Ele não altera quem tem permissão para vincular uma
conversa, e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provider

Plugins de provider agora têm duas camadas:

- metadados de manifesto: `providerAuthEnvVars` para busca barata de autenticação de provider via env
  antes do carregamento do runtime, `providerAuthAliases` para variantes de provider que compartilham
  autenticação, `channelEnvVars` para busca barata de env/setup de canal antes do carregamento do runtime,
  além de `providerAuthChoices` para rótulos baratos de onboarding/escolha de autenticação e
  metadados de flags de CLI antes do carregamento do runtime
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

O OpenClaw continua sendo proprietário do loop genérico do agente, failover, tratamento de transcrição e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de provider sem
precisar de um transporte de inferência totalmente personalizado.

Use o manifesto `providerAuthEnvVars` quando o provider tiver credenciais baseadas em env
que caminhos genéricos de autenticação/status/seletor de modelo devam enxergar sem carregar o runtime do Plugin.
Use o manifesto `providerAuthAliases` quando um id de provider deve reutilizar
as variáveis de ambiente, perfis de autenticação, autenticação baseada em config e escolha de onboarding de chave de API
de outro id de provider. Use o manifesto `providerAuthChoices` quando superfícies de CLI
de onboarding/escolha de autenticação devem conhecer o id de escolha do provider, rótulos de grupo e integração simples
de autenticação com uma única flag sem carregar o runtime do provider. Mantenha `envVars` do runtime do provider
para dicas voltadas ao operador, como rótulos de onboarding ou variáveis de configuração de
client-id/client-secret de OAuth.

Use o manifesto `channelEnvVars` quando um canal tiver autenticação ou setup orientados por env que
fallback genérico de env do shell, verificações de config/status ou prompts de setup devam enxergar
sem carregar o runtime do canal.

### Ordem e uso dos hooks

Para plugins de modelo/provider, o OpenClaw chama hooks aproximadamente nesta ordem.
A coluna “Quando usar” é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `catalog`                         | Publica a configuração do provider em `models.providers` durante a geração de `models.json`                   | O provider é proprietário de um catálogo ou de padrões de URL base                                                                        |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração pertencentes ao provider durante a materialização da configuração      | Os padrões dependem do modo de autenticação, env ou da semântica da família de modelos do provider                                       |
| --  | _(busca de modelo embutida)_      | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                | _(não é um hook de Plugin)_                                                                                                               |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de preview de id de modelo antes da busca                                        | O provider é proprietário da limpeza de aliases antes da resolução canônica do modelo                                                     |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provider antes da montagem genérica do modelo                       | O provider é proprietário da limpeza de transporte para ids de provider personalizados na mesma família de transporte                     |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução em runtime/do provider                                   | O provider precisa de limpeza de configuração que deve ficar com o Plugin; helpers embutidos da família Google também dão suporte a entradas compatíveis de configuração do Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo a providers de configuração                   | O provider precisa de correções de metadados de uso nativo de streaming orientadas por endpoint                                          |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de env para providers de configuração antes do carregamento da autenticação em runtime | O provider tem resolução de chave de API por marcador de env pertencente ao provider; `amazon-bedrock` também tem aqui um resolvedor embutido de marcador de env da AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/self-hosted ou baseada em configuração sem persistir texto simples                   | O provider pode operar com um marcador de credencial sintético/local                                                                      |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis de autenticação externos pertencentes ao provider; o `persistence` padrão é `runtime-only` para credenciais pertencentes à CLI/app | O provider reutiliza credenciais de autenticação externas sem persistir tokens de refresh copiados                                       |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders armazenados de perfil sintético atrás de autenticação baseada em env/config             | O provider armazena perfis sintéticos placeholder que não devem ter precedência                                                           |
| 11  | `resolveDynamicModel`             | Fallback síncrono para ids de modelo pertencentes ao provider que ainda não estão no registro local          | O provider aceita ids arbitrários de modelos upstream                                                                                     |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono; depois `resolveDynamicModel` é executado novamente                                    | O provider precisa de metadados de rede antes de resolver ids desconhecidos                                                               |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o runner embutido usar o modelo resolvido                                            | O provider precisa de reescritas de transporte, mas ainda usa um transporte do core                                                      |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos do fornecedor por trás de outro transporte compatível         | O provider reconhece seus próprios modelos em transportes proxy sem assumir o controle do provider                                       |
| 15  | `capabilities`                    | Metadados de transcrição/ferramentas pertencentes ao provider usados pela lógica compartilhada do core        | O provider precisa de particularidades de transcrição/família de provider                                                                 |
| 16  | `normalizeToolSchemas`            | Normaliza schemas de ferramentas antes que o runner embutido os veja                                          | O provider precisa de limpeza de schema para a família de transporte                                                                      |
| 17  | `inspectToolSchemas`              | Expõe diagnósticos de schema pertencentes ao provider após a normalização                                     | O provider quer avisos de palavra-chave sem ensinar regras específicas de provider ao core                                                |
| 18  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo versus marcado                                               | O provider precisa de saída final/raciocínio marcada em vez de campos nativos                                                            |
| 19  | `prepareExtraParams`              | Normalização de parâmetros de solicitação antes dos wrappers genéricos de opção de stream                    | O provider precisa de parâmetros padrão de solicitação ou limpeza de parâmetros por provider                                             |
| 20  | `createStreamFn`                  | Substitui completamente o caminho normal de stream por um transporte personalizado                            | O provider precisa de um protocolo wire personalizado, não apenas de um wrapper                                                          |
| 21  | `wrapStreamFn`                    | Wrapper de stream depois que wrappers genéricos são aplicados                                                 | O provider precisa de wrappers de compatibilidade para headers/corpo/modelo da solicitação sem um transporte personalizado                |
| 22  | `resolveTransportTurnState`       | Anexa headers ou metadados nativos por turno de transporte                                                    | O provider quer que transportes genéricos enviem identidade de turno nativa do provider                                                  |
| 23  | `resolveWebSocketSessionPolicy`   | Anexa headers nativos de WebSocket ou política de resfriamento de sessão                                      | O provider quer que transportes WS genéricos ajustem headers de sessão ou política de fallback                                           |
| 24  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado se torna a string `apiKey` de runtime              | O provider armazena metadados extras de autenticação e precisa de um formato de token de runtime personalizado                           |
| 25  | `refreshOAuth`                    | Substituição de refresh OAuth para endpoints de refresh personalizados ou política de falha no refresh        | O provider não se encaixa nos refreshers compartilhados `pi-ai`                                                                           |
| 26  | `buildAuthDoctorHint`             | Dica de reparo anexada quando o refresh OAuth falha                                                           | O provider precisa de orientação de reparo de autenticação pertencente ao provider após falha no refresh                                 |
| 27  | `matchesContextOverflowError`     | Correspondência de overflow de janela de contexto pertencente ao provider                                     | O provider tem erros brutos de overflow que as heurísticas genéricas não detectariam                                                     |
| 28  | `classifyFailoverReason`          | Classificação de motivo de failover pertencente ao provider                                                   | O provider pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                                |
| 29  | `isCacheTtlEligible`              | Política de cache de prompt para providers de proxy/backhaul                                                  | O provider precisa de gating de TTL de cache específico de proxy                                                                          |
| 30  | `buildMissingAuthMessage`         | Substituição para a mensagem genérica de recuperação de autenticação ausente                                  | O provider precisa de uma dica de recuperação de autenticação ausente específica do provider                                             |
| 31  | `suppressBuiltInModel`            | Supressão de modelo upstream obsoleto mais dica opcional de erro voltada ao usuário                           | O provider precisa ocultar linhas upstream obsoletas ou substituí-las por uma dica do fornecedor                                         |
| 32  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                               | O provider precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                           |
| 33  | `isBinaryThinking`                | Alternância de raciocínio ligado/desligado para providers com thinking binário                                | O provider expõe apenas thinking binário ligado/desligado                                                                                 |
| 34  | `supportsXHighThinking`           | Suporte a raciocínio `xhigh` para modelos selecionados                                                        | O provider quer `xhigh` apenas em um subconjunto de modelos                                                                               |
| 35  | `resolveDefaultThinkingLevel`     | Nível padrão de `/think` para uma família de modelos específica                                               | O provider é proprietário da política padrão de `/think` para uma família de modelos                                                     |
| 36  | `isModernModelRef`                | Correspondência de modelo moderno para filtros de perfil ao vivo e seleção de smoke                           | O provider é proprietário da correspondência de modelo preferido para ao vivo/smoke                                                      |
| 37  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime logo antes da inferência                    | O provider precisa de uma troca de token ou de uma credencial de solicitação de curta duração                                            |
| 38  | `resolveUsageAuth`                | Resolve credenciais de uso/faturamento para `/usage` e superfícies de status relacionadas                     | O provider precisa de parsing personalizado de token de uso/cota ou de uma credencial de uso diferente                                    |
| 39  | `fetchUsageSnapshot`              | Busca e normaliza snapshots de uso/cota específicos do provider depois que a autenticação é resolvida         | O provider precisa de um endpoint de uso específico do provider ou de um parser de payload                                                |
| 40  | `createEmbeddingProvider`         | Constrói um adaptador de embeddings pertencente ao provider para memória/pesquisa                             | O comportamento de embeddings de memória pertence ao Plugin do provider                                                                    |
| 41  | `buildReplayPolicy`               | Retorna uma política de replay que controla o tratamento da transcrição para o provider                       | O provider precisa de uma política de transcrição personalizada (por exemplo, remoção de blocos de thinking)                              |
| 42  | `sanitizeReplayHistory`           | Reescreve o histórico de replay após a limpeza genérica da transcrição                                        | O provider precisa de reescritas de replay específicas do provider além dos helpers compartilhados de Compaction                          |
| 43  | `validateReplayTurns`             | Validação ou remodelagem final dos turnos de replay antes do runner embutido                                  | O transporte do provider precisa de validação mais rígida dos turnos após a sanitização genérica                                          |
| 44  | `onModelSelected`                 | Executa efeitos colaterais pós-seleção pertencentes ao provider                                               | O provider precisa de telemetria ou estado pertencente ao provider quando um modelo se torna ativo                                        |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
Plugin de provider correspondente e depois percorrem outros plugins de provider capazes de usar hooks
até que um deles realmente altere o id do modelo ou o transporte/configuração. Isso mantém
funcionando os shims de alias/provider compatível sem exigir que o chamador saiba qual
Plugin embutido é proprietário da reescrita. Se nenhum hook de provider reescrever uma entrada
compatível de configuração da família Google, o normalizador de configuração embutido do Google ainda aplica
essa limpeza de compatibilidade.

Se o provider precisar de um protocolo wire totalmente personalizado ou de um executor de solicitação personalizado,
isso é uma classe diferente de extensão. Esses hooks são para comportamento de provider que
ainda é executado no loop normal de inferência do OpenClaw.

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

### Exemplos embutidos

- O Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  e `wrapStreamFn` porque é proprietário da compatibilidade futura do Claude 4.6,
  de dicas da família do provider, de orientação para reparo de autenticação,
  da integração com endpoint de uso, da elegibilidade de cache de prompt, de padrões de configuração sensíveis à autenticação, da política
  padrão/adaptativa de thinking do Claude e do modelamento de stream específico do Anthropic para
  headers beta, `/fast` / `serviceTier` e `context1m`.
- Os helpers de stream específicos de Claude do Anthropic permanecem, por enquanto, no
  próprio seam público `api.ts` / `contract-api.ts` do Plugin embutido. Essa superfície do pacote
  exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e os builders de wrapper
  de baixo nível do Anthropic, em vez de ampliar o SDK genérico em torno das regras de
  header beta de um único provider.
- A OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities`, além de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  porque é proprietária da compatibilidade futura do GPT-5.4, da normalização direta da OpenAI
  `openai-completions` -> `openai-responses`, de dicas de autenticação compatíveis com Codex,
  da supressão do Spark, de linhas sintéticas de lista da OpenAI e da política de thinking/modelo ao vivo do GPT-5; a família de stream `openai-responses-defaults` é proprietária dos
  wrappers nativos compartilhados do OpenAI Responses para headers de atribuição,
  `/fast`/`serviceTier`, verbosidade de texto, pesquisa na web nativa do Codex,
  modelagem de payload compatível com raciocínio e gerenciamento de contexto do Responses.
- O OpenRouter usa `catalog`, além de `resolveDynamicModel` e
  `prepareDynamicModel`, porque o provider é pass-through e pode expor novos
  ids de modelo antes de o catálogo estático do OpenClaw ser atualizado; ele também usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para manter
  headers de solicitação específicos do provider, metadados de roteamento, patches de raciocínio e
  política de cache de prompt fora do core. Sua política de replay vem da
  família `passthrough-gemini`, enquanto a família de stream `openrouter-thinking`
  é proprietária da injeção de raciocínio de proxy e dos skips de modelo não compatível / `auto`.
- O GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities`, além de `prepareRuntimeAuth` e `fetchUsageSnapshot`, porque
  precisa de login por dispositivo pertencente ao provider, comportamento de fallback de modelo, particularidades de transcrição do Claude,
  troca de token GitHub -> token Copilot e um endpoint de uso pertencente ao provider.
- O OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog`, além de
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot`, porque
  ainda é executado em transportes OpenAI do core, mas é proprietário da
  normalização de seu transporte/URL base, da política de fallback de refresh OAuth, da escolha de transporte padrão,
  de linhas sintéticas de catálogo do Codex e da integração com endpoint de uso do ChatGPT; ele
  compartilha a mesma família de stream `openai-responses-defaults` da OpenAI direta.
- O Google AI Studio e o OAuth do Gemini CLI usam `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque a
  família de replay `google-gemini` é proprietária do fallback de compatibilidade futura do Gemini 3.1,
  da validação nativa de replay do Gemini, da sanitização de replay de bootstrap, do modo
  de saída de raciocínio marcado e da correspondência de modelo moderno, enquanto a
  família de stream `google-thinking` é proprietária da normalização do payload de thinking do Gemini;
  o OAuth do Gemini CLI também usa `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` para formatação de token, parsing de token e integração com endpoint
  de cota.
- O Anthropic Vertex usa `buildReplayPolicy` por meio da
  família de replay `anthropic-by-model`, de forma que a limpeza de replay específica do Claude permaneça
  limitada a ids de Claude, em vez de a todo transporte `anthropic-messages`.
- O Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel` porque é proprietário
  da classificação de erros específicos do Bedrock para throttle/not-ready/context-overflow
  em tráfego Anthropic-on-Bedrock; sua política de replay ainda compartilha a mesma
  proteção exclusiva de Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode e Opencode Go usam `buildReplayPolicy`
  por meio da família de replay `passthrough-gemini`, porque fazem proxy de modelos Gemini
  por transportes compatíveis com OpenAI e precisam de sanitização de
  thought-signature do Gemini sem validação nativa de replay do Gemini nem
  reescritas de bootstrap.
- O MiniMax usa `buildReplayPolicy` por meio da
  família de replay `hybrid-anthropic-openai` porque um provider é proprietário tanto de semântica
  Anthropic-message quanto de semântica compatível com OpenAI; ele mantém a remoção de
  blocos de thinking exclusivos de Claude no lado Anthropic, ao mesmo tempo que substitui o modo de
  saída de raciocínio de volta para nativo, e a família de stream `minimax-fast-mode` é proprietária das
  reescritas de modelo de modo rápido no caminho de stream compartilhado.
- O Moonshot usa `catalog`, além de `wrapStreamFn`, porque ainda usa o transporte
  OpenAI compartilhado, mas precisa de normalização de payload de thinking pertencente ao provider; a
  família de stream `moonshot-thinking` mapeia configuração mais estado de `/think` para seu
  payload nativo de thinking binário.
- O Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque precisa de headers de solicitação pertencentes ao provider,
  normalização de payload de raciocínio, dicas de transcrição do Gemini e gating de TTL de cache do Anthropic; a família de stream `kilocode-thinking` mantém a injeção de thinking do Kilo
  no caminho de stream proxy compartilhado, ao mesmo tempo que pula `kilo/auto` e
  outros ids de modelo proxy que não oferecem suporte a payloads explícitos de raciocínio.
- O Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` porque é proprietário do fallback do GLM-5,
  dos padrões de `tool_stream`, da UX de thinking binário, da correspondência de modelo moderno e de
  autenticação de uso + busca de cota; a família de stream `tool-stream-default-on` mantém o wrapper de `tool_stream`
  ativado por padrão fora de glue manuscrito por provider.
- O xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque é proprietário da normalização do transporte nativo xAI Responses, das reescritas de alias de
  modo rápido do Grok, de `tool_stream` por padrão, da limpeza rigorosa de ferramenta / payload
  de raciocínio, da reutilização de autenticação fallback para ferramentas pertencentes ao Plugin, da resolução de modelo Grok com compatibilidade futura
  e de patches de compatibilidade pertencentes ao provider, como perfil de schema de ferramenta do xAI,
  palavras-chave de schema não compatíveis, `web_search` nativo e decodificação
  de argumentos de chamada de ferramenta com entidade HTML.
- Mistral, OpenCode Zen e OpenCode Go usam apenas `capabilities` para manter
  particularidades de transcrição/ferramentas fora do core.
- Providers embutidos somente de catálogo, como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine`, usam
  apenas `catalog`.
- O Qwen usa `catalog` para seu provider de texto, além de registros compartilhados de entendimento de mídia e
  geração de vídeo para suas superfícies multimodais.
- MiniMax e Xiaomi usam `catalog`, além de hooks de uso, porque seu comportamento de `/usage`
  pertence ao Plugin, embora a inferência ainda seja executada pelos transportes compartilhados.

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

- `textToSpeech` retorna o payload normal de saída de TTS do core para superfícies de arquivo/mensagem de voz.
- Usa a configuração `messages.tts` do core e a seleção de provider.
- Retorna buffer de áudio PCM + sample rate. Plugins devem fazer resample/encode para providers.
- `listVoices` é opcional por provider. Use-o para seletores de voz ou fluxos de setup pertencentes ao fornecedor.
- Listagens de voz podem incluir metadados mais ricos, como localidade, gênero e tags de personalidade para seletores sensíveis ao provider.
- OpenAI e ElevenLabs oferecem suporte a telefonia hoje. A Microsoft não.

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

- Mantenha a política de TTS, fallback e entrega de resposta no core.
- Use providers de fala para comportamento de síntese pertencente ao fornecedor.
- A entrada legada `edge` da Microsoft é normalizada para o id de provider `microsoft`.
- O modelo de propriedade preferido é orientado por empresa: um Plugin de fornecedor pode ser proprietário de
  texto, fala, imagem e providers de mídia futuros à medida que o OpenClaw adiciona esses
  contratos de capacidade.

Para entendimento de imagem/áudio/vídeo, plugins registram um provider tipado
de entendimento de mídia em vez de uma coleção genérica de chave/valor:

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

- Mantenha a orquestração, fallback, configuração e integração com canais no core.
- Mantenha o comportamento do fornecedor no Plugin de provider.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos
  opcionais de resultado, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core é proprietário do contrato de capacidade e do helper de runtime
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
- Usa a configuração de áudio de entendimento de mídia do core (`tools.media.audio`) e a ordem de fallback de provider.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não compatível).
- `api.runtime.stt.transcribeAudioFile(...)` continua como um alias de compatibilidade.

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
- O OpenClaw só aplica esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback pertencentes ao Plugin, operadores precisam optar explicitamente por `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de plugins não confiáveis continuam funcionando, mas solicitações de substituição são rejeitadas em vez de cair silenciosamente em fallback.

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

Plugins também podem registrar providers de pesquisa na web via
`api.registerWebSearchProvider(...)`.

Observações:

- Mantenha a seleção de provider, a resolução de credenciais e a semântica compartilhada de solicitação no core.
- Use providers de pesquisa na web para transportes de pesquisa específicos do fornecedor.
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

- `generate(...)`: gera uma imagem usando a cadeia configurada de provider de geração de imagem.
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
- `auth`: obrigatório. Use `"gateway"` para exigir a autenticação normal do gateway, ou `"plugin"` para autenticação/validação de Webhook gerenciada pelo Plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo Plugin substitua seu próprio registro de rota existente.
- `handler`: retorna `true` quando a rota tratou a solicitação.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento do Plugin. Use `api.registerHttpRoute(...)` em vez disso.
- Rotas de Plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um Plugin não pode substituir a rota de outro Plugin.
- Rotas sobrepostas com níveis diferentes de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de autenticação.
- Rotas `auth: "plugin"` **não** recebem automaticamente escopos de runtime do operador. Elas servem para Webhooks/validação de assinatura gerenciados pelo Plugin, não para chamadas privilegiadas a helpers do Gateway.
- Rotas `auth: "gateway"` executam dentro de um escopo de runtime de solicitação do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém os escopos de runtime da rota de Plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo, `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) só aplicam `x-openclaw-scopes` quando o header está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas solicitações de rota de Plugin com identidade, o escopo de runtime recai em `operator.write`
- Regra prática: não assuma que uma rota de Plugin com autenticação de gateway é implicitamente uma superfície de administrador. Se sua rota precisar de comportamento exclusivo de administrador, exija um modo de autenticação com identidade e documente o contrato explícito do header `x-openclaw-scopes`.

## Caminhos de importação do SDK de Plugin

Use subcaminhos do SDK em vez da importação monolítica `openclaw/plugin-sdk` ao
criar plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de Plugin.
- `openclaw/plugin-sdk/core` para o contrato genérico compartilhado voltado a plugins.
- `openclaw/plugin-sdk/config-schema` para a exportação do schema Zod raiz de `openclaw.json`
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
  `openclaw/plugin-sdk/webhook-ingress` para a integração compartilhada de
  setup/autenticação/resposta/Webhook. `channel-inbound` é a superfície compartilhada para debounce, correspondência de menções,
  helpers de política de menção de entrada, formatação de envelope de entrada
  e helpers de contexto de envelope de entrada.
  `channel-setup` é o seam estreito de setup com instalação opcional.
  `setup-runtime` é a superfície segura em runtime para setup usada por `setupEntry` /
  inicialização adiada, incluindo os adaptadores de patch de setup seguros para importação.
  `setup-adapter-runtime` é o seam de adaptador de setup de conta sensível a env.
  `setup-tools` é o seam pequeno de helpers para CLI/arquivo/docs (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Subcaminhos de domínio, como `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime` para helpers compartilhados de runtime/configuração.
  `telegram-command-config` é o seam público estreito para normalização/validação de comandos personalizados do Telegram e permanece disponível mesmo se a superfície do contrato embutido do Telegram estiver temporariamente indisponível.
  `text-runtime` é o seam compartilhado de texto/Markdown/logging, incluindo
  remoção de texto visível ao assistente, helpers de renderização/chunking de Markdown, helpers de redação,
  helpers de tag de diretiva e utilitários de texto seguro.
- Seams de canal específicos de aprovação devem preferir um único contrato `approvalCapability`
  no Plugin. O core então lê autenticação, entrega, renderização,
  roteamento nativo e comportamento lazy de handler nativo de aprovação por meio dessa única capacidade
  em vez de misturar comportamento de aprovação em campos não relacionados do Plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto e permanece apenas como um
  shim de compatibilidade para plugins mais antigos. Código novo deve importar as primitivas genéricas mais estreitas, e o código do repositório não deve adicionar novas importações do
  shim.
- Internos de extensões embutidas continuam privados. Plugins externos devem usar apenas subcaminhos `openclaw/plugin-sdk/*`. Código de core/teste do OpenClaw pode usar os pontos de entrada públicos do repositório sob a raiz de um pacote de Plugin, como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e arquivos de escopo estreito como
  `login-qr-api.js`. Nunca importe `src/*` de um pacote de Plugin a partir do core ou de outra extensão.
- Divisão do ponto de entrada do repositório:
  `<plugin-package-root>/api.js` é o barrel de helpers/tipos,
  `<plugin-package-root>/runtime-api.js` é o barrel apenas de runtime,
  `<plugin-package-root>/index.js` é a entrada do Plugin embutido,
  e `<plugin-package-root>/setup-entry.js` é a entrada do Plugin de setup.
- Exemplos atuais de providers embutidos:
  - O Anthropic usa `api.js` / `contract-api.js` para helpers de stream do Claude, como
    `wrapAnthropicProviderStream`, helpers de header beta e parsing de `service_tier`.
  - A OpenAI usa `api.js` para builders de provider, helpers de modelo padrão e
    builders de provider em tempo real.
  - O OpenRouter usa `api.js` para seu builder de provider, além de helpers de onboarding/configuração,
    enquanto `register.runtime.js` ainda pode reexportar helpers genéricos
    `plugin-sdk/provider-stream` para uso local do repositório.
- Pontos de entrada públicos carregados por facade preferem o snapshot de configuração de runtime ativo
  quando existir um, e então recorrem ao arquivo de configuração resolvido em disco quando
  o OpenClaw ainda não estiver servindo um snapshot de runtime.
- Primitivas genéricas compartilhadas continuam sendo o contrato público preferido do SDK. Um pequeno
  conjunto reservado de compatibilidade de seams de helpers de canal com marca embutida ainda
  existe. Trate-os como seams de manutenção/compatibilidade embutidas, não como novos alvos de importação de terceiros; novos contratos entre canais ainda devem ser implementados em subcaminhos genéricos `plugin-sdk/*` ou nos barrels locais do Plugin `api.js` /
  `runtime-api.js`.

Observação de compatibilidade:

- Evite o barrel raiz `openclaw/plugin-sdk` em código novo.
- Prefira primeiro as primitivas estáveis e estreitas. Os subcaminhos mais novos de setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool são o contrato pretendido para novo trabalho com
  plugins embutidos e externos.
  Parsing/correspondência de alvo pertencem a `openclaw/plugin-sdk/channel-targets`.
  Portas de ação de mensagem e helpers de id de mensagem de reação pertencem a
  `openclaw/plugin-sdk/channel-actions`.
- Barrels de helper específicos de extensões embutidas não são estáveis por padrão. Se um
  helper for necessário apenas para uma extensão embutida, mantenha-o atrás do seam local
  `api.js` ou `runtime-api.js` da extensão em vez de promovê-lo para
  `openclaw/plugin-sdk/<extension>`.
- Novos seams de helper compartilhados devem ser genéricos, não com marca de canal. O parsing compartilhado
  de alvo pertence a `openclaw/plugin-sdk/channel-targets`; internos específicos de canal
  ficam atrás do seam local `api.js` ou `runtime-api.js` do Plugin proprietário.
- Subcaminhos específicos de capacidade, como `image-generation`,
  `media-understanding` e `speech`, existem porque plugins nativos/embutidos os usam
  hoje. A presença deles, por si só, não significa que todo helper exportado seja um
  contrato externo congelado de longo prazo.

## Schemas da ferramenta de mensagem

Plugins devem ser proprietários das contribuições de schema específicas de canal em
`describeMessageTool(...)`. Mantenha campos específicos de provider no Plugin, não no core compartilhado.

Para fragmentos portáveis de schema compartilhado, reutilize os helpers genéricos exportados por
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` para payloads no estilo grade de botões
- `createMessageToolCardSchema()` para payloads estruturados de cartão

Se um formato de schema só fizer sentido para um provider, defina-o no
próprio código-fonte desse Plugin em vez de promovê-lo para o SDK compartilhado.

## Resolução de alvo de canal

Plugins de canal devem ser proprietários da semântica de alvo específica do canal. Mantenha o
host de saída compartilhado genérico e use a superfície do adaptador de mensagens para regras do provider:

- `messaging.inferTargetChatType({ to })` decide se um alvo normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca no diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve ir direto para resolução semelhante a id em vez de busca em diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do Plugin quando
  o core precisa de uma resolução final pertencente ao provider após a normalização ou após uma
  falha no diretório.
- `messaging.resolveOutboundSessionRoute(...)` é proprietário da construção de rota de sessão
  específica do provider quando um alvo é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes
  da busca de pares/grupos.
- Use `looksLikeId` para verificações do tipo “trate isto como um id de alvo explícito/nativo”.
- Use `resolveTarget` para fallback de normalização específico do provider, não para
  busca ampla em diretório.
- Mantenha ids nativos do provider, como ids de chat, ids de thread, JIDs, handles e
  ids de sala, dentro de valores `target` ou parâmetros específicos do provider, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório a partir da configuração devem manter essa lógica no
Plugin e reutilizar os helpers compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de pares/grupos baseados em configuração, como:

- pares de DM orientados por allowlist
- mapas configurados de canal/grupo
- fallbacks estáticos de diretório com escopo de conta

Os helpers compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consulta
- aplicação de limite
- helpers de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

Inspeção de conta específica de canal e normalização de id devem permanecer na
implementação do Plugin.

## Catálogos de provider

Plugins de provider podem definir catálogos de modelos para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provider
- `{ providers }` para múltiplas entradas de provider

Use `catalog` quando o Plugin for proprietário de ids de modelo específicos do provider, padrões de URL base
ou metadados de modelo condicionados à autenticação.

`catalog.order` controla quando o catálogo de um Plugin é mesclado em relação aos
providers implícitos embutidos do OpenClaw:

- `simple`: providers simples orientados por chave de API ou env
- `profile`: providers que aparecem quando perfis de autenticação existem
- `paired`: providers que sintetizam múltiplas entradas de provider relacionadas
- `late`: última etapa, depois de outros providers implícitos

Providers posteriores vencem em caso de colisão de chave, então plugins podem substituir
intencionalmente uma entrada de provider embutida com o mesmo id de provider.

Compatibilidade:

- `discovery` continua funcionando como alias legado
- se `catalog` e `discovery` estiverem registrados, o OpenClaw usa `catalog`

## Inspeção somente leitura de canal

Se o seu Plugin registrar um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que as credenciais
  estão totalmente materializadas e pode falhar rapidamente quando segredos obrigatórios estiverem ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de reparo de doctor/configuração
  não devem precisar materializar credenciais de runtime apenas para descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas o estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status de credencial quando relevantes, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para relatar disponibilidade somente leitura. Retornar `tokenStatus: "available"` (e o campo de origem correspondente) já é suficiente para comandos no estilo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura relatem “configurado, mas indisponível neste caminho de comando”
em vez de travar ou informar incorretamente que a conta não está configurada.

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

Cada entrada se torna um Plugin. Se o pack listar múltiplas extensões, o id do Plugin
passa a ser `name/<fileBase>`.

Se seu Plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Proteção de segurança: toda entrada em `openclaw.extensions` deve permanecer dentro do diretório do Plugin
após a resolução de symlink. Entradas que escapem do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências de Plugin com
`npm install --omit=dev --ignore-scripts` (sem scripts de ciclo de vida, sem dependências de desenvolvimento em runtime). Mantenha as árvores de dependência do Plugin em “JS/TS puro” e evite pacotes que exijam builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve somente de setup.
Quando o OpenClaw precisa de superfícies de setup para um Plugin de canal desabilitado, ou
quando um Plugin de canal está habilitado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do Plugin. Isso mantém inicialização e setup mais leves
quando a entrada principal do Plugin também conecta ferramentas, hooks ou outro
código apenas de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode colocar um Plugin de canal no mesmo caminho `setupEntry` durante a fase
de inicialização pré-listen do gateway, mesmo quando o canal já estiver configurado.

Use isso apenas quando `setupEntry` cobrir completamente a superfície de inicialização que precisa existir
antes de o gateway começar a escutar. Na prática, isso significa que a entrada de setup
deve registrar toda capacidade pertencente ao canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes de o gateway começar a escutar
- quaisquer métodos do gateway, ferramentas ou serviços que precisem existir nessa mesma janela

Se a entrada completa ainda for proprietária de alguma capacidade obrigatória de inicialização, não ative
essa flag. Mantenha o Plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais embutidos também podem publicar helpers de superfície de contrato somente de setup que o core
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual
de promoção de setup é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O core usa essa superfície quando precisa promover uma configuração legada de canal de conta única para
`channels.<id>.accounts.*` sem carregar a entrada completa do Plugin.
O Matrix é o exemplo embutido atual: ele move apenas chaves de autenticação/bootstrap para uma
conta nomeada promovida quando contas nomeadas já existem, e pode preservar uma
chave de conta padrão configurada não canônica em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de setup mantêm lazy a descoberta da superfície de contrato embutida. O tempo
de importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso em vez de
reentrar na inicialização do canal embutido na importação do módulo.

Quando essas superfícies de inicialização incluírem métodos RPC do Gateway, mantenha-os em um
prefixo específico do Plugin. Namespaces de administrador do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) continuam reservados e sempre resolvem
para `operator.admin`, mesmo que um Plugin solicite um escopo mais restrito.

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
dicas de instalação via `openclaw.install`. Isso mantém os dados do catálogo livres no core.

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
- `preferOver`: ids de Plugin/canal de menor prioridade que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de texto da superfície de seleção
- `markdownCapable`: marca o canal como compatível com Markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal de superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal de seletores interativos de setup/configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: coloca o canal no fluxo padrão `allowFrom` de início rápido
- `forceAccountBinding`: exige vínculo explícito de conta mesmo quando só existe uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca por sessão ao resolver alvos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canais** (por exemplo, uma
exportação de registro MPM). Solte um arquivo JSON em um destes caminhos:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto são proprietários da orquestração de contexto da sessão para ingestão, montagem
e Compaction. Registre-os a partir do seu Plugin com
`api.registerContextEngine(id, factory)` e então selecione o mecanismo ativo com
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

Se o seu mecanismo **não** for proprietário do algoritmo de Compaction, mantenha `compact()`
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

Quando um Plugin precisar de um comportamento que não se encaixa na API atual, não contorne
o sistema de Plugin com um acesso privado. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato do core
   Decida qual comportamento compartilhado o core deve possuir: política, fallback, merge de configuração,
   ciclo de vida, semântica voltada a canais e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de Plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada útil
   de capacidade.
3. conecte consumidores de core + canal/recurso
   Canais e plugins de recurso devem consumir a nova capacidade por meio do core,
   não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends nessa capacidade.
5. adicione cobertura de contrato
   Adicione testes para que a propriedade e o formato do registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar rigidamente codificado à
visão de mundo de um único provider. Consulte o [Livro de receitas de capacidade](/pt-BR/plugins/architecture)
para uma checklist concreta de arquivos e um exemplo completo.

### Checklist de capacidade

Quando você adiciona uma nova capacidade, a implementação normalmente deve tocar estas
superfícies em conjunto:

- tipos de contrato do core em `src/<capability>/types.ts`
- helper de runner/runtime do core em `src/<capability>/runtime.ts`
- superfície de registro da API de Plugin em `src/plugins/types.ts`
- integração com o registro de plugins em `src/plugins/registry.ts`
- exposição de runtime de Plugin em `src/plugins/runtime/*` quando plugins de recurso/canal
  precisarem consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação para operador/Plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso normalmente é um sinal de que a capacidade
ainda não está totalmente integrada.

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

- o core é proprietário do contrato de capacidade + orquestração
- plugins de fornecedor são proprietários das implementações do fornecedor
- plugins de recurso/canal consomem helpers de runtime
- testes de contrato mantêm a propriedade explícita
