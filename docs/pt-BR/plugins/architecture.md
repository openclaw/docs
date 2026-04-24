---
read_when:
    - Criar ou depurar plugins nativos do OpenClaw
    - Entender o modelo de recursos de Plugin ou os limites de propriedade
    - Trabalhar no pipeline de carregamento ou registro de Plugin
    - Implementar hooks de runtime de provider ou plugins de canal
sidebarTitle: Internals
summary: 'Internos de Plugin: modelo de recursos, propriedade, contratos, pipeline de carregamento e helpers de runtime'
title: Internos de Plugin
x-i18n:
    generated_at: "2026-04-24T06:02:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 344c02f9f0bb19780d262929e665fcaf8093ac08cda30b61af56857368b0b07a
    source_path: plugins/architecture.md
    workflow: 15
---

Esta é a **referência aprofundada de arquitetura** do sistema de Plugin do OpenClaw. Para
guias práticos, comece por uma das páginas focadas abaixo.

<CardGroup cols={2}>
  <Card title="Instalar e usar plugins" icon="plug" href="/pt-BR/tools/plugin">
    Guia do usuário final para adicionar, ativar e solucionar problemas de plugins.
  </Card>
  <Card title="Criar plugins" icon="rocket" href="/pt-BR/plugins/building-plugins">
    Tutorial do primeiro plugin com o menor manifesto funcional.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um plugin de canal de mensagens.
  </Card>
  <Card title="Plugins de provider" icon="microchip" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um plugin de provider de modelo.
  </Card>
  <Card title="Visão geral do SDK" icon="book" href="/pt-BR/plugins/sdk-overview">
    Mapa de importação e referência da API de registro.
  </Card>
</CardGroup>

## Modelo público de recursos

Recursos são o modelo público de **Plugin nativo** dentro do OpenClaw. Todo
Plugin nativo do OpenClaw se registra em um ou mais tipos de recurso:

| Recurso               | Método de registro                             | Plugins de exemplo                    |
| --------------------- | ---------------------------------------------- | ------------------------------------- |
| Inferência de texto   | `api.registerProvider(...)`                    | `openai`, `anthropic`                 |
| Backend CLI de inferência | `api.registerCliBackend(...)`              | `openai`, `anthropic`                 |
| Fala                  | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`             |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                         |
| Voz em tempo real     | `api.registerRealtimeVoiceProvider(...)`       | `openai`                              |
| Entendimento de mídia | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                    |
| Geração de imagem     | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax`  |
| Geração de música     | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                   |
| Geração de vídeo      | `api.registerVideoGenerationProvider(...)`     | `qwen`                                |
| Busca web             | `api.registerWebFetchProvider(...)`            | `firecrawl`                           |
| Pesquisa na web       | `api.registerWebSearchProvider(...)`           | `google`                              |
| Canal / mensagens     | `api.registerChannel(...)`                     | `msteams`, `matrix`                   |

Um Plugin que registra zero recursos, mas fornece hooks, ferramentas ou
serviços é um **Plugin legado somente com hooks**. Esse padrão continua totalmente compatível.

### Postura de compatibilidade externa

O modelo de recursos já está no core e é usado hoje por plugins empacotados/nativos, mas a compatibilidade de plugins externos ainda precisa de um critério mais rígido do que “está exportado, logo está congelado”.

| Situação do Plugin                                | Orientação                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                       | Mantenha integrações baseadas em hooks funcionando; essa é a linha de base de compatibilidade.  |
| Novos plugins empacotados/nativos                 | Prefira registro explícito de recursos em vez de atalhos específicos de fornecedor ou novos designs somente com hooks. |
| Plugins externos adotando registro de recursos    | Permitido, mas trate superfícies helper específicas de recurso como evolutivas, a menos que a documentação as marque como estáveis. |

O registro de recursos é a direção pretendida. Hooks legados continuam sendo o caminho mais seguro sem quebra para plugins externos durante a transição. Nem todos os subcaminhos de helpers exportados são iguais — prefira contratos estreitos documentados em vez de exports auxiliares incidentais.

### Formatos de Plugin

O OpenClaw classifica cada Plugin carregado em um formato com base no seu comportamento real
de registro (não apenas em metadados estáticos):

- **plain-capability**: registra exatamente um tipo de recurso (por exemplo, um
  plugin somente de provider como `mistral`).
- **hybrid-capability**: registra vários tipos de recurso (por exemplo,
  `openai` controla inferência de texto, fala, entendimento de mídia e geração
  de imagem).
- **hook-only**: registra apenas hooks (tipados ou personalizados), sem recursos,
  ferramentas, comandos ou serviços.
- **non-capability**: registra ferramentas, comandos, serviços ou rotas, mas sem
  recursos.

Use `openclaw plugins inspect <id>` para ver o formato e o detalhamento de recursos de um Plugin. Consulte [referência da CLI](/pt-BR/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como caminho de compatibilidade para
plugins somente com hooks. Plugins legados reais ainda dependem dele.

Direção:

- mantê-lo funcionando
- documentá-lo como legado
- preferir `before_model_resolve` para trabalho de substituição de modelo/provider
- preferir `before_prompt_build` para mutação de prompt
- remover apenas depois que o uso real cair e a cobertura de fixtures provar segurança de migração

### Sinais de compatibilidade

Quando você executa `openclaw doctor` ou `openclaw plugins inspect <id>`, pode ver
um destes rótulos:

| Sinal                     | Significado                                                 |
| ------------------------- | ----------------------------------------------------------- |
| **config valid**          | A configuração é analisada corretamente e os plugins resolvem |
| **compatibility advisory**| O Plugin usa um padrão compatível, mas mais antigo (ex.: `hook-only`) |
| **legacy warning**        | O Plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**            | A configuração é inválida ou o Plugin falhou ao carregar    |

Nem `hook-only` nem `before_agent_start` quebrarão seu Plugin hoje:
`hook-only` é apenas um aviso, e `before_agent_start` gera apenas um warning. Esses
sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de Plugin do OpenClaw tem quatro camadas:

1. **Manifesto + descoberta**
   O OpenClaw encontra plugins candidatos em caminhos configurados, raízes do workspace,
   raízes globais de plugins e plugins empacotados. A descoberta lê primeiro
   manifestos nativos `openclaw.plugin.json` mais manifestos de bundles compatíveis.
2. **Ativação + validação**
   O core decide se um Plugin descoberto está ativado, desativado, bloqueado ou
   selecionado para um slot exclusivo, como memória.
3. **Carregamento em runtime**
   Plugins nativos do OpenClaw são carregados no processo via jiti e registram
   recursos em um registro central. Bundles compatíveis são normalizados em
   registros do registro sem importar código de runtime.
4. **Consumo da superfície**
   O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração de provider,
   hooks, rotas HTTP, comandos CLI e serviços.

Especificamente para a CLI de plugins, a descoberta do comando raiz é dividida em duas fases:

- metadados em tempo de parse vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real de CLI do Plugin pode permanecer lazy e se registrar na primeira invocação

Isso mantém o código da CLI do Plugin dentro do próprio Plugin, enquanto ainda permite ao OpenClaw
reservar nomes de comandos raiz antes do parse.

O limite importante de design:

- descoberta + validação de configuração devem funcionar a partir de **metadados de manifesto/schema**
  sem executar código do Plugin
- o comportamento nativo em runtime vem do caminho `register(api)` do módulo do Plugin

Essa separação permite ao OpenClaw validar configuração, explicar plugins ausentes/desativados e
criar dicas de UI/schema antes que o runtime completo esteja ativo.

### Planejamento de ativação

O planejamento de ativação faz parte do plano de controle. Chamadores podem perguntar quais plugins
são relevantes para um comando, provider, canal, rota, harness de agente ou
recurso específico antes de carregar registros mais amplos de runtime.

O planejador mantém o comportamento atual de manifesto compatível:

- campos `activation.*` são dicas explícitas para o planejador
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` e hooks continuam sendo fallback de propriedade do manifesto
- a API de planejador somente com ids continua disponível para chamadores existentes
- a API de plano relata rótulos de motivo para que diagnósticos possam distinguir dicas explícitas de fallback de propriedade

Não trate `activation` como hook de ciclo de vida nem como substituto de
`register(...)`. É metadado usado para restringir carregamento. Prefira campos de propriedade
quando eles já descreverem a relação; use `activation` apenas para dicas extras
do planejador.

### Plugins de canal e a ferramenta de mensagem compartilhada

Plugins de canal não precisam registrar uma ferramenta separada de enviar/editar/reagir para
ações normais de chat. O OpenClaw mantém uma única ferramenta `message` compartilhada no core, e
plugins de canal controlam a descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o core controla o host da ferramenta `message` compartilhada, o wiring de prompt, a
  contabilidade de sessão/thread e o despacho de execução
- plugins de canal controlam a descoberta de ações com escopo, a descoberta de recursos e quaisquer fragmentos de schema específicos do canal
- plugins de canal controlam a gramática de conversa de sessão específica do provider, como
  ids de conversa codificam ids de thread ou herdam de conversas pai
- plugins de canal executam a ação final por meio de seu adaptador de ação

Para plugins de canal, a superfície do SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta
permite que um plugin retorne suas ações visíveis, recursos e contribuições de schema
juntos, para que essas partes não se desviem umas das outras.

Quando um parâmetro específico do canal na ferramenta de mensagem carrega uma origem de mídia como
um caminho local ou URL remota de mídia, o plugin também deve retornar
`mediaSourceParams` de `describeMessageTool(...)`. O core usa essa lista explícita para aplicar normalização de caminho de sandbox e dicas de acesso a mídia de saída
sem codificar nomes de parâmetros controlados pelo plugin.
Prefira mapas com escopo por ação ali, não uma lista plana por canal inteiro, para que um
parâmetro de mídia exclusivo de perfil não seja normalizado em ações não relacionadas como
`send`.

O core passa o escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` confiável de entrada

Isso importa para plugins sensíveis ao contexto. Um canal pode ocultar ou expor
ações da ferramenta de mensagem com base na conta ativa, sala/thread/mensagem atual ou
identidade confiável do solicitante, sem codificar ramificações específicas do canal na ferramenta `message` do core.

É por isso que mudanças de roteamento do embedded-runner ainda são trabalho de Plugin: o runner é
responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta do plugin, para que a ferramenta `message` compartilhada exponha a superfície correta controlada pelo canal no turno atual.

Para helpers de execução controlados por canal, plugins empacotados devem manter o runtime de execução
dentro de seus próprios módulos de extensão. O core não controla mais os runtimes
de ação de mensagem de Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`.
Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e plugins
empacotados devem importar diretamente seu próprio código local de runtime a partir de seus módulos
controlados pela extensão.

O mesmo limite se aplica a seams do SDK nomeados por provider em geral: o core não deve
importar barrels de conveniência específicos de canal para extensões como Slack, Discord, Signal,
WhatsApp ou similares. Se o core precisa de um comportamento, ele deve ou consumir o barrel `api.ts` / `runtime-api.ts` do próprio plugin empacotado ou promover a necessidade a um recurso genérico estreito no SDK compartilhado.

Para polls especificamente, há dois caminhos de execução:

- `outbound.sendPoll` é a linha de base compartilhada para canais que se encaixam no
  modelo comum de poll
- `actions.handleAction("poll")` é o caminho preferido para semântica de poll específica do canal ou parâmetros extras de poll

O core agora adia o parse compartilhado de poll até depois que o despacho de poll do plugin recusar
a ação, para que handlers de poll controlados pelo Plugin possam aceitar campos de poll
específicos do canal sem serem bloqueados primeiro pelo parser genérico de poll.

Consulte [Internos da arquitetura de Plugin](/pt-BR/plugins/architecture-internals) para a sequência completa de inicialização.

## Modelo de propriedade de recursos

O OpenClaw trata um Plugin nativo como o limite de propriedade para uma **empresa** ou um
**recurso**, não como um conjunto solto de integrações não relacionadas.

Isso significa:

- um plugin de empresa geralmente deve controlar todas as superfícies do OpenClaw
  dessa empresa
- um plugin de recurso geralmente deve controlar a superfície completa do recurso que introduz
- canais devem consumir recursos compartilhados do core em vez de reimplementar comportamento de provider de forma ad hoc

<Accordion title="Exemplos de padrões de propriedade em plugins empacotados">
  - **Fornecedor com múltiplos recursos**: `openai` controla inferência de texto, fala, voz em tempo real,
    entendimento de mídia e geração de imagem. `google` controla inferência de texto
    mais entendimento de mídia, geração de imagem e pesquisa na web.
    `qwen` controla inferência de texto mais entendimento de mídia e geração de vídeo.
  - **Fornecedor com recurso único**: `elevenlabs` e `microsoft` controlam fala;
    `firecrawl` controla busca web; `minimax` / `mistral` / `moonshot` / `zai` controlam
    backends de entendimento de mídia.
  - **Plugin de recurso**: `voice-call` controla transporte de chamada, ferramentas, CLI, rotas
    e bridging de fluxo de mídia Twilio, mas consome recursos compartilhados de fala,
    transcrição em tempo real e voz em tempo real em vez de importar plugins de fornecedor
    diretamente.
</Accordion>

O estado final pretendido é:

- OpenAI vive em um único plugin mesmo que abranja modelos de texto, fala, imagens e
  vídeo futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual plugin de fornecedor controla o provider; eles consomem o
  contrato de recurso compartilhado exposto pelo core

Esta é a distinção principal:

- **plugin** = limite de propriedade
- **recurso** = contrato do core que vários plugins podem implementar ou consumir

Portanto, se o OpenClaw adicionar um novo domínio como vídeo, a primeira pergunta não é
“qual provider deve codificar tratamento de vídeo diretamente?” A primeira pergunta é “qual é
o contrato central de recurso de vídeo?” Assim que esse contrato existir, plugins de fornecedor
podem se registrar nele e plugins de canal/recurso podem consumi-lo.

Se o recurso ainda não existir, o movimento correto geralmente é:

1. definir o recurso ausente no core
2. expô-lo por meio da API/runtime de Plugin de forma tipada
3. conectar canais/recursos a esse recurso
4. deixar plugins de fornecedor registrar implementações

Isso mantém a propriedade explícita, evitando comportamento do core que dependa de um
único fornecedor ou de um caminho de código específico de plugin pontual.

### Camadas de recurso

Use este modelo mental ao decidir onde o código deve ficar:

- **camada de recurso do core**: orquestração compartilhada, política, fallback, regras de
  mesclagem de configuração, semântica de entrega e contratos tipados
- **camada de plugin de fornecedor**: APIs específicas do fornecedor, autenticação, catálogos de modelos, síntese de fala,
  geração de imagem, backends futuros de vídeo, endpoints de uso
- **camada de plugin de canal/recurso**: integração com Slack/Discord/voice-call/etc.
  que consome recursos do core e os apresenta em uma superfície

Por exemplo, TTS segue este formato:

- o core controla a política de TTS no momento da resposta, ordem de fallback, preferências e entrega por canal
- `openai`, `elevenlabs` e `microsoft` controlam implementações de síntese
- `voice-call` consome o helper de runtime de TTS para telefonia

Esse mesmo padrão deve ser preferido para recursos futuros.

### Exemplo de plugin de empresa com múltiplos recursos

Um plugin de empresa deve parecer coeso do lado de fora. Se o OpenClaw tiver contratos compartilhados
para modelos, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia,
geração de imagem, geração de vídeo, busca web e pesquisa na web,
um fornecedor pode controlar todas as suas superfícies em um único lugar:

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
      // hooks de autenticação/catálogo de modelos/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configuração de fala específica do fornecedor — implemente diretamente a interface SpeechProviderPlugin
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

O que importa não são os nomes exatos dos helpers. O formato importa:

- um plugin controla a superfície do fornecedor
- o core ainda controla os contratos de recurso
- canais e plugins de recurso consomem helpers `api.runtime.*`, não código do fornecedor
- testes de contrato podem afirmar que o plugin registrou os recursos que
  afirma controlar

### Exemplo de recurso: entendimento de vídeo

O OpenClaw já trata entendimento de imagem/áudio/vídeo como um único
recurso compartilhado. O mesmo modelo de propriedade se aplica aqui:

1. o core define o contrato de entendimento de mídia
2. plugins de fornecedor registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. canais e plugins de recurso consomem o comportamento compartilhado do core em vez de
   se conectar diretamente ao código do fornecedor

Isso evita incorporar no core pressupostos de vídeo de um único provider. O Plugin controla
a superfície do fornecedor; o core controla o contrato de recurso e o comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o core controla o contrato tipado
de recurso e o helper de runtime, e plugins de fornecedor registram
implementações `api.registerVideoGenerationProvider(...)` nele.

Precisa de uma checklist concreta de rollout? Consulte
[Capability Cookbook](/pt-BR/plugins/architecture).

## Contratos e aplicação

A superfície da API de Plugin é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e
os helpers de runtime nos quais um Plugin pode confiar.

Por que isso importa:

- autores de plugins recebem um padrão interno estável
- o core pode rejeitar propriedade duplicada, como dois plugins registrando o mesmo
  id de provider
- a inicialização pode expor diagnósticos acionáveis para registros malformados
- testes de contrato podem impor a propriedade de plugins empacotados e evitar desvio silencioso

Há duas camadas de aplicação:

1. **aplicação de registro em runtime**
   O registro de plugins valida registros conforme os plugins são carregados. Exemplos:
   ids de provider duplicados, ids duplicados de provider de fala e registros malformados
   produzem diagnósticos de plugin em vez de comportamento indefinido.
2. **testes de contrato**
   Plugins empacotados são capturados em registros de contrato durante execuções de teste para que o
   OpenClaw possa afirmar explicitamente a propriedade. Hoje isso é usado para
   providers de modelo, providers de fala, providers de pesquisa na web e propriedade de registro empacotado.

O efeito prático é que o OpenClaw sabe, antecipadamente, qual Plugin controla qual
superfície. Isso permite que core e canais componham sem atrito porque a propriedade é
declarada, tipada e testável, e não implícita.

### O que pertence em um contrato

Bons contratos de Plugin são:

- tipados
- pequenos
- específicos de recurso
- controlados pelo core
- reutilizáveis por vários plugins
- consumíveis por canais/recursos sem conhecimento do fornecedor

Maus contratos de Plugin são:

- política específica de fornecedor escondida no core
- escape hatches pontuais de plugin que ignoram o registro
- código de canal acessando diretamente uma implementação de fornecedor
- objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` ou
  `api.runtime`

Na dúvida, eleve o nível de abstração: defina primeiro o recurso e depois deixe
os plugins se conectarem a ele.

## Modelo de execução

Plugins nativos do OpenClaw executam **no processo** com o Gateway. Eles não
são sandboxed. Um Plugin nativo carregado tem o mesmo limite de confiança no nível do processo que o código do core.

Implicações:

- um Plugin nativo pode registrar ferramentas, handlers de rede, hooks e serviços
- um bug em um Plugin nativo pode derrubar ou desestabilizar o gateway
- um Plugin nativo malicioso equivale a execução arbitrária de código dentro
  do processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente
Skills empacotadas.

Use allowlists e caminhos explícitos de instalação/carregamento para plugins não empacotados. Trate
plugins do workspace como código de tempo de desenvolvimento, não como padrões de produção.

Para nomes de pacote de workspace empacotado, mantenha o id do plugin ancorado no nome
npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` quando
o pacote expõe intencionalmente uma função de plugin mais estreita.

Observação importante sobre confiança:

- `plugins.allow` confia em **ids de plugins**, não na proveniência da origem.
- Um Plugin de workspace com o mesmo id de um Plugin empacotado intencionalmente sobrepõe
  a cópia empacotada quando esse Plugin do workspace está ativado/na allowlist.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.
- A confiança em plugins empacotados é resolvida a partir do snapshot da origem — o manifesto e
  o código em disco no momento do carregamento — e não a partir de metadados de instalação. Um registro de instalação corrompido ou substituído não pode ampliar silenciosamente a superfície de confiança de um plugin empacotado além do que a origem real declara.

## Limite de exportação

O OpenClaw exporta recursos, não conveniências de implementação.

Mantenha público o registro de recursos. Reduza exports de helpers não contratuais:

- subcaminhos de helpers específicos de plugins empacotados
- subcaminhos de plumbing de runtime não destinados a API pública
- helpers de conveniência específicos de fornecedor
- helpers de setup/onboarding que são detalhes de implementação

Alguns subcaminhos de helpers de plugins empacotados ainda permanecem no mapa de exportação gerado do SDK por compatibilidade e manutenção de plugins empacotados. Exemplos atuais incluem
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e vários seams `plugin-sdk/matrix*`. Trate-os como
exports reservados de detalhe de implementação, não como o padrão recomendado de SDK para
novos plugins de terceiros.

## Internos e referência

Para o pipeline de carregamento, modelo de registro, hooks de runtime de provider, rotas HTTP do Gateway,
schemas da ferramenta de mensagem, resolução de destino de canal, catálogos de provider,
plugins de mecanismo de contexto e o guia para adicionar um novo recurso, consulte
[Internos da arquitetura de Plugin](/pt-BR/plugins/architecture-internals).

## Relacionado

- [Criar plugins](/pt-BR/plugins/building-plugins)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Manifesto de Plugin](/pt-BR/plugins/manifest)
