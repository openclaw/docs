---
read_when:
    - Compilação ou depuração de plugins nativos do OpenClaw
    - Entender o modelo de capacidade do Plugin ou os limites de propriedade
    - Trabalhando no pipeline de carregamento do Plugin ou no registro
    - Implementando hooks de tempo de execução de provedor ou plugins de canal
sidebarTitle: Internals
summary: 'Aspectos internos do Plugin: modelo de capacidades, propriedade, contratos, pipeline de carregamento e auxiliares de tempo de execução'
title: Internos do Plugin
x-i18n:
    generated_at: "2026-05-02T05:51:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

Esta é a **referência aprofundada de arquitetura** do sistema de plugins do OpenClaw. Para guias práticos, comece com uma das páginas focadas abaixo.

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/pt-BR/tools/plugin">
    Guia do usuário final para adicionar, habilitar e solucionar problemas de plugins.
  </Card>
  <Card title="Building plugins" icon="rocket" href="/pt-BR/plugins/building-plugins">
    Tutorial do primeiro Plugin com o menor manifesto funcional.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um Plugin de canal de mensagens.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um Plugin de provedor de modelo.
  </Card>
  <Card title="SDK overview" icon="book" href="/pt-BR/plugins/sdk-overview">
    Mapa de importação e referência da API de registro.
  </Card>
</CardGroup>

## Modelo público de recursos

Recursos são o modelo público de **Plugin nativo** dentro do OpenClaw. Todo Plugin nativo do OpenClaw se registra em um ou mais tipos de recurso:

| Recurso                | Método de registro                                | Plugins de exemplo                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferência de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferência da CLI | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Fala                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Compreensão de mídia   | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Geração de imagens     | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Geração de música      | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Busca Web              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pesquisa Web           | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensagens      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Descoberta do Gateway  | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Um Plugin que registra zero recursos, mas fornece hooks, ferramentas, serviços de descoberta ou serviços em segundo plano é um Plugin **legado apenas de hooks**. Esse padrão ainda tem suporte completo.
</Note>

### Postura de compatibilidade externa

O modelo de recursos já está incorporado ao núcleo e é usado hoje por plugins empacotados/nativos, mas a compatibilidade de plugins externos ainda precisa de um critério mais rigoroso do que "está exportado, portanto está congelado".

| Situação do Plugin                              | Orientação                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                       | Mantenha integrações baseadas em hooks funcionando; esta é a linha de base de compatibilidade. |
| Novos plugins empacotados/nativos                 | Prefira registro explícito de recursos em vez de acessos específicos de fornecedor ou novos designs apenas com hooks. |
| Plugins externos adotando registro de recursos    | Permitido, mas trate superfícies auxiliares específicas de recursos como em evolução, a menos que a documentação as marque como estáveis. |

O registro de recursos é a direção pretendida. Hooks legados continuam sendo o caminho mais seguro, sem quebras, para plugins externos durante a transição. Subcaminhos auxiliares exportados não são todos iguais — prefira contratos estreitos e documentados em vez de exportações auxiliares incidentais.

### Formatos de Plugin

O OpenClaw classifica cada Plugin carregado em um formato com base em seu comportamento real de registro (não apenas em metadados estáticos):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra exatamente um tipo de recurso (por exemplo, um Plugin apenas de provedor como `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra múltiplos tipos de recurso (por exemplo, `openai` possui inferência de texto, fala, compreensão de mídia e geração de imagens).
  </Accordion>
  <Accordion title="hook-only">
    Registra apenas hooks (tipados ou personalizados), sem recursos, ferramentas, comandos ou serviços.
  </Accordion>
  <Accordion title="non-capability">
    Registra ferramentas, comandos, serviços ou rotas, mas nenhum recurso.
  </Accordion>
</AccordionGroup>

Use `openclaw plugins inspect <id>` para ver o formato e o detalhamento de recursos de um Plugin. Consulte a [referência da CLI](/pt-BR/cli/plugins#inspect) para obter detalhes.

### Hooks legados

O hook `before_agent_start` continua tendo suporte como caminho de compatibilidade para plugins apenas de hooks. Plugins legados reais ainda dependem dele.

Direção:

- mantê-lo funcionando
- documentá-lo como legado
- preferir `before_model_resolve` para trabalho de substituição de modelo/provedor
- preferir `before_prompt_build` para trabalho de mutação de prompt
- remover somente depois que o uso real diminuir e a cobertura de fixtures comprovar a segurança da migração

### Sinais de compatibilidade

Ao executar `openclaw doctor` ou `openclaw plugins inspect <id>`, você pode ver um destes rótulos:

| Sinal                      | Significado                                                  |
| -------------------------- | ------------------------------------------------------------ |
| **configuração válida**    | A configuração é analisada corretamente e os plugins resolvem |
| **aviso de compatibilidade** | O Plugin usa um padrão com suporte, mas mais antigo (por exemplo, `hook-only`) |
| **aviso legado**           | O Plugin usa `before_agent_start`, que está obsoleto         |
| **erro grave**             | A configuração é inválida ou o Plugin falhou ao carregar     |

Nem `hook-only` nem `before_agent_start` quebrarão seu Plugin hoje: `hook-only` é consultivo, e `before_agent_start` apenas dispara um aviso. Esses sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

<Steps>
  <Step title="Manifest + discovery">
    O OpenClaw encontra plugins candidatos a partir de caminhos configurados, raízes de workspace, raízes globais de plugins e plugins empacotados. A descoberta lê primeiro manifestos nativos `openclaw.plugin.json` e manifestos de pacote com suporte.
  </Step>
  <Step title="Enablement + validation">
    O núcleo decide se um Plugin descoberto está habilitado, desabilitado, bloqueado ou selecionado para um slot exclusivo, como memória.
  </Step>
  <Step title="Runtime loading">
    Plugins nativos do OpenClaw são carregados no processo e registram recursos em um registro central. JavaScript empacotado carrega por meio de `require` nativo; TypeScript de origem local de terceiros é o fallback emergencial via Jiti. Pacotes compatíveis são normalizados em registros de registry sem importar código de runtime.
  </Step>
  <Step title="Surface consumption">
    O restante do OpenClaw lê o registry para expor ferramentas, canais, configuração de provedores, hooks, rotas HTTP, comandos da CLI e serviços.
  </Step>
</Steps>

Especificamente para a CLI de plugins, a descoberta de comandos raiz é dividida em duas fases:

- metadados de tempo de análise vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do Plugin pode permanecer lazy e registrar na primeira invocação

Isso mantém o código de CLI pertencente ao Plugin dentro do Plugin, enquanto ainda permite que o OpenClaw reserve nomes de comandos raiz antes da análise.

O limite de design importante:

- validação de manifesto/configuração deve funcionar a partir de **metadados de manifesto/esquema** sem executar código do Plugin
- a descoberta de recursos nativos pode carregar código de entrada de Plugin confiável para criar um snapshot de registry sem ativação
- o comportamento nativo de runtime vem do caminho `register(api)` do módulo do Plugin com `api.registrationMode === "full"`

Essa divisão permite que o OpenClaw valide a configuração, explique plugins ausentes/desabilitados e crie dicas de UI/esquema antes que o runtime completo esteja ativo.

### Snapshot de metadados de Plugin e tabela de consulta

A inicialização do Gateway cria um `PluginMetadataSnapshot` para o snapshot de configuração atual. O snapshot contém apenas metadados: ele armazena o índice de plugins instalados, o registry de manifestos, diagnósticos de manifesto, mapas de proprietários, um normalizador de id de Plugin e registros de manifesto. Ele não mantém módulos de Plugin carregados, SDKs de provedores, conteúdo de pacotes ou exportações de runtime.

Validação de configuração ciente de plugins, habilitação automática na inicialização e bootstrap de plugins do Gateway consomem esse snapshot em vez de reconstruir metadados de manifesto/índice de forma independente. `PluginLookUpTable` é derivado do mesmo snapshot e adiciona o plano de plugins de inicialização para a configuração de runtime atual.

Depois da inicialização, o Gateway mantém o snapshot de metadados atual como um produto de runtime substituível. Descobertas repetidas de provedores em runtime podem emprestar esse snapshot em vez de reconstruir o índice instalado e o registry de manifestos para cada passagem pelo catálogo de provedores. O snapshot é limpo ou substituído no desligamento do Gateway, em mudanças de configuração/inventário de plugins e em gravações de índice instalado; chamadores voltam para o caminho frio de manifesto/índice quando não há snapshot atual compatível. Verificações de compatibilidade devem incluir raízes de descoberta de plugins, como `plugins.load.paths` e o workspace padrão do agente, porque plugins de workspace fazem parte do escopo de metadados.

O snapshot e a tabela de consulta mantêm decisões repetidas de inicialização no caminho rápido:

- propriedade de canal
- inicialização de canal adiada
- ids de plugins de inicialização
- propriedade de provedor e backend da CLI
- propriedade de provedor de configuração, alias de comando, provedor de catálogo de modelos e contrato de manifesto
- validação de esquema de configuração de Plugin e esquema de configuração de canal
- decisões de habilitação automática na inicialização

O limite de segurança é a substituição do snapshot, não sua mutação. Recrie o snapshot quando configuração, inventário de plugins, registros de instalação ou política de índice persistido mudarem. Não o trate como um registry global amplo e mutável, e não mantenha snapshots históricos sem limite. O carregamento de plugins em runtime permanece separado dos snapshots de metadados para que estado de runtime obsoleto não possa ser ocultado atrás de um cache de metadados.

A regra de cache está documentada em [Internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals#plugin-cache-boundary): metadados de manifesto e descoberta são recentes, a menos que um chamador mantenha um snapshot explícito, uma tabela de consulta ou um registry de manifestos para o fluxo atual. Caches ocultos de metadados e TTLs por relógio de parede não fazem parte do carregamento de plugins. Somente caches de loader de runtime, módulos e artefatos de dependência podem persistir depois que código ou artefatos instalados são realmente carregados.

Alguns chamadores de caminho frio ainda reconstroem registries de manifesto diretamente a partir do índice persistido de plugins instalados, em vez de receber uma `PluginLookUpTable` do Gateway. Esse caminho agora reconstrói o registry sob demanda; prefira passar a tabela de consulta atual ou um registry de manifestos explícito pelos fluxos de runtime quando um chamador já tiver um.

### Planejamento de ativação

O planejamento de ativação faz parte do plano de controle. Chamadores podem perguntar quais plugins são relevantes para um comando, provedor, canal, rota, harness de agente ou recurso concreto antes de carregar registries de runtime mais amplos.

O planejador mantém compatível o comportamento atual de manifesto:

- campos `activation.*` são dicas explícitas do planejador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hooks continuam sendo fallback de propriedade de manifesto
- a API do planejador apenas com ids permanece disponível para chamadores existentes
- a API de plano informa rótulos de motivo para que diagnósticos possam distinguir dicas explícitas de fallback de propriedade

<Warning>
Não trate `activation` como um hook de ciclo de vida nem como substituto para `register(...)`. É um metadado usado para restringir o carregamento. Prefira campos de propriedade quando eles já descreverem a relação; use `activation` apenas para dicas extras ao planejador.
</Warning>

### Plugins de canal e a ferramenta de mensagem compartilhada

Plugins de canal não precisam registrar uma ferramenta separada de envio/edição/reação para ações normais de chat. OpenClaw mantém uma ferramenta `message` compartilhada no núcleo, e os plugins de canal são responsáveis pela descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o núcleo é responsável pelo host da ferramenta `message` compartilhada, pela fiação de prompt, pela escrituração de sessão/thread e pelo despacho de execução
- os plugins de canal são responsáveis pela descoberta de ações com escopo, pela descoberta de capacidades e por quaisquer fragmentos de schema específicos do canal
- os plugins de canal são responsáveis pela gramática de conversa de sessão específica do provedor, como a forma como ids de conversa codificam ids de thread ou herdam de conversas pai
- os plugins de canal executam a ação final por meio de seu adaptador de ação

Para plugins de canal, a superfície do SDK é `ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada de descoberta unificada permite que um plugin retorne suas ações visíveis, capacidades e contribuições de schema juntas, para que essas peças não se desviem umas das outras.

Quando um parâmetro de ferramenta de mensagem específico do canal carrega uma origem de mídia, como um caminho local ou uma URL de mídia remota, o plugin também deve retornar `mediaSourceParams` de `describeMessageTool(...)`. O núcleo usa essa lista explícita para aplicar normalização de caminhos do sandbox e dicas de acesso a mídia de saída sem codificar nomes de parâmetros pertencentes ao plugin. Prefira mapas com escopo por ação ali, não uma lista plana para todo o canal, para que um parâmetro de mídia usado apenas em perfil não seja normalizado em ações não relacionadas como `send`.

O núcleo passa o escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` de entrada confiável

Isso importa para plugins sensíveis ao contexto. Um canal pode ocultar ou expor ações de mensagem com base na conta ativa, na sala/thread/mensagem atual ou na identidade confiável do solicitante sem codificar ramificações específicas do canal na ferramenta `message` do núcleo.

É por isso que alterações de roteamento do executor embutido continuam sendo trabalho de plugin: o executor é responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta do plugin, para que a ferramenta `message` compartilhada exponha a superfície correta, pertencente ao canal, para o turno atual.

Para auxiliares de execução pertencentes ao canal, plugins empacotados devem manter o runtime de execução dentro de seus próprios módulos de extensão. O núcleo não é mais responsável pelos runtimes de ação de mensagem do Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`. Não publicamos subcaminhos `plugin-sdk/*-action-runtime` separados, e plugins empacotados devem importar seu próprio código de runtime local diretamente de seus módulos pertencentes à extensão.

O mesmo limite se aplica a seams do SDK nomeadas por provedor em geral: o núcleo não deve importar barrels de conveniência específicos de canal para Slack, Discord, Signal, WhatsApp ou extensões semelhantes. Se o núcleo precisar de um comportamento, deve consumir o barrel `api.ts` / `runtime-api.ts` do próprio plugin empacotado ou promover a necessidade para uma capacidade genérica estreita no SDK compartilhado.

Plugins empacotados seguem a mesma regra. O `runtime-api.ts` de um plugin empacotado não deve reexportar sua própria fachada marcada `openclaw/plugin-sdk/<plugin-id>`. Essas fachadas marcadas continuam sendo shims de compatibilidade para plugins externos e consumidores antigos, mas plugins empacotados devem usar exportações locais mais subcaminhos genéricos estreitos do SDK, como `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` ou `openclaw/plugin-sdk/webhook-ingress`. Código novo não deve adicionar fachadas do SDK específicas de ids de plugin, a menos que o limite de compatibilidade de um ecossistema externo existente exija isso.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a linha de base compartilhada para canais que se encaixam no modelo comum de enquete
- `actions.handleAction("poll")` é o caminho preferencial para semântica de enquete específica do canal ou parâmetros extras de enquete

Agora o núcleo adia a análise compartilhada de enquetes até depois que o despacho de enquete do plugin recusa a ação, para que handlers de enquete pertencentes ao plugin possam aceitar campos de enquete específicos do canal sem serem bloqueados primeiro pelo analisador genérico de enquetes.

Consulte [Internos da arquitetura de Plugin](/pt-BR/plugins/architecture-internals) para a sequência completa de inicialização.

## Modelo de propriedade de capacidade

OpenClaw trata um plugin nativo como o limite de propriedade de uma **empresa** ou de um **recurso**, não como um conjunto aleatório de integrações não relacionadas.

Isso significa:

- um plugin de empresa geralmente deve ser responsável por todas as superfícies dessa empresa voltadas ao OpenClaw
- um plugin de recurso geralmente deve ser responsável por toda a superfície do recurso que introduz
- canais devem consumir capacidades compartilhadas do núcleo em vez de reimplementar comportamento de provedor de forma ad hoc

<AccordionGroup>
  <Accordion title="Várias capacidades de fornecedor">
    `openai` é responsável por inferência de texto, fala, voz em tempo real, entendimento de mídia e geração de imagens. `google` é responsável por inferência de texto mais entendimento de mídia, geração de imagens e pesquisa na web. `qwen` é responsável por inferência de texto mais entendimento de mídia e geração de vídeo.
  </Accordion>
  <Accordion title="Capacidade única de fornecedor">
    `elevenlabs` e `microsoft` são responsáveis por fala; `firecrawl` é responsável por busca na web; `minimax` / `mistral` / `moonshot` / `zai` são responsáveis por backends de entendimento de mídia.
  </Accordion>
  <Accordion title="Plugin de recurso">
    `voice-call` é responsável por transporte de chamadas, ferramentas, CLI, rotas e ponte de media-stream do Twilio, mas consome capacidades compartilhadas de fala, transcrição em tempo real e voz em tempo real em vez de importar plugins de fornecedor diretamente.
  </Accordion>
</AccordionGroup>

O estado final pretendido é:

- OpenAI vive em um único plugin mesmo que abranja modelos de texto, fala, imagens e vídeo futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual plugin de fornecedor é responsável pelo provedor; eles consomem o contrato de capacidade compartilhada exposto pelo núcleo

Esta é a distinção principal:

- **plugin** = limite de propriedade
- **capacidade** = contrato do núcleo que vários plugins podem implementar ou consumir

Então, se OpenClaw adicionar um novo domínio, como vídeo, a primeira pergunta não é "qual provedor deve codificar o tratamento de vídeo de forma fixa?" A primeira pergunta é "qual é o contrato de capacidade de vídeo do núcleo?" Depois que esse contrato existir, plugins de fornecedor podem se registrar nele e plugins de canal/recurso podem consumi-lo.

Se a capacidade ainda não existir, o movimento certo geralmente é:

<Steps>
  <Step title="Defina a capacidade">
    Defina a capacidade ausente no núcleo.
  </Step>
  <Step title="Exponha pelo SDK">
    Exponha-a pela API/runtime do plugin de forma tipada.
  </Step>
  <Step title="Conecte consumidores">
    Conecte canais/recursos a essa capacidade.
  </Step>
  <Step title="Implementações de fornecedor">
    Permita que plugins de fornecedor registrem implementações.
  </Step>
</Steps>

Isso mantém a propriedade explícita enquanto evita comportamento no núcleo que depende de um único fornecedor ou de um caminho de código específico de plugin feito uma única vez.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código pertence:

<Tabs>
  <Tab title="Camada de capacidade do núcleo">
    Orquestração compartilhada, política, fallback, regras de mesclagem de configuração, semântica de entrega e contratos tipados.
  </Tab>
  <Tab title="Camada de plugin de fornecedor">
    APIs específicas do fornecedor, autenticação, catálogos de modelos, síntese de fala, geração de imagens, backends futuros de vídeo, endpoints de uso.
  </Tab>
  <Tab title="Camada de plugin de canal/recurso">
    Integração Slack/Discord/voice-call/etc. que consome capacidades do núcleo e as apresenta em uma superfície.
  </Tab>
</Tabs>

Por exemplo, TTS segue este formato:

- o núcleo é responsável pela política de TTS em tempo de resposta, ordem de fallback, preferências e entrega ao canal
- `openai`, `elevenlabs` e `microsoft` são responsáveis pelas implementações de síntese
- `voice-call` consome o auxiliar de runtime de TTS de telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de plugin de empresa com várias capacidades

Um plugin de empresa deve parecer coeso do lado de fora. Se OpenClaw tiver contratos compartilhados para modelos, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração de imagens, geração de vídeo, busca na web e pesquisa na web, um fornecedor pode ser responsável por todas as suas superfícies em um só lugar:

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

O que importa não são os nomes exatos dos auxiliares. O formato importa:

- um plugin é responsável pela superfície do fornecedor
- o núcleo continua responsável pelos contratos de capacidade
- canais e plugins de recurso consomem auxiliares `api.runtime.*`, não código de fornecedor
- testes de contrato podem afirmar que o plugin registrou as capacidades que declara possuir

### Exemplo de capacidade: entendimento de vídeo

OpenClaw já trata entendimento de imagem/áudio/vídeo como uma capacidade compartilhada. O mesmo modelo de propriedade se aplica ali:

<Steps>
  <Step title="O núcleo define o contrato">
    O núcleo define o contrato de entendimento de mídia.
  </Step>
  <Step title="Plugins de fornecedor registram">
    Plugins de fornecedor registram `describeImage`, `transcribeAudio` e `describeVideo` conforme aplicável.
  </Step>
  <Step title="Consumidores usam o comportamento compartilhado">
    Canais e plugins de recurso consomem o comportamento compartilhado do núcleo em vez de se conectarem diretamente ao código de fornecedor.
  </Step>
</Steps>

Isso evita embutir as suposições de vídeo de um provedor no núcleo. O plugin é responsável pela superfície do fornecedor; o núcleo é responsável pelo contrato de capacidade e pelo comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o núcleo é responsável pelo contrato de capacidade tipado e pelo auxiliar de runtime, e plugins de fornecedor registram implementações `api.registerVideoGenerationProvider(...)` nele.

Precisa de uma checklist concreta de rollout? Consulte [Cookbook de capacidades](/pt-BR/plugins/architecture).

## Contratos e aplicação

A superfície da API de plugin é intencionalmente tipada e centralizada em `OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e os auxiliares de runtime dos quais um plugin pode depender.

Por que isso importa:

- autores de plugins recebem um padrão interno estável
- o núcleo pode rejeitar propriedade duplicada, como dois plugins registrando o mesmo id de provedor
- a inicialização pode expor diagnósticos acionáveis para registros malformados
- testes de contrato podem impor a propriedade de plugins empacotados e impedir desvio silencioso

Há duas camadas de aplicação:

<AccordionGroup>
  <Accordion title="Aplicação do registro em tempo de execução">
    O registro de plugins valida os registros conforme os plugins são carregados. Exemplos: IDs de provedores duplicados, IDs de provedores de fala duplicados e registros malformados produzem diagnósticos de plugin em vez de comportamento indefinido.
  </Accordion>
  <Accordion title="Testes de contrato">
    Plugins incluídos são capturados em registros de contrato durante as execuções de teste para que o OpenClaw possa afirmar a propriedade explicitamente. Hoje, isso é usado para provedores de modelo, provedores de fala, provedores de pesquisa na web e propriedade de registro incluída.
  </Accordion>
</AccordionGroup>

O efeito prático é que o OpenClaw sabe, de antemão, qual plugin possui qual superfície. Isso permite que o core e os canais componham sem interrupções, porque a propriedade é declarada, tipada e testável em vez de implícita.

### O que pertence a um contrato

<Tabs>
  <Tab title="Bons contratos">
    - tipados
    - pequenos
    - específicos de capacidade
    - pertencentes ao core
    - reutilizáveis por vários plugins
    - consumíveis por canais/recursos sem conhecimento do fornecedor

  </Tab>
  <Tab title="Contratos ruins">
    - política específica de fornecedor oculta no core
    - rotas de escape pontuais de plugin que contornam o registro
    - código de canal acessando diretamente uma implementação de fornecedor
    - objetos de tempo de execução ad hoc que não fazem parte de `OpenClawPluginApi` ou `api.runtime`

  </Tab>
</Tabs>

Em caso de dúvida, eleve o nível de abstração: defina a capacidade primeiro e depois deixe os plugins se conectarem a ela.

## Modelo de execução

Plugins nativos do OpenClaw são executados **no processo** com o Gateway. Eles não são isolados em sandbox. Um plugin nativo carregado tem o mesmo limite de confiança no nível do processo que o código do core.

<Warning>
Implicações de plugins nativos: um plugin pode registrar ferramentas, manipuladores de rede, hooks e serviços; um bug de plugin pode travar ou desestabilizar o gateway; e um plugin nativo malicioso é equivalente à execução arbitrária de código dentro do processo do OpenClaw.
</Warning>

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente Skills incluídas.

Use listas de permissão e caminhos explícitos de instalação/carregamento para plugins não incluídos. Trate plugins de workspace como código de tempo de desenvolvimento, não como padrões de produção.

Para nomes de pacotes de workspace incluídos, mantenha o ID do plugin ancorado no nome npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado, como `-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding`, quando o pacote expõe intencionalmente uma função de plugin mais estreita.

<Note>
**Nota de confiança:** `plugins.allow` confia em **IDs de plugin**, não na proveniência da origem. Um plugin de workspace com o mesmo ID de um plugin incluído sombreia intencionalmente a cópia incluída quando esse plugin de workspace está habilitado/na lista de permissão. Isso é normal e útil para desenvolvimento local, teste de patches e hotfixes. A confiança em plugins incluídos é resolvida a partir do snapshot de origem — o manifesto e o código em disco no momento do carregamento — em vez de metadados de instalação. Um registro de instalação corrompido ou substituído não pode ampliar silenciosamente a superfície de confiança de um plugin incluído além do que a origem real declara.
</Note>

## Limite de exportação

O OpenClaw exporta capacidades, não conveniências de implementação.

Mantenha público o registro de capacidades. Remova exportações auxiliares que não fazem parte do contrato:

- subcaminhos auxiliares específicos de plugins incluídos
- subcaminhos de encanamento de tempo de execução não destinados como API pública
- auxiliares de conveniência específicos de fornecedor
- auxiliares de configuração/onboarding que são detalhes de implementação

Subcaminhos auxiliares reservados de plugins incluídos foram retirados do mapa de exportação gerado do SDK. Mantenha auxiliares específicos do proprietário dentro do pacote do plugin proprietário; promova apenas comportamento reutilizável do host para contratos genéricos do SDK, como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

## Internos e referência

Para o pipeline de carregamento, modelo de registro, hooks de tempo de execução de provedores, rotas HTTP do Gateway, esquemas de ferramentas de mensagem, resolução de destino de canais, catálogos de provedores, plugins do mecanismo de contexto e o guia para adicionar uma nova capacidade, consulte [Internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals).

## Relacionados

- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Manifesto de plugin](/pt-BR/plugins/manifest)
- [Configuração do SDK de plugins](/pt-BR/plugins/sdk-setup)
