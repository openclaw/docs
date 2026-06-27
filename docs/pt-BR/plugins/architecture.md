---
read_when:
    - Criando ou depurando plugins nativos do OpenClaw
    - Entender o modelo de capacidades de Plugin ou os limites de propriedade
    - Trabalhando no pipeline de carregamento de Plugin ou no registro
    - Implementando hooks de runtime de provedor ou plugins de canal
sidebarTitle: Internals
summary: 'Plugin internos: modelo de capacidade, propriedade, contratos, pipeline de carregamento e auxiliares de runtime'
title: Internos do Plugin
x-i18n:
    generated_at: "2026-06-27T17:44:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

Esta é a **referência de arquitetura profunda** para o sistema de plugins do OpenClaw. Para guias práticos, comece com uma das páginas focadas abaixo.

<CardGroup cols={2}>
  <Card title="Instalar e usar plugins" icon="plug" href="/pt-BR/tools/plugin">
    Guia para usuários finais sobre como adicionar, habilitar e solucionar problemas de plugins.
  </Card>
  <Card title="Criar plugins" icon="rocket" href="/pt-BR/plugins/building-plugins">
    Tutorial do primeiro plugin com o menor manifesto funcional.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um plugin de canal de mensagens.
  </Card>
  <Card title="Plugins de provedor" icon="microchip" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um plugin de provedor de modelos.
  </Card>
  <Card title="Visão geral do SDK" icon="book" href="/pt-BR/plugins/sdk-overview">
    Referência do mapa de importação e da API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

Capacidades são o modelo público de **plugin nativo** dentro do OpenClaw. Todo plugin nativo do OpenClaw se registra em um ou mais tipos de capacidade:

| Capacidade             | Método de registro                              | Plugins de exemplo                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferência de texto         | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferência CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Embeddings             | `api.registerEmbeddingProvider(...)`             | Plugins vetoriais de propriedade do provedor        |
| Fala                 | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voz em tempo real         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Compreensão de mídia    | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Fonte de transcrições     | `api.registerTranscriptSourceProvider(...)`      | `discord`                            |
| Geração de imagem       | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Geração de música       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Busca web              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pesquisa web             | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensagens    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Descoberta de Gateway      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Um plugin que registra zero capacidades, mas fornece hooks, ferramentas, serviços de descoberta ou serviços em segundo plano, é um plugin **legado somente de hooks**. Esse padrão ainda é totalmente compatível.
</Note>

### Postura de compatibilidade externa

O modelo de capacidades já está implementado no core e é usado por plugins empacotados/nativos hoje, mas a compatibilidade de plugins externos ainda precisa de um critério mais rigoroso do que "está exportado, portanto está congelado".

| Situação do plugin                                  | Orientação                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                         | Mantenha integrações baseadas em hooks funcionando; esta é a linha de base de compatibilidade.                        |
| Novos plugins empacotados/nativos                        | Prefira registro explícito de capacidades em vez de acessos específicos de fornecedor ou novos designs somente de hooks. |
| Plugins externos adotando registro de capacidades | Permitido, mas trate superfícies auxiliares específicas de capacidade como em evolução, a menos que a documentação as marque como estáveis. |

O registro de capacidades é a direção pretendida. Hooks legados continuam sendo o caminho mais seguro sem quebras para plugins externos durante a transição. Subcaminhos auxiliares exportados não são todos iguais — prefira contratos estreitos e documentados em vez de exports auxiliares incidentais.

### Formatos de plugin

O OpenClaw classifica todo plugin carregado em um formato com base em seu comportamento real de registro (não apenas em metadados estáticos):

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
    Registra ferramentas, comandos, serviços ou rotas, mas sem capacidades.
  </Accordion>
</AccordionGroup>

Use `openclaw plugins inspect <id>` para ver o formato e a decomposição de capacidades de um plugin. Consulte a [referência da CLI](/pt-BR/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como um caminho de compatibilidade para plugins somente de hooks. Plugins legados reais ainda dependem dele.

Direção:

- mantê-lo funcionando
- documentá-lo como legado
- preferir `before_model_resolve` para trabalho de substituição de modelo/provedor
- preferir `before_prompt_build` para trabalho de mutação de prompt
- remover somente depois que o uso real cair e a cobertura de fixtures provar a segurança da migração

### Sinais de compatibilidade

Ao executar `openclaw doctor` ou `openclaw plugins inspect <id>`, você pode ver um destes rótulos:

| Sinal                     | Significado                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config válido**           | A configuração é analisada corretamente e os plugins são resolvidos                       |
| **aviso de compatibilidade** | O plugin usa um padrão compatível, mas mais antigo (por exemplo, `hook-only`) |
| **aviso legado**         | O plugin usa `before_agent_start`, que está obsoleto        |
| **erro crítico**             | A configuração é inválida ou o plugin falhou ao carregar                   |

Nem `hook-only` nem `before_agent_start` quebrarão seu plugin hoje: `hook-only` é consultivo, e `before_agent_start` apenas aciona um aviso. Esses sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

<Steps>
  <Step title="Manifesto + descoberta">
    O OpenClaw encontra plugins candidatos a partir de caminhos configurados, raízes de workspace, raízes globais de plugins e plugins empacotados. A descoberta lê primeiro manifestos nativos `openclaw.plugin.json` e manifestos de bundle compatíveis.
  </Step>
  <Step title="Habilitação + validação">
    O core decide se um plugin descoberto está habilitado, desabilitado, bloqueado ou selecionado para um slot exclusivo, como memória.
  </Step>
  <Step title="Carregamento em runtime">
    Plugins nativos do OpenClaw são carregados no processo e registram capacidades em um registro central. JavaScript empacotado carrega por `require` nativo; TypeScript de código-fonte local de terceiros é o fallback emergencial via Jiti. Bundles compatíveis são normalizados em registros do registro sem importar código de runtime.
  </Step>
  <Step title="Consumo de superfície">
    O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração de provedores, hooks, rotas HTTP, comandos CLI e serviços.
  </Step>
</Steps>

Especificamente para a CLI de plugins, a descoberta de comandos raiz é dividida em duas fases:

- metadados em tempo de análise vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do plugin pode permanecer lazy e registrar no primeiro uso

Isso mantém o código CLI pertencente ao plugin dentro do plugin, ao mesmo tempo em que ainda permite ao OpenClaw reservar nomes de comandos raiz antes da análise.

O limite de design importante:

- a validação de manifesto/configuração deve funcionar a partir de **metadados de manifesto/schema** sem executar código do plugin
- a descoberta de capacidades nativas pode carregar código de entrada de plugin confiável para construir um snapshot de registro sem ativação
- o comportamento nativo em runtime vem do caminho `register(api)` do módulo do plugin com `api.registrationMode === "full"`

Essa separação permite que o OpenClaw valide configuração, explique plugins ausentes/desabilitados e construa dicas de UI/schema antes que o runtime completo esteja ativo.

### Snapshot de metadados de plugin e tabela de lookup

A inicialização do Gateway constrói um `PluginMetadataSnapshot` para o snapshot de configuração atual. O snapshot contém apenas metadados: ele armazena o índice de plugins instalados, registro de manifestos, diagnósticos de manifesto, mapas de proprietários, um normalizador de id de plugin e registros de manifesto. Ele não contém módulos de plugin carregados, SDKs de provedores, conteúdo de pacotes ou exports de runtime.

A validação de configuração ciente de plugins, a habilitação automática na inicialização e o bootstrap de plugins do Gateway consomem esse snapshot em vez de reconstruírem metadados de manifesto/índice independentemente. `PluginLookUpTable` é derivada do mesmo snapshot e adiciona o plano de plugins de inicialização para a configuração de runtime atual.

Após a inicialização, o Gateway mantém o snapshot de metadados atual como um produto de runtime substituível. Descobertas repetidas de provedores em runtime podem aproveitar esse snapshot em vez de reconstruir o índice instalado e o registro de manifestos para cada passagem do catálogo de provedores. O snapshot é limpo ou substituído no encerramento do Gateway, em mudanças de configuração/inventário de plugins e em gravações do índice instalado; chamadores recorrem ao caminho frio de manifesto/índice quando não existe um snapshot atual compatível. As verificações de compatibilidade devem incluir raízes de descoberta de plugins, como `plugins.load.paths` e o workspace padrão do agente, porque plugins de workspace fazem parte do escopo dos metadados.

O snapshot e a tabela de lookup mantêm decisões repetidas de inicialização no caminho rápido:

- propriedade de canal
- inicialização adiada de canal
- ids de plugins de inicialização
- propriedade de provedor e backend CLI
- propriedade de provedor de configuração, alias de comando, provedor de catálogo de modelos e contrato de manifesto
- validação de schema de configuração de plugin e schema de configuração de canal
- decisões de habilitação automática na inicialização

O limite de segurança é a substituição do snapshot, não a mutação. Reconstrua o snapshot quando configuração, inventário de plugins, registros de instalação ou política de índice persistido mudarem. Não o trate como um registro global mutável amplo e não mantenha snapshots históricos sem limite. O carregamento de plugins em runtime permanece separado de snapshots de metadados, para que estado de runtime obsoleto não possa ficar oculto atrás de um cache de metadados.

A regra de cache está documentada em [Internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals#plugin-cache-boundary): metadados de manifesto e descoberta são frescos, a menos que um chamador mantenha um snapshot explícito, tabela de lookup ou registro de manifestos para o fluxo atual. Caches de metadados ocultos e TTLs baseados em relógio não fazem parte do carregamento de plugins. Somente caches de carregador de runtime, módulo e artefato de dependência podem persistir depois que código ou artefatos instalados são realmente carregados.

Alguns chamadores de caminho frio ainda reconstroem registros de manifesto diretamente a partir do índice persistido de plugins instalados, em vez de receber uma `PluginLookUpTable` do Gateway. Esse caminho agora reconstrói o registro sob demanda; prefira passar a tabela de lookup atual ou um registro de manifestos explícito pelos fluxos de runtime quando um chamador já tiver um.

### Planejamento de ativação

O planejamento de ativação faz parte do plano de controle. Chamadores podem perguntar quais plugins são relevantes para um comando, provedor, canal, rota, harness de agente ou capacidade concreta antes de carregar registros de runtime mais amplos.

O planejador mantém o comportamento atual de manifesto compatível:

- Os campos `activation.*` são dicas explícitas para o planejador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hooks continuam sendo o fallback de propriedade do manifesto
- a API do planejador somente com ids continua disponível para chamadores existentes
- a API de plano relata rótulos de motivo para que diagnósticos possam distinguir dicas explícitas do fallback de propriedade

<Warning>
Não trate `activation` como um hook de ciclo de vida nem como substituto para `register(...)`. É metadado usado para restringir o carregamento. Prefira campos de propriedade quando eles já descrevem a relação; use `activation` apenas para dicas extras ao planejador.
</Warning>

### Plugins de canal e a ferramenta de mensagem compartilhada

Plugins de canal não precisam registrar uma ferramenta separada de envio/edição/reação para ações normais de chat. O OpenClaw mantém uma única ferramenta `message` compartilhada no core, e os plugins de canal são responsáveis pela descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o core é responsável pelo host da ferramenta `message` compartilhada, pela conexão com o prompt, pela contabilidade de sessão/thread e pelo dispatch de execução
- plugins de canal são responsáveis pela descoberta de ações com escopo, pela descoberta de capacidades e por quaisquer fragmentos de schema específicos do canal
- plugins de canal são responsáveis pela gramática de conversas de sessão específica do provedor, como a forma como ids de conversa codificam ids de thread ou herdam de conversas pai
- plugins de canal executam a ação final por meio de seu adaptador de ações

Para plugins de canal, a superfície do SDK é `ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada de descoberta unificada permite que um plugin retorne suas ações visíveis, capacidades e contribuições de schema em conjunto, para que essas partes não se desalinhem.

Quando um parâmetro da ferramenta de mensagem específico do canal carrega uma fonte de mídia, como um caminho local ou URL de mídia remota, o plugin também deve retornar `mediaSourceParams` de `describeMessageTool(...)`. O core usa essa lista explícita para aplicar normalização de caminho de sandbox e dicas de acesso a mídia de saída sem hardcodar nomes de parâmetros pertencentes ao plugin. Prefira mapas com escopo de ação ali, não uma lista plana para o canal inteiro, para que um parâmetro de mídia somente de perfil não seja normalizado em ações não relacionadas, como `send`.

O core passa o escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` de entrada confiável

Isso importa para plugins sensíveis a contexto. Um canal pode ocultar ou expor ações de mensagem com base na conta ativa, na sala/thread/mensagem atual ou na identidade confiável do solicitante sem hardcodar ramificações específicas do canal na ferramenta `message` do core.

É por isso que mudanças de roteamento do runner embutido ainda são trabalho de plugin: o runner é responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta do plugin, para que a ferramenta `message` compartilhada exponha a superfície correta pertencente ao canal para o turno atual.

Para auxiliares de execução pertencentes ao canal, plugins agrupados devem manter o runtime de execução dentro de seus próprios módulos de extensão. O core não é mais responsável pelos runtimes de ações de mensagem do Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`. Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e plugins agrupados devem importar seu próprio código de runtime local diretamente de seus módulos pertencentes à extensão.

O mesmo limite se aplica a interfaces do SDK nomeadas por provedor em geral: o core não deve importar barrels de conveniência específicos de canal para Slack, Discord, Signal, WhatsApp ou extensões semelhantes. Se o core precisar de um comportamento, consuma o próprio barrel `api.ts` / `runtime-api.ts` do plugin agrupado ou promova a necessidade para uma capacidade genérica estreita no SDK compartilhado.

Plugins agrupados seguem a mesma regra. O `runtime-api.ts` de um plugin agrupado não deve reexportar sua própria fachada de marca `openclaw/plugin-sdk/<plugin-id>`. Essas fachadas de marca continuam sendo shims de compatibilidade para plugins externos e consumidores mais antigos, mas plugins agrupados devem usar exportações locais mais subcaminhos genéricos estreitos do SDK, como `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` ou `openclaw/plugin-sdk/webhook-ingress`. Código novo não deve adicionar fachadas do SDK específicas de plugin-id, a menos que o limite de compatibilidade para um ecossistema externo existente exija isso.

Para enquetes especificamente, há dois caminhos de execução:

- `outbound.sendPoll` é a base compartilhada para canais que se encaixam no modelo comum de enquete
- `actions.handleAction("poll")` é o caminho preferido para semântica de enquete específica do canal ou parâmetros extras de enquete

O core agora adia o parsing compartilhado de enquetes até depois que o dispatch de enquete do plugin recusa a ação, para que handlers de enquete pertencentes ao plugin possam aceitar campos de enquete específicos do canal sem serem bloqueados primeiro pelo parser genérico de enquetes.

Veja [internos da arquitetura de Plugin](/pt-BR/plugins/architecture-internals) para a sequência completa de inicialização.

## Modelo de propriedade de capacidade

O OpenClaw trata um Plugin nativo como o limite de propriedade para uma **empresa** ou um **recurso**, não como um conjunto avulso de integrações sem relação.

Isso significa:

- um Plugin de empresa normalmente deve ser responsável por todas as superfícies dessa empresa voltadas para o OpenClaw
- um Plugin de recurso normalmente deve ser responsável por toda a superfície do recurso que ele introduz
- canais devem consumir capacidades compartilhadas do core em vez de reimplementar comportamento de provedor ad hoc

<AccordionGroup>
  <Accordion title="Várias capacidades de fornecedor">
    `openai` é responsável por inferência de texto, fala, voz em tempo real, compreensão de mídia e geração de imagens. `google` é responsável por inferência de texto mais compreensão de mídia, geração de imagens e busca na web. `qwen` é responsável por inferência de texto mais compreensão de mídia e geração de vídeo.
  </Accordion>
  <Accordion title="Capacidade única de fornecedor">
    `elevenlabs` e `microsoft` são responsáveis por fala; `firecrawl` é responsável por web-fetch; `minimax` / `mistral` / `moonshot` / `zai` são responsáveis por backends de compreensão de mídia.
  </Accordion>
  <Accordion title="Plugin de recurso">
    `voice-call` é responsável pelo transporte de chamadas, ferramentas, CLI, rotas e ponte de media-stream do Twilio, mas consome capacidades compartilhadas de fala, transcrição em tempo real e voz em tempo real em vez de importar plugins de fornecedores diretamente.
  </Accordion>
</AccordionGroup>

O estado final pretendido é:

- OpenAI fica em um único Plugin, mesmo que abranja modelos de texto, fala, imagens e vídeo futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual Plugin de fornecedor possui o provedor; eles consomem o contrato de capacidade compartilhado exposto pelo core

Esta é a distinção principal:

- **Plugin** = limite de propriedade
- **capacidade** = contrato do core que vários plugins podem implementar ou consumir

Então, se o OpenClaw adicionar um novo domínio, como vídeo, a primeira pergunta não é "qual provedor deve hardcodar o tratamento de vídeo?" A primeira pergunta é "qual é o contrato de capacidade de vídeo do core?" Depois que esse contrato existe, plugins de fornecedores podem se registrar nele e plugins de canal/recurso podem consumi-lo.

Se a capacidade ainda não existir, o movimento certo geralmente é:

<Steps>
  <Step title="Definir a capacidade">
    Defina a capacidade ausente no core.
  </Step>
  <Step title="Expor pelo SDK">
    Exponha-a pela API/runtime de plugin de forma tipada.
  </Step>
  <Step title="Conectar consumidores">
    Conecte canais/recursos a essa capacidade.
  </Step>
  <Step title="Implementações de fornecedores">
    Permita que plugins de fornecedores registrem implementações.
  </Step>
</Steps>

Isso mantém a propriedade explícita enquanto evita comportamento do core que dependa de um único fornecedor ou de um caminho de código específico de plugin pontual.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código pertence:

<Tabs>
  <Tab title="Camada de capacidade do core">
    Orquestração compartilhada, política, fallback, regras de mesclagem de configuração, semântica de entrega e contratos tipados.
  </Tab>
  <Tab title="Camada de Plugin de fornecedor">
    APIs específicas do fornecedor, autenticação, catálogos de modelos, síntese de fala, geração de imagens, backends futuros de vídeo, endpoints de uso.
  </Tab>
  <Tab title="Camada de Plugin de canal/recurso">
    Integração com Slack/Discord/voice-call/etc. que consome capacidades do core e as apresenta em uma superfície.
  </Tab>
</Tabs>

Por exemplo, TTS segue este formato:

- o core é responsável pela política de TTS no momento da resposta, ordem de fallback, preferências e entrega por canal
- `openai`, `elevenlabs` e `microsoft` são responsáveis por implementações de síntese
- `voice-call` consome o auxiliar de runtime de TTS de telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de Plugin de empresa com várias capacidades

Um Plugin de empresa deve parecer coeso visto de fora. Se o OpenClaw tiver contratos compartilhados para modelos, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagens, geração de vídeo, busca de web e pesquisa na web, um fornecedor pode possuir todas as suas superfícies em um só lugar:

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

- um Plugin é responsável pela superfície do fornecedor
- o core ainda é responsável pelos contratos de capacidade
- canais e plugins de recurso consomem auxiliares `api.runtime.*`, não código do fornecedor
- testes de contrato podem afirmar que o Plugin registrou as capacidades que declara possuir

### Exemplo de capacidade: compreensão de vídeo

O OpenClaw já trata compreensão de imagem/áudio/vídeo como uma capacidade compartilhada. O mesmo modelo de propriedade se aplica ali:

<Steps>
  <Step title="Core define o contrato">
    O core define o contrato de compreensão de mídia.
  </Step>
  <Step title="Plugins de fornecedores registram">
    Plugins de fornecedores registram `describeImage`, `transcribeAudio` e `describeVideo`, conforme aplicável.
  </Step>
  <Step title="Consumidores usam o comportamento compartilhado">
    Canais e plugins de recurso consomem o comportamento compartilhado do core em vez de se conectar diretamente ao código do fornecedor.
  </Step>
</Steps>

Isso evita incorporar as suposições de vídeo de um provedor no core. O plugin é responsável pela superfície do fornecedor; o core é responsável pelo contrato de capacidade e pelo comportamento de fallback.

Geração de vídeo já usa essa mesma sequência: o core é responsável pelo contrato de capacidade tipado e pelo auxiliar de runtime, e plugins de fornecedores registram implementações `api.registerVideoGenerationProvider(...)` nele.

Precisa de uma checklist concreta de rollout? Veja [Capability Cookbook](/pt-BR/plugins/adding-capabilities).

## Contratos e aplicação

A superfície da API de plugin é intencionalmente tipada e centralizada em `OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e os auxiliares de runtime nos quais um plugin pode confiar.

Por que isso importa:

- autores de plugin têm um padrão interno estável único
- o core pode rejeitar propriedade duplicada, como dois plugins registrando o mesmo id de provedor
- a inicialização pode exibir diagnósticos acionáveis para registro malformado
- testes de contrato podem aplicar a propriedade de plugins agrupados e impedir desvio silencioso

Há duas camadas de aplicação:

<AccordionGroup>
  <Accordion title="Aplicação de registro em tempo de execução">
    O registro de plugins valida os registros à medida que os plugins são carregados. Exemplos: ids de provedores duplicados, ids de provedores de fala duplicados e registros malformados produzem diagnósticos de plugin em vez de comportamento indefinido.
  </Accordion>
  <Accordion title="Testes de contrato">
    Plugins integrados são capturados em registros de contrato durante execuções de teste para que o OpenClaw possa declarar a propriedade explicitamente. Hoje, isso é usado para provedores de modelo, provedores de fala, provedores de pesquisa na web e propriedade de registros integrados.
  </Accordion>
</AccordionGroup>

O efeito prático é que o OpenClaw sabe, de antemão, qual plugin é proprietário de qual superfície. Isso permite que o núcleo e os canais componham perfeitamente, porque a propriedade é declarada, tipada e testável, em vez de implícita.

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
    - brechas pontuais de plugin que contornam o registro
    - código de canal acessando diretamente uma implementação de fornecedor
    - objetos de tempo de execução ad hoc que não fazem parte de `OpenClawPluginApi` ou `api.runtime`

  </Tab>
</Tabs>

Em caso de dúvida, eleve o nível de abstração: defina a capacidade primeiro e, depois, deixe os plugins se conectarem a ela.

## Modelo de execução

Plugins nativos do OpenClaw são executados **em processo** com o Gateway. Eles não são isolados em sandbox. Um plugin nativo carregado tem o mesmo limite de confiança em nível de processo que o código do núcleo.

<Warning>
Implicações de plugins nativos: um plugin pode registrar ferramentas, manipuladores de rede, hooks e serviços; um bug de plugin pode derrubar ou desestabilizar o gateway; e um plugin nativo malicioso equivale à execução arbitrária de código dentro do processo do OpenClaw.
</Warning>

Pacotes compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente Skills integradas.

Use listas de permissões e caminhos explícitos de instalação/carregamento para plugins não integrados. Trate plugins de workspace como código de desenvolvimento, não como padrões de produção.

Para nomes de pacotes de workspace integrados, mantenha o id do plugin ancorado no nome npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado, como `-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding`, quando o pacote expõe intencionalmente uma função de plugin mais restrita.

<Note>
**Nota de confiança:** `plugins.allow` confia em **ids de plugin**, não na procedência da origem. Um plugin de workspace com o mesmo id de um plugin integrado sombreia intencionalmente a cópia integrada quando esse plugin de workspace está habilitado/incluído na lista de permissões. Isso é normal e útil para desenvolvimento local, testes de patches e hotfixes. A confiança em plugins integrados é resolvida a partir do snapshot de origem — o manifesto e o código em disco no momento do carregamento — e não a partir de metadados de instalação. Um registro de instalação corrompido ou substituído não pode ampliar silenciosamente a superfície de confiança de um plugin integrado além do que a origem real declara.
</Note>

## Limite de exportação

O OpenClaw exporta capacidades, não conveniência de implementação.

Mantenha público o registro de capacidades. Remova exportações auxiliares que não fazem parte do contrato:

- subcaminhos auxiliares específicos de plugins integrados
- subcaminhos de encanamento de tempo de execução não destinados a API pública
- auxiliares de conveniência específicos de fornecedor
- auxiliares de configuração/onboarding que são detalhes de implementação

Subcaminhos auxiliares reservados de plugins integrados foram aposentados do mapa de exportação gerado do SDK. Mantenha auxiliares específicos do proprietário dentro do pacote do plugin proprietário; promova apenas comportamento reutilizável do host para contratos genéricos do SDK, como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

## Internos e referência

Para o pipeline de carregamento, o modelo de registro, hooks de tempo de execução de provedores, rotas HTTP do Gateway, esquemas de ferramentas de mensagem, resolução de destino de canais, catálogos de provedores, plugins do mecanismo de contexto e o guia para adicionar uma nova capacidade, consulte [Internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals).

## Relacionados

- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Manifesto do plugin](/pt-BR/plugins/manifest)
- [Configuração do SDK de plugin](/pt-BR/plugins/sdk-setup)
