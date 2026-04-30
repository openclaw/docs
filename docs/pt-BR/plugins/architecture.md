---
read_when:
    - Criando ou depurando plugins nativos do OpenClaw
    - Entendendo o modelo de capacidades de Plugin ou os limites de propriedade
    - Trabalhando no pipeline de carregamento de Plugins ou no registro
    - Implementando hooks de runtime de provedores ou plugins de canal
sidebarTitle: Internals
summary: 'Detalhes internos do Plugin: modelo de capacidades, propriedade, contratos, pipeline de carregamento e auxiliares de runtime'
title: Internos do Plugin
x-i18n:
    generated_at: "2026-04-30T09:58:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

Esta é a **referência de arquitetura profunda** para o sistema de plugins do OpenClaw. Para guias práticos, comece por uma das páginas focadas abaixo.

<CardGroup cols={2}>
  <Card title="Instalar e usar plugins" icon="plug" href="/pt-BR/tools/plugin">
    Guia para usuários finais sobre como adicionar, habilitar e solucionar problemas com plugins.
  </Card>
  <Card title="Criando plugins" icon="rocket" href="/pt-BR/plugins/building-plugins">
    Tutorial do primeiro plugin com o menor manifesto funcional.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um plugin de canal de mensagens.
  </Card>
  <Card title="Plugins de provedor" icon="microchip" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um plugin de provedor de modelo.
  </Card>
  <Card title="Visão geral do SDK" icon="book" href="/pt-BR/plugins/sdk-overview">
    Referência do mapa de importação e da API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

Capacidades são o modelo público de **plugin nativo** dentro do OpenClaw. Todo plugin nativo do OpenClaw é registrado em um ou mais tipos de capacidade:

| Capacidade                 | Método de registro                              | Plugins de exemplo                 |
| -------------------------- | ------------------------------------------------ | ---------------------------------- |
| Inferência de texto        | `api.registerProvider(...)`                      | `openai`, `anthropic`              |
| Backend de inferência CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`              |
| Fala                       | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`          |
| Transcrição em tempo real  | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                           |
| Voz em tempo real          | `api.registerRealtimeVoiceProvider(...)`         | `openai`                           |
| Compreensão de mídia       | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                 |
| Geração de imagem          | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Geração de música          | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                |
| Geração de vídeo           | `api.registerVideoGenerationProvider(...)`       | `qwen`                             |
| Busca de conteúdo web      | `api.registerWebFetchProvider(...)`              | `firecrawl`                        |
| Pesquisa web               | `api.registerWebSearchProvider(...)`             | `google`                           |
| Canal / mensagens          | `api.registerChannel(...)`                       | `msteams`, `matrix`                |
| Descoberta de Gateway      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                          |

<Note>
Um plugin que registra zero capacidades, mas fornece hooks, ferramentas, serviços de descoberta ou serviços em segundo plano, é um plugin **legado apenas com hooks**. Esse padrão ainda é totalmente compatível.
</Note>

### Postura de compatibilidade externa

O modelo de capacidades está implementado no core e é usado por plugins empacotados/nativos hoje, mas a compatibilidade de plugins externos ainda precisa de um critério mais rigoroso do que "está exportado, portanto está congelado".

| Situação do plugin                              | Orientação                                                                                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Plugins externos existentes                     | Mantenha integrações baseadas em hooks funcionando; esta é a linha de base de compatibilidade.     |
| Novos plugins empacotados/nativos               | Prefira registro explícito de capacidade a acessos internos específicos de fornecedor ou novos designs apenas com hooks. |
| Plugins externos adotando registro de capacidade | Permitido, mas trate superfícies auxiliares específicas de capacidade como em evolução, a menos que a documentação as marque como estáveis. |

O registro de capacidades é a direção pretendida. Hooks legados continuam sendo o caminho mais seguro sem quebras para plugins externos durante a transição. Subcaminhos auxiliares exportados não são todos equivalentes — prefira contratos documentados e estreitos a exportações auxiliares incidentais.

### Formatos de plugin

O OpenClaw classifica todo plugin carregado em um formato com base no seu comportamento real de registro (não apenas em metadados estáticos):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra exatamente um tipo de capacidade (por exemplo, um plugin apenas de provedor como `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra vários tipos de capacidade (por exemplo, `openai` possui inferência de texto, fala, compreensão de mídia e geração de imagem).
  </Accordion>
  <Accordion title="hook-only">
    Registra apenas hooks (tipados ou personalizados), sem capacidades, ferramentas, comandos ou serviços.
  </Accordion>
  <Accordion title="non-capability">
    Registra ferramentas, comandos, serviços ou rotas, mas nenhuma capacidade.
  </Accordion>
</AccordionGroup>

Use `openclaw plugins inspect <id>` para ver o formato de um plugin e a decomposição de suas capacidades. Consulte a [referência da CLI](/pt-BR/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como um caminho de compatibilidade para plugins apenas com hooks. Plugins legados reais ainda dependem dele.

Direção:

- mantê-lo funcionando
- documentá-lo como legado
- preferir `before_model_resolve` para trabalho de substituição de modelo/provedor
- preferir `before_prompt_build` para trabalho de mutação de prompt
- remover apenas depois que o uso real cair e a cobertura de fixtures provar a segurança da migração

### Sinais de compatibilidade

Ao executar `openclaw doctor` ou `openclaw plugins inspect <id>`, você pode ver um destes rótulos:

| Sinal                      | Significado                                                  |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | A configuração é analisada corretamente e os plugins são resolvidos |
| **compatibility advisory** | O plugin usa um padrão compatível, mas mais antigo (por exemplo, `hook-only`) |
| **legacy warning**         | O plugin usa `before_agent_start`, que está obsoleto         |
| **hard error**             | A configuração é inválida ou o plugin falhou ao carregar     |

Nem `hook-only` nem `before_agent_start` quebrarão seu plugin hoje: `hook-only` é consultivo, e `before_agent_start` apenas dispara um aviso. Esses sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

<Steps>
  <Step title="Manifesto + descoberta">
    O OpenClaw encontra plugins candidatos em caminhos configurados, raízes de workspace, raízes globais de plugins e plugins empacotados. A descoberta lê primeiro manifestos nativos `openclaw.plugin.json` e manifestos de pacote compatíveis.
  </Step>
  <Step title="Habilitação + validação">
    O core decide se um plugin descoberto está habilitado, desabilitado, bloqueado ou selecionado para um slot exclusivo, como memória.
  </Step>
  <Step title="Carregamento em runtime">
    Plugins nativos do OpenClaw são carregados no processo via jiti e registram capacidades em um registro central. Pacotes compatíveis são normalizados em registros sem importar código de runtime.
  </Step>
  <Step title="Consumo de superfícies">
    O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração de provedores, hooks, rotas HTTP, comandos CLI e serviços.
  </Step>
</Steps>

Especificamente para a CLI de plugins, a descoberta de comandos raiz é dividida em duas fases:

- metadados em tempo de análise vêm de `registerCli(..., { descriptors: [...] })`
- o módulo CLI real do plugin pode permanecer lazy e ser registrado na primeira invocação

Isso mantém o código CLI de propriedade do plugin dentro do plugin, ao mesmo tempo que permite que o OpenClaw reserve nomes de comandos raiz antes da análise.

O limite importante de design:

- a validação de manifesto/configuração deve funcionar a partir de **metadados de manifesto/esquema** sem executar código do plugin
- a descoberta de capacidades nativas pode carregar código de entrada de plugins confiáveis para construir um snapshot de registro sem ativação
- o comportamento nativo em runtime vem do caminho `register(api)` do módulo do plugin com `api.registrationMode === "full"`

Essa separação permite que o OpenClaw valide a configuração, explique plugins ausentes/desabilitados e crie dicas de UI/esquema antes que o runtime completo esteja ativo.

### Snapshot de metadados de plugin e tabela de consulta

A inicialização do Gateway cria um `PluginMetadataSnapshot` para o snapshot de configuração atual. O snapshot contém apenas metadados: ele armazena o índice de plugins instalados, o registro de manifestos, diagnósticos de manifestos, mapas de proprietário, um normalizador de id de plugin e registros de manifesto. Ele não contém módulos de plugin carregados, SDKs de provedor, conteúdo de pacotes ou exportações de runtime.

Validação de configuração ciente de plugins, auto-habilitação na inicialização e bootstrap de plugins do Gateway consomem esse snapshot em vez de reconstruir metadados de manifesto/índice independentemente. `PluginLookUpTable` é derivado do mesmo snapshot e adiciona o plano de plugins de inicialização para a configuração de runtime atual.

Após a inicialização, o Gateway mantém o snapshot de metadados atual como um produto de runtime substituível. A descoberta repetida de provedores em runtime pode usar esse snapshot em vez de reconstruir o índice instalado e o registro de manifestos para cada passagem do catálogo de provedores. O snapshot é limpo ou substituído no encerramento do Gateway, em alterações de configuração/inventário de plugins e em gravações do índice instalado; chamadores recorrem ao caminho frio de manifesto/índice quando não existe um snapshot atual compatível. Verificações de compatibilidade devem incluir raízes de descoberta de plugins, como `plugins.load.paths` e o workspace padrão do agente, porque plugins de workspace fazem parte do escopo de metadados.

O snapshot e a tabela de consulta mantêm decisões repetidas de inicialização no caminho rápido:

- propriedade de canal
- inicialização adiada de canal
- ids de plugins de inicialização
- propriedade de provedor e backend CLI
- configuração de provedor, alias de comando, provedor de catálogo de modelos e propriedade de contrato de manifesto
- validação de esquema de configuração de plugin e esquema de configuração de canal
- decisões de auto-habilitação na inicialização

O limite de segurança é a substituição do snapshot, não a mutação. Reconstrua o snapshot quando a configuração, o inventário de plugins, os registros de instalação ou a política de índice persistido mudarem. Não o trate como um registro global amplo e mutável, e não mantenha snapshots históricos ilimitados. O carregamento de plugins em runtime permanece separado de snapshots de metadados, para que estado obsoleto de runtime não possa ficar escondido atrás de um cache de metadados.

A regra de cache está documentada em [Internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals#plugin-cache-boundary): metadados de manifesto e descoberta estão frescos, a menos que um chamador detenha um snapshot explícito, uma tabela de consulta ou um registro de manifestos para o fluxo atual. Caches ocultos de metadados e TTLs baseados em relógio de parede não fazem parte do carregamento de plugins. Apenas caches de carregador de runtime, módulos e artefatos de dependência podem persistir depois que código ou artefatos instalados são realmente carregados.

Alguns chamadores de caminho frio ainda reconstroem registros de manifestos diretamente a partir do índice persistido de plugins instalados, em vez de receber uma `PluginLookUpTable` do Gateway. Esse caminho agora reconstrói o registro sob demanda; prefira passar a tabela de consulta atual ou um registro de manifestos explícito pelos fluxos de runtime quando um chamador já tiver um.

### Planejamento de ativação

O planejamento de ativação faz parte do plano de controle. Chamadores podem perguntar quais plugins são relevantes para um comando, provedor, canal, rota, harness de agente ou capacidade concreta antes de carregar registros de runtime mais amplos.

O planejador mantém compatível o comportamento atual de manifesto:

- campos `activation.*` são dicas explícitas do planejador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hooks permanecem como fallback de propriedade do manifesto
- a API do planejador apenas com ids permanece disponível para chamadores existentes
- a API de plano relata rótulos de motivo para que diagnósticos consigam distinguir dicas explícitas de fallback de propriedade

<Warning>
Não trate `activation` como um hook de ciclo de vida ou um substituto para `register(...)`. Ele é um metadado usado para restringir o carregamento. Prefira campos de propriedade quando eles já descreverem a relação; use `activation` apenas para dicas extras do planejador.
</Warning>

### Plugins de canal e a ferramenta de mensagem compartilhada

Plugins de canal não precisam registrar uma ferramenta separada de envio/edição/reação para ações normais de chat. O OpenClaw mantém uma ferramenta `message` compartilhada no núcleo, e os plugins de canal são responsáveis pela descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o núcleo é responsável pelo host da ferramenta `message` compartilhada, pela conexão com o prompt, pela contabilidade de sessão/thread e pelo despacho de execução
- os plugins de canal são responsáveis pela descoberta de ações com escopo, pela descoberta de capacidades e por quaisquer fragmentos de esquema específicos do canal
- os plugins de canal são responsáveis pela gramática de conversa de sessão específica do provedor, como o modo como ids de conversa codificam ids de thread ou herdam de conversas pai
- os plugins de canal executam a ação final por meio de seu adaptador de ação

Para plugins de canal, a superfície do SDK é `ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada de descoberta unificada permite que um plugin retorne suas ações visíveis, capacidades e contribuições de esquema em conjunto, para que essas peças não se desviem umas das outras.

Quando um parâmetro da ferramenta de mensagem específico do canal carrega uma origem de mídia, como um caminho local ou URL de mídia remota, o plugin também deve retornar `mediaSourceParams` de `describeMessageTool(...)`. O núcleo usa essa lista explícita para aplicar normalização de caminho de sandbox e dicas de acesso de mídia de saída sem codificar nomes de parâmetros pertencentes ao plugin. Prefira mapas com escopo por ação ali, não uma lista plana para todo o canal, para que um parâmetro de mídia exclusivo de perfil não seja normalizado em ações não relacionadas, como `send`.

O núcleo passa o escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` confiável de entrada

Isso é importante para plugins sensíveis ao contexto. Um canal pode ocultar ou expor ações de mensagem com base na conta ativa, sala/thread/mensagem atual ou identidade confiável do solicitante, sem codificar ramificações específicas de canal na ferramenta `message` do núcleo.

É por isso que mudanças de roteamento do executor embutido ainda são trabalho do plugin: o executor é responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta do plugin, para que a ferramenta `message` compartilhada exponha a superfície correta pertencente ao canal para o turno atual.

Para helpers de execução pertencentes ao canal, os plugins incluídos devem manter o runtime de execução dentro de seus próprios módulos de extensão. O núcleo não é mais responsável pelos runtimes de ação de mensagem do Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`. Não publicamos subcaminhos `plugin-sdk/*-action-runtime` separados, e plugins incluídos devem importar seu próprio código de runtime local diretamente de seus módulos pertencentes à extensão.

O mesmo limite se aplica a seams do SDK nomeadas por provedor em geral: o núcleo não deve importar barrels de conveniência específicos de canal para Slack, Discord, Signal, WhatsApp ou extensões semelhantes. Se o núcleo precisar de um comportamento, consuma o barrel `api.ts` / `runtime-api.ts` do próprio plugin incluído ou promova a necessidade para uma capacidade genérica estreita no SDK compartilhado.

Plugins incluídos seguem a mesma regra. O `runtime-api.ts` de um plugin incluído não deve reexportar sua própria fachada marcada `openclaw/plugin-sdk/<plugin-id>`. Essas fachadas marcadas continuam sendo shims de compatibilidade para plugins externos e consumidores antigos, mas plugins incluídos devem usar exportações locais mais subcaminhos genéricos estreitos do SDK, como `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` ou `openclaw/plugin-sdk/webhook-ingress`. Código novo não deve adicionar fachadas do SDK específicas de id de plugin, a menos que o limite de compatibilidade para um ecossistema externo existente exija isso.

Para enquetes especificamente, há dois caminhos de execução:

- `outbound.sendPoll` é a base compartilhada para canais que se encaixam no modelo comum de enquete
- `actions.handleAction("poll")` é o caminho preferido para semântica de enquete específica de canal ou parâmetros extras de enquete

O núcleo agora adia o parsing compartilhado de enquetes até depois que o despacho de enquete do plugin recusa a ação, para que handlers de enquete pertencentes ao plugin possam aceitar campos de enquete específicos do canal sem serem bloqueados primeiro pelo parser genérico de enquete.

Consulte [internos da arquitetura de Plugins](/pt-BR/plugins/architecture-internals) para a sequência completa de inicialização.

## Modelo de propriedade de capacidades

O OpenClaw trata um plugin nativo como o limite de propriedade de uma **empresa** ou de um **recurso**, não como um conjunto aleatório de integrações não relacionadas.

Isso significa:

- um plugin de empresa geralmente deve ser responsável por todas as superfícies dessa empresa voltadas ao OpenClaw
- um plugin de recurso geralmente deve ser responsável por toda a superfície do recurso que ele introduz
- canais devem consumir capacidades compartilhadas do núcleo em vez de reimplementar comportamento de provedor de forma ad hoc

<AccordionGroup>
  <Accordion title="Multicapacidade de fornecedor">
    `openai` é responsável por inferência de texto, fala, voz em tempo real, entendimento de mídia e geração de imagem. `google` é responsável por inferência de texto mais entendimento de mídia, geração de imagem e pesquisa na web. `qwen` é responsável por inferência de texto mais entendimento de mídia e geração de vídeo.
  </Accordion>
  <Accordion title="Capacidade única de fornecedor">
    `elevenlabs` e `microsoft` são responsáveis por fala; `firecrawl` é responsável por busca na web; `minimax` / `mistral` / `moonshot` / `zai` são responsáveis por backends de entendimento de mídia.
  </Accordion>
  <Accordion title="Plugin de recurso">
    `voice-call` é responsável por transporte de chamada, ferramentas, CLI, rotas e ponte de media-stream do Twilio, mas consome capacidades compartilhadas de fala, transcrição em tempo real e voz em tempo real em vez de importar plugins de fornecedor diretamente.
  </Accordion>
</AccordionGroup>

O estado final pretendido é:

- OpenAI fica em um plugin mesmo que abranja modelos de texto, fala, imagens e vídeos futuros
- outro fornecedor pode fazer o mesmo para sua própria superfície
- canais não se importam com qual plugin de fornecedor é responsável pelo provedor; eles consomem o contrato de capacidade compartilhado exposto pelo núcleo

Esta é a distinção principal:

- **plugin** = limite de propriedade
- **capacidade** = contrato do núcleo que vários plugins podem implementar ou consumir

Então, se o OpenClaw adicionar um novo domínio, como vídeo, a primeira pergunta não é "qual provedor deve codificar diretamente o tratamento de vídeo?" A primeira pergunta é "qual é o contrato de capacidade de vídeo do núcleo?" Depois que esse contrato existe, plugins de fornecedor podem se registrar nele e plugins de canal/recurso podem consumi-lo.

Se a capacidade ainda não existir, o movimento correto geralmente é:

<Steps>
  <Step title="Definir a capacidade">
    Defina a capacidade ausente no núcleo.
  </Step>
  <Step title="Expor pelo SDK">
    Exponha-a pela API/runtime do plugin de forma tipada.
  </Step>
  <Step title="Conectar consumidores">
    Conecte canais/recursos a essa capacidade.
  </Step>
  <Step title="Implementações de fornecedor">
    Permita que plugins de fornecedor registrem implementações.
  </Step>
</Steps>

Isso mantém a propriedade explícita enquanto evita comportamento do núcleo que depende de um único fornecedor ou de um caminho de código específico de plugin pontual.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código pertence:

<Tabs>
  <Tab title="Camada de capacidade do núcleo">
    Orquestração compartilhada, política, fallback, regras de mesclagem de configuração, semântica de entrega e contratos tipados.
  </Tab>
  <Tab title="Camada de plugin de fornecedor">
    APIs específicas de fornecedor, autenticação, catálogos de modelo, síntese de fala, geração de imagem, backends futuros de vídeo, endpoints de uso.
  </Tab>
  <Tab title="Camada de plugin de canal/recurso">
    Integração Slack/Discord/voice-call/etc. que consome capacidades do núcleo e as apresenta em uma superfície.
  </Tab>
</Tabs>

Por exemplo, TTS segue este formato:

- o núcleo é responsável pela política de TTS no momento da resposta, ordem de fallback, preferências e entrega por canal
- `openai`, `elevenlabs` e `microsoft` são responsáveis pelas implementações de síntese
- `voice-call` consome o helper de runtime de TTS de telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de plugin de empresa multicapacidade

Um plugin de empresa deve parecer coeso visto de fora. Se o OpenClaw tiver contratos compartilhados para modelos, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração de imagem, geração de vídeo, busca na web e pesquisa na web, um fornecedor pode ser responsável por todas as suas superfícies em um só lugar:

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

O que importa não são os nomes exatos dos helpers. O formato importa:

- um plugin é responsável pela superfície do fornecedor
- o núcleo ainda é responsável pelos contratos de capacidade
- canais e plugins de recurso consomem helpers `api.runtime.*`, não código de fornecedor
- testes de contrato podem afirmar que o plugin registrou as capacidades das quais afirma ser responsável

### Exemplo de capacidade: entendimento de vídeo

O OpenClaw já trata entendimento de imagem/áudio/vídeo como uma capacidade compartilhada. O mesmo modelo de propriedade se aplica ali:

<Steps>
  <Step title="O núcleo define o contrato">
    O núcleo define o contrato de entendimento de mídia.
  </Step>
  <Step title="Plugins de fornecedor se registram">
    Plugins de fornecedor registram `describeImage`, `transcribeAudio` e `describeVideo` conforme aplicável.
  </Step>
  <Step title="Consumidores usam o comportamento compartilhado">
    Canais e plugins de recurso consomem o comportamento compartilhado do núcleo em vez de se conectar diretamente ao código de fornecedor.
  </Step>
</Steps>

Isso evita embutir as suposições de vídeo de um provedor no núcleo. O plugin é responsável pela superfície do fornecedor; o núcleo é responsável pelo contrato de capacidade e pelo comportamento de fallback.

Geração de vídeo já usa a mesma sequência: o núcleo é responsável pelo contrato de capacidade tipado e pelo helper de runtime, e plugins de fornecedor registram implementações `api.registerVideoGenerationProvider(...)` nele.

Precisa de uma checklist de implantação concreta? Consulte [Cookbook de capacidades](/pt-BR/plugins/architecture).

## Contratos e aplicação

A superfície da API de plugin é intencionalmente tipada e centralizada em `OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e os helpers de runtime dos quais um plugin pode depender.

Por que isso importa:

- autores de plugin recebem um padrão interno estável único
- o núcleo pode rejeitar propriedade duplicada, como dois plugins registrando o mesmo id de provedor
- a inicialização pode apresentar diagnósticos acionáveis para registro malformado
- testes de contrato podem aplicar a propriedade de plugins incluídos e prevenir desvios silenciosos

Há duas camadas de aplicação:

<AccordionGroup>
  <Accordion title="Aplicação do registro em tempo de execução">
    O registro de plugins valida os registros conforme os plugins são carregados. Exemplos: ids de provedores duplicados, ids de provedores de fala duplicados e registros malformados produzem diagnósticos de plugin em vez de comportamento indefinido.
  </Accordion>
  <Accordion title="Testes de contrato">
    Plugins empacotados são capturados em registros de contrato durante execuções de teste para que o OpenClaw possa afirmar a propriedade explicitamente. Hoje, isso é usado para provedores de modelo, provedores de fala, provedores de pesquisa na web e propriedade de registros empacotados.
  </Accordion>
</AccordionGroup>

O efeito prático é que o OpenClaw sabe, de antemão, qual plugin possui qual superfície. Isso permite que o núcleo e os canais se componham de forma fluida, porque a propriedade é declarada, tipada e testável, em vez de implícita.

### O que pertence a um contrato

<Tabs>
  <Tab title="Bons contratos">
    - tipados
    - pequenos
    - específicos de capacidade
    - pertencentes ao núcleo
    - reutilizáveis por vários plugins
    - consumíveis por canais/recursos sem conhecimento do fornecedor

  </Tab>
  <Tab title="Contratos ruins">
    - política específica do fornecedor oculta no núcleo
    - escapes pontuais de plugin que contornam o registro
    - código de canal acessando diretamente uma implementação de fornecedor
    - objetos de tempo de execução ad hoc que não fazem parte de `OpenClawPluginApi` ou `api.runtime`

  </Tab>
</Tabs>

Em caso de dúvida, eleve o nível de abstração: defina primeiro a capacidade e depois deixe os plugins se conectarem a ela.

## Modelo de execução

Plugins nativos do OpenClaw são executados **no mesmo processo** do Gateway. Eles não são isolados em sandbox. Um plugin nativo carregado tem o mesmo limite de confiança em nível de processo que o código do núcleo.

<Warning>
Implicações de plugins nativos: um plugin pode registrar ferramentas, manipuladores de rede, hooks e serviços; um bug de plugin pode travar ou desestabilizar o Gateway; e um plugin nativo malicioso é equivalente à execução arbitrária de código dentro do processo do OpenClaw.
</Warning>

Pacotes compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente Skills empacotadas.

Use listas de permissão e caminhos explícitos de instalação/carregamento para plugins não empacotados. Trate plugins de workspace como código de tempo de desenvolvimento, não como padrões de produção.

Para nomes de pacotes de workspace empacotados, mantenha o id do plugin ancorado no nome npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado, como `-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding`, quando o pacote expõe intencionalmente um papel de plugin mais restrito.

<Note>
**Nota de confiança:** `plugins.allow` confia em **ids de plugin**, não na procedência da origem. Um plugin de workspace com o mesmo id de um plugin empacotado sombreia intencionalmente a cópia empacotada quando esse plugin de workspace está habilitado/permitido. Isso é normal e útil para desenvolvimento local, testes de patches e hotfixes. A confiança de plugins empacotados é resolvida a partir do snapshot de origem — o manifesto e o código em disco no momento do carregamento — em vez dos metadados de instalação. Um registro de instalação corrompido ou substituído não pode ampliar silenciosamente a superfície de confiança de um plugin empacotado além do que a origem real declara.
</Note>

## Limite de exportação

O OpenClaw exporta capacidades, não conveniência de implementação.

Mantenha público o registro de capacidades. Remova exportações auxiliares que não sejam de contrato:

- subcaminhos auxiliares específicos de plugins empacotados
- subcaminhos de encanamento de tempo de execução que não se destinam a ser API pública
- auxiliares de conveniência específicos de fornecedores
- auxiliares de configuração/onboarding que são detalhes de implementação

Subcaminhos auxiliares reservados de plugins empacotados foram removidos do mapa de exportação gerado do SDK. Mantenha auxiliares específicos do proprietário dentro do pacote do plugin proprietário; promova apenas comportamento reutilizável do host para contratos genéricos do SDK, como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

## Componentes internos e referência

Para o pipeline de carregamento, modelo de registro, hooks de tempo de execução de provedores, rotas HTTP do Gateway, esquemas de ferramentas de mensagens, resolução de destino de canal, catálogos de provedores, plugins do mecanismo de contexto e o guia para adicionar uma nova capacidade, consulte [Componentes internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals).

## Relacionados

- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Manifesto de plugin](/pt-BR/plugins/manifest)
- [Configuração do SDK de plugins](/pt-BR/plugins/sdk-setup)
