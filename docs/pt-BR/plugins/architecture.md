---
read_when:
    - Criação ou depuração de plugins nativos do OpenClaw
    - Entendendo o modelo de recursos de plugins ou os limites de responsabilidade
    - Trabalhando no pipeline de carregamento ou registro de Plugins
    - Implementando hooks de runtime do provedor ou plugins de canal
sidebarTitle: Internals
summary: 'Aspectos internos dos Plugins: modelo de capacidades, responsabilidade, contratos, pipeline de carregamento e auxiliares de runtime'
title: Aspectos internos do Plugin
x-i18n:
    generated_at: "2026-07-12T00:07:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

Esta é a **referência detalhada de arquitetura** do sistema de plugins do OpenClaw. Para guias práticos, comece por uma das páginas específicas abaixo.

<CardGroup cols={2}>
  <Card title="Instalar e usar plugins" icon="plug" href="/pt-BR/tools/plugin">
    Guia para usuários finais sobre como adicionar, habilitar e solucionar problemas de plugins.
  </Card>
  <Card title="Desenvolver plugins" icon="rocket" href="/pt-BR/plugins/building-plugins">
    Tutorial para criar o primeiro plugin com o menor manifesto funcional.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/pt-BR/plugins/sdk-channel-plugins">
    Desenvolva um plugin de canal de mensagens.
  </Card>
  <Card title="Plugins de provedor" icon="microchip" href="/pt-BR/plugins/sdk-provider-plugins">
    Desenvolva um plugin de provedor de modelos.
  </Card>
  <Card title="Visão geral do SDK" icon="book" href="/pt-BR/plugins/sdk-overview">
    Referência do mapa de importações e da API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

As capacidades são o modelo público de **plugins nativos** no OpenClaw. Cada plugin nativo do OpenClaw se registra em um ou mais tipos de capacidade:

| Capacidade                    | Método de registro                              | Exemplos de plugins                  |
| ----------------------------- | ----------------------------------------------- | ------------------------------------ |
| Inferência de texto           | `api.registerProvider(...)`                     | `anthropic`, `openai`                |
| Backend de inferência da CLI  | `api.registerCliBackend(...)`                   | `anthropic`, `openai`                |
| Embeddings                    | `api.registerEmbeddingProvider(...)`            | Plugins vetoriais do provedor        |
| Fala                          | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Transcrição em tempo real     | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voz em tempo real             | `api.registerRealtimeVoiceProvider(...)`        | `google`, `openai`                   |
| Compreensão de mídia          | `api.registerMediaUnderstandingProvider(...)`   | `google`, `openai`                   |
| Fonte de transcrições         | `api.registerTranscriptSourceProvider(...)`     | `discord`                            |
| Geração de imagens            | `api.registerImageGenerationProvider(...)`      | `fal`, `google`, `openai`            |
| Geração de música             | `api.registerMusicGenerationProvider(...)`      | `fal`, `google`, `minimax`           |
| Geração de vídeo              | `api.registerVideoGenerationProvider(...)`      | `fal`, `google`, `qwen`              |
| Busca de conteúdo web         | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Pesquisa na web               | `api.registerWebSearchProvider(...)`            | `brave`, `firecrawl`, `google`       |
| Canal / mensagens             | `api.registerChannel(...)`                      | `matrix`, `msteams`                  |
| Descoberta do Gateway         | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                            |

<Note>
Um plugin que registra zero capacidades, mas fornece hooks, ferramentas, serviços de descoberta ou serviços em segundo plano, é um plugin **legado somente com hooks**. Esse padrão ainda é totalmente compatível.
</Note>

### Postura de compatibilidade externa

O modelo de capacidades já está implementado no núcleo e é usado atualmente por plugins incluídos/nativos, mas a compatibilidade de plugins externos ainda exige critérios mais rigorosos do que "se foi exportado, então está congelado".

| Situação do plugin                                  | Orientação                                                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Plugins externos existentes                         | Mantenha as integrações baseadas em hooks funcionando; esta é a linha de base de compatibilidade.                            |
| Novos plugins incluídos/nativos                     | Prefira o registro explícito de capacidades a acessos específicos de fornecedores ou novos projetos baseados apenas em hooks. |
| Plugins externos adotando o registro de capacidades | Permitido, mas considere as superfícies auxiliares específicas de capacidades como evolutivas, a menos que a documentação as marque como estáveis. |

O registro de capacidades é a direção pretendida. Durante a transição, os hooks legados continuam sendo o caminho mais seguro para evitar incompatibilidades em plugins externos. Nem todos os subcaminhos auxiliares exportados são equivalentes — prefira contratos restritos e documentados a exportações auxiliares incidentais.

### Formatos de plugins

O OpenClaw classifica cada plugin carregado em um formato com base no comportamento real de registro, não apenas nos metadados estáticos:

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra exatamente um tipo de capacidade (por exemplo, um plugin exclusivo de provedor, como `arcee` ou `chutes`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra vários tipos de capacidade (por exemplo, `openai` é responsável por inferência de texto, fala, compreensão de mídia e geração de imagens).
  </Accordion>
  <Accordion title="hook-only">
    Registra apenas hooks (tipados ou personalizados), sem capacidades, ferramentas, comandos ou serviços.
  </Accordion>
  <Accordion title="non-capability">
    Registra ferramentas, comandos, serviços ou rotas, mas nenhuma capacidade.
  </Accordion>
</AccordionGroup>

Use `openclaw plugins inspect <id>` para ver o formato e o detalhamento das capacidades de um plugin. Consulte a [referência da CLI](/pt-BR/cli/plugins#inspect) para obter detalhes.

### Hooks legados

O hook `before_agent_start` continua sendo compatível como caminho de compatibilidade para plugins somente com hooks. Plugins legados usados no mundo real ainda dependem dele.

Direção:

- mantê-lo funcionando
- documentá-lo como legado
- preferir `before_model_resolve` para substituições de modelo/provedor
- preferir `before_prompt_build` para alterações de prompts
- removê-lo somente após a redução do uso real e quando a cobertura de fixtures comprovar a segurança da migração

### Sinais de compatibilidade

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` e `openclaw plugins doctor` exibem estes avisos de compatibilidade:

| Sinal                                             | Significado                                                                                                                             |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **configuração válida**                           | A configuração é analisada corretamente e os plugins são resolvidos                                                                     |
| **somente com hooks** (informativo)                | O plugin registra apenas hooks; é um caminho compatível, mas ainda não foi migrado para o registro de capacidades                        |
| **`before_agent_start` legado** (aviso)            | O plugin usa o hook obsoleto `before_agent_start` em vez de `before_model_resolve`/`before_prompt_build`                                 |
| **API obsoleta de embeddings de memória** (aviso) | Um plugin não incluído usa a antiga API de provedor de embeddings específica de memória em vez de `registerEmbeddingProvider`            |
| **erro grave**                                    | A configuração é inválida ou houve falha ao carregar o plugin                                                                            |

Atualmente, nenhum dos sinais informativos ou de aviso interrompe o funcionamento do seu plugin. Esses sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

<Steps>
  <Step title="Manifesto + descoberta">
    O OpenClaw encontra plugins candidatos em caminhos configurados, raízes de espaços de trabalho, raízes globais de plugins e plugins incluídos. A descoberta lê primeiro os manifestos nativos `openclaw.plugin.json` e os manifestos de pacotes compatíveis.
  </Step>
  <Step title="Habilitação + validação">
    O núcleo decide se um plugin descoberto está habilitado, desabilitado, bloqueado ou selecionado para uma posição exclusiva, como memória.
  </Step>
  <Step title="Carregamento em tempo de execução">
    Os plugins nativos do OpenClaw são carregados no processo e registram capacidades em um registro central. O JavaScript empacotado é carregado por meio do `require` nativo; o código-fonte TypeScript local de terceiros usa o Jiti como alternativa emergencial. Pacotes compatíveis são normalizados em registros do repositório sem importar código de tempo de execução.
  </Step>
  <Step title="Consumo de superfícies">
    O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração de provedores, hooks, rotas HTTP, comandos da CLI e serviços.
  </Step>
</Steps>

Especificamente para a CLI de plugins, a descoberta de comandos raiz é dividida em duas fases:

- os metadados no momento da análise vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do plugin pode permanecer com carregamento tardio e se registrar na primeira invocação

Isso mantém o código da CLI pertencente ao plugin dentro dele e ainda permite que o OpenClaw reserve nomes de comandos raiz antes da análise.

O limite de projeto importante:

- a validação do manifesto/configuração deve funcionar a partir dos **metadados do manifesto/esquema**, sem executar o código do plugin
- a descoberta de capacidades nativas pode carregar o código de entrada de plugins confiáveis para criar um instantâneo não ativador do registro
- o comportamento nativo em tempo de execução vem do caminho `register(api)` do módulo do plugin com `api.registrationMode === "full"`

Essa separação permite que o OpenClaw valide a configuração, explique plugins ausentes/desabilitados e crie dicas para a interface/esquema antes que o tempo de execução completo esteja ativo.

### Instantâneo de metadados de plugins e tabela de consulta

A inicialização do Gateway cria um `PluginMetadataSnapshot` para o instantâneo atual da configuração. O instantâneo contém apenas metadados: ele armazena o índice de plugins instalados, o registro de manifestos, os diagnósticos de manifestos, os mapas de proprietários, um normalizador de IDs de plugins e os registros de manifestos. Ele não contém módulos de plugins carregados, SDKs de provedores, conteúdo de pacotes nem exportações de tempo de execução.

A validação de configuração ciente de plugins, a habilitação automática na inicialização e a inicialização de plugins do Gateway consomem esse instantâneo, em vez de reconstruírem independentemente os metadados do manifesto/índice. `PluginLookUpTable` é derivada do mesmo instantâneo e adiciona o plano de plugins de inicialização para a configuração atual do tempo de execução.

Após a inicialização, o Gateway mantém o instantâneo de metadados atual como um produto substituível do tempo de execução. Descobertas repetidas de provedores em tempo de execução podem reutilizar esse instantâneo, em vez de reconstruir o índice instalado e o registro de manifestos a cada passagem pelo catálogo de provedores. O instantâneo é limpo ou substituído quando o Gateway é encerrado, quando a configuração ou o inventário de plugins muda e quando há gravações no índice instalado; os chamadores recorrem ao caminho frio de manifesto/índice quando não existe um instantâneo atual compatível. As verificações de compatibilidade devem incluir raízes de descoberta de plugins, como `plugins.load.paths`, e o espaço de trabalho padrão do agente, pois os plugins do espaço de trabalho fazem parte do escopo dos metadados.

O instantâneo e a tabela de consulta mantêm decisões repetidas de inicialização no caminho rápido:

- propriedade dos canais
- inicialização adiada de canais
- IDs dos plugins de inicialização
- propriedade dos provedores e backends da CLI
- propriedade do provedor de configuração, do alias de comando, do provedor do catálogo de modelos e do contrato do manifesto
- validação do esquema de configuração de plugins e do esquema de configuração de canais
- decisões de habilitação automática na inicialização

O limite de segurança é a substituição do instantâneo, não sua mutação. Reconstrua o instantâneo quando a configuração, o inventário de plugins, os registros de instalação ou a política persistida do índice forem alterados. Não o trate como um registro global mutável e abrangente nem mantenha instantâneos históricos ilimitados. O carregamento de plugins em tempo de execução permanece separado dos instantâneos de metadados, para que um estado obsoleto do tempo de execução não possa ser ocultado por um cache de metadados.

A regra de cache está documentada em [Detalhes internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals#plugin-cache-boundary): os metadados de manifesto e descoberta são atuais, a menos que um chamador mantenha um instantâneo explícito, uma tabela de consulta ou um registro de manifestos para o fluxo atual. Caches ocultos de metadados e TTLs baseados no relógio não fazem parte do carregamento de plugins. Somente caches do carregador de tempo de execução, de módulos e de artefatos de dependências podem persistir após o código ou os artefatos instalados serem efetivamente carregados.

Alguns chamadores do caminho frio ainda reconstroem registros de manifestos diretamente a partir do índice persistido de plugins instalados, em vez de receberem uma `PluginLookUpTable` do Gateway. Agora, esse caminho reconstrói o registro sob demanda; prefira transmitir a tabela de consulta atual ou um registro explícito de manifestos pelos fluxos de tempo de execução quando um chamador já tiver um deles.

### Planejamento de ativação

O planejamento de ativação faz parte do plano de controle. Os chamadores podem consultar quais plugins são relevantes para um comando, provedor, canal, rota, infraestrutura de agente ou recurso específico antes de carregar registros de runtime mais abrangentes.

O planejador mantém compatibilidade com o comportamento atual do manifesto:

- os campos `activation.*` são dicas explícitas para o planejador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e os hooks continuam sendo o fallback de propriedade do manifesto
- a API do planejador que retorna apenas IDs permanece disponível para chamadores existentes
- a API de plano informa rótulos de motivo para que os diagnósticos possam distinguir dicas explícitas do fallback de propriedade

<Warning>
Não trate `activation` como um hook de ciclo de vida nem como substituto de `register(...)`. Ele é um metadado usado para restringir o carregamento. Prefira os campos de propriedade quando eles já descreverem a relação; use `activation` somente para dicas adicionais ao planejador.
</Warning>

### Plugins de canal e a ferramenta compartilhada de mensagens

Os plugins de canal não precisam registrar uma ferramenta separada de envio/edição/reação para ações normais de chat. O OpenClaw mantém uma única ferramenta compartilhada `message` no núcleo, e os plugins de canal controlam a descoberta e a execução específicas do canal por trás dela.

O limite atual é:

- o núcleo controla o host da ferramenta compartilhada `message`, a integração com prompts, a manutenção dos registros de sessão/thread e o despacho da execução
- os plugins de canal controlam a descoberta de ações com escopo, a descoberta de recursos e quaisquer fragmentos de esquema específicos do canal
- os plugins de canal controlam a gramática de conversação de sessão específica do provedor, como a forma pela qual os IDs de conversa codificam IDs de thread ou são herdados de conversas pai
- os plugins de canal executam a ação final por meio de seu adaptador de ações

Para plugins de canal, a superfície do SDK é `ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta permite que um plugin retorne em conjunto suas ações visíveis, seus recursos e suas contribuições de esquema, para que essas partes não fiquem dessincronizadas.

Quando um parâmetro específico do canal da ferramenta de mensagens contém uma fonte de mídia, como um caminho local ou uma URL de mídia remota, o plugin também deve retornar `mediaSourceParams` de `describeMessageTool(...)`. O núcleo usa essa lista explícita para aplicar a normalização de caminhos do sandbox e dicas de acesso a mídia de saída sem codificar diretamente nomes de parâmetros pertencentes ao plugin. Nesse caso, prefira mapas com escopo por ação, em vez de uma única lista plana para todo o canal, para que um parâmetro de mídia exclusivo de perfil não seja normalizado em ações não relacionadas, como `send`.

O núcleo passa o escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- o `requesterSenderId` confiável da mensagem recebida

Isso é importante para plugins sensíveis ao contexto. Um canal pode ocultar ou expor ações de mensagens com base na conta ativa, na sala/thread/mensagem atual ou na identidade confiável do solicitante, sem codificar diretamente ramificações específicas do canal na ferramenta central `message`.

É por isso que alterações de roteamento do executor incorporado ainda são responsabilidade do plugin: o executor é responsável por encaminhar a identidade atual do chat/sessão ao limite de descoberta do plugin, para que a ferramenta compartilhada `message` exponha a superfície correta pertencente ao canal no turno atual.

Para auxiliares de execução pertencentes ao canal, os plugins incluídos no pacote devem manter o runtime de execução dentro de seus próprios módulos de plugin. O núcleo não controla mais os runtimes de ações de mensagens do Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`. Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e os plugins incluídos no pacote devem importar diretamente seu próprio código de runtime local dos módulos pertencentes ao plugin.

O mesmo limite se aplica, de modo geral, às interfaces do SDK nomeadas por provedor: o núcleo não deve importar módulos agregadores de conveniência específicos de canal para Discord, Signal, Slack, WhatsApp ou plugins semelhantes. Se o núcleo precisar de um comportamento, deverá consumir o módulo agregador `api.ts` / `runtime-api.ts` do próprio plugin incluído no pacote ou promover a necessidade a um recurso genérico e restrito no SDK compartilhado.

Os plugins incluídos no pacote seguem a mesma regra. O `runtime-api.ts` de um plugin incluído no pacote não deve reexportar sua própria fachada identificada como `openclaw/plugin-sdk/<plugin-id>`. Essas fachadas identificadas continuam sendo camadas de compatibilidade para plugins externos e consumidores antigos, mas os plugins incluídos no pacote devem usar exportações locais e subcaminhos genéricos e restritos do SDK, como `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` ou `openclaw/plugin-sdk/webhook-ingress`. Código novo não deve adicionar fachadas de SDK específicas de ID de plugin, a menos que o limite de compatibilidade de um ecossistema externo existente exija isso.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a base compartilhada para canais que se adequam ao modelo comum de enquetes
- `actions.handleAction("poll")` é o caminho preferencial para semânticas de enquete específicas do canal ou parâmetros adicionais de enquete

Agora, o núcleo adia a análise compartilhada da enquete até que o despacho da enquete pelo plugin recuse a ação, permitindo que manipuladores de enquete pertencentes ao plugin aceitem campos de enquete específicos do canal sem serem bloqueados primeiro pelo analisador genérico de enquetes.

Consulte [Aspectos internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals) para ver a sequência completa de inicialização.

## Modelo de propriedade de recursos

O OpenClaw trata um plugin nativo como o limite de propriedade de uma **empresa** ou de um **recurso**, e não como uma coleção desorganizada de integrações sem relação entre si.

Isso significa que:

- um plugin de empresa geralmente deve controlar todas as superfícies dessa empresa voltadas ao OpenClaw
- um plugin de recurso geralmente deve controlar toda a superfície do recurso que introduz
- os canais devem consumir recursos compartilhados do núcleo em vez de reimplementar de forma ad hoc o comportamento do provedor

<AccordionGroup>
  <Accordion title="Fornecedor com vários recursos">
    `google` controla inferência de texto, backend de CLI, embeddings, fala, voz em tempo real, compreensão de mídia, geração de imagens/música/vídeos e pesquisa na web. `openai` controla inferência de texto, embeddings, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia e geração de imagens/vídeos. `minimax` controla inferência de texto, além de compreensão de mídia, fala, geração de imagens/música/vídeos e pesquisa na web.
  </Accordion>
  <Accordion title="Fornecedor com um único recurso">
    `arcee` e `chutes` controlam somente a inferência de texto; `microsoft` controla somente a fala. Um plugin de fornecedor pode permanecer com esse escopo restrito até precisar abranger uma parte maior da superfície desse fornecedor.
  </Accordion>
  <Accordion title="Plugin de recurso">
    `voice-call` controla o transporte de chamadas, as ferramentas, a CLI, as rotas e a conexão de streams de mídia do Twilio, mas consome os recursos compartilhados de fala, transcrição em tempo real e voz em tempo real em vez de importar diretamente plugins de fornecedores.
  </Accordion>
</AccordionGroup>

O estado final pretendido é:

- a superfície de um fornecedor voltada ao OpenClaw reside em um único plugin, mesmo que abranja modelos de texto, fala, imagens e vídeo
- outros fornecedores podem fazer o mesmo em suas próprias áreas de atuação
- os canais não precisam saber qual plugin de fornecedor controla o provedor; eles consomem o contrato de recurso compartilhado exposto pelo núcleo

Esta é a distinção fundamental:

- **plugin** = limite de propriedade
- **recurso** = contrato do núcleo que vários plugins podem implementar ou consumir

Portanto, se o OpenClaw adicionar um novo domínio, como vídeo, a primeira pergunta não será "qual provedor deve codificar diretamente o processamento de vídeo?". A primeira pergunta será "qual é o contrato de recurso de vídeo do núcleo?". Depois que esse contrato existir, os plugins de fornecedores poderão se registrar nele, e os plugins de canal/recurso poderão consumi-lo.

Se o recurso ainda não existir, a ação correta geralmente será:

<Steps>
  <Step title="Definir o recurso">
    Defina o recurso ausente no núcleo.
  </Step>
  <Step title="Expor por meio do SDK">
    Exponha-o de forma tipada por meio da API/runtime do plugin.
  </Step>
  <Step title="Conectar consumidores">
    Conecte canais/recursos a esse recurso.
  </Step>
  <Step title="Implementações de fornecedores">
    Permita que plugins de fornecedores registrem implementações.
  </Step>
</Steps>

Isso mantém a propriedade explícita e evita comportamentos do núcleo que dependam de um único fornecedor ou de um caminho de código específico de um plugin isolado.

### Camadas de recursos

Use este modelo mental ao decidir onde o código deve ficar:

<Tabs>
  <Tab title="Camada de recursos do núcleo">
    Orquestração compartilhada, política, fallback, regras de mesclagem de configuração, semântica de entrega e contratos tipados.
  </Tab>
  <Tab title="Camada de plugin do fornecedor">
    APIs específicas do fornecedor, autenticação, catálogos de modelos, síntese de fala, geração de imagens, backends de vídeo e endpoints de uso.
  </Tab>
  <Tab title="Camada de plugin de canal/recurso">
    Integração com Discord/Slack/voice-call/etc. que consome recursos do núcleo e os apresenta em uma superfície.
  </Tab>
</Tabs>

Por exemplo, o TTS segue esta estrutura:

- o núcleo controla a política de TTS no momento da resposta, a ordem de fallback, as preferências e a entrega pelo canal
- `elevenlabs`, `google`, `microsoft` e `openai` controlam as implementações de síntese
- `voice-call` consome o auxiliar de runtime de TTS para telefonia

Esse mesmo padrão deve ser preferido para recursos futuros.

### Exemplo de plugin de empresa com vários recursos

Um plugin de empresa deve parecer coeso externamente. Se o OpenClaw tiver contratos compartilhados para modelos, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagens, geração de vídeos, busca de conteúdo na web e pesquisa na web, um fornecedor poderá controlar todas as suas superfícies em um só lugar:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

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
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
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

O que importa não são os nomes exatos dos auxiliares. O que importa é a estrutura:

- um único plugin controla a superfície do fornecedor
- o núcleo continua controlando os contratos de recursos
- os canais e plugins de recursos consomem auxiliares `api.runtime.*`, e não código do fornecedor
- testes de contrato podem verificar se o plugin registrou os recursos que declara controlar

### Exemplo de recurso: compreensão de vídeo

O OpenClaw já trata a compreensão de imagens/áudio/vídeo como um único recurso compartilhado. O mesmo modelo de propriedade se aplica nesse caso:

<Steps>
  <Step title="O núcleo define o contrato">
    O núcleo define o contrato de compreensão de mídia.
  </Step>
  <Step title="Plugins de fornecedores se registram">
    Os plugins de fornecedores registram `describeImage`, `transcribeAudio` e `describeVideo`, conforme aplicável.
  </Step>
  <Step title="Consumidores usam o comportamento compartilhado">
    Os canais e plugins de recursos consomem o comportamento compartilhado do núcleo em vez de se conectarem diretamente ao código do fornecedor.
  </Step>
</Steps>

Isso evita incorporar ao núcleo as premissas de vídeo de um único provedor. O plugin controla a superfície do fornecedor; o núcleo controla o contrato de recurso e o comportamento de fallback.

A geração de vídeos já usa essa mesma sequência: o núcleo controla o contrato tipado de recurso e o auxiliar de runtime, e os plugins de fornecedores registram implementações de `api.registerVideoGenerationProvider(...)` nele.

Precisa de uma lista de verificação concreta para a implementação? Consulte o [Guia prático de recursos](/pt-BR/plugins/adding-capabilities).

## Contratos e aplicação

A superfície da API de plugins é intencionalmente tipada e centralizada em `OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e os auxiliares de runtime dos quais um plugin pode depender.

Por que isso é importante:

- os autores de plugins têm um único padrão interno estável
- o núcleo pode rejeitar propriedade duplicada, como quando dois plugins registram o mesmo id de provedor
- a inicialização pode apresentar diagnósticos acionáveis para registros malformados
- testes de contrato podem impor a propriedade de plugins integrados e evitar desvios silenciosos

Há duas camadas de aplicação:

<AccordionGroup>
  <Accordion title="Aplicação do registro em runtime">
    O registro de plugins valida os registros à medida que os plugins são carregados. Exemplos: ids duplicados de provedores, ids duplicados de provedores de fala e registros malformados geram diagnósticos de plugin em vez de comportamento indefinido.
  </Accordion>
  <Accordion title="Testes de contrato">
    Os plugins integrados são capturados em registros de contrato durante as execuções de teste para que o OpenClaw possa verificar explicitamente a propriedade. Atualmente, isso é usado para provedores de modelos, provedores de fala, provedores de pesquisa na web e propriedade de registros integrados.
  </Accordion>
</AccordionGroup>

O efeito prático é que o OpenClaw sabe, antecipadamente, qual plugin é proprietário de cada superfície. Isso permite que o núcleo e os canais se componham de forma integrada, pois a propriedade é declarada, tipada e testável, em vez de implícita.

### O que pertence a um contrato

<Tabs>
  <Tab title="Bons contratos">
    - tipados
    - pequenos
    - específicos para uma capacidade
    - pertencentes ao núcleo
    - reutilizáveis por vários plugins
    - consumíveis por canais/recursos sem conhecimento do fornecedor

  </Tab>
  <Tab title="Contratos ruins">
    - política específica de fornecedor oculta no núcleo
    - mecanismos de escape pontuais de plugins que ignoram o registro
    - código de canal acessando diretamente uma implementação de fornecedor
    - objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` nem de `api.runtime`

  </Tab>
</Tabs>

Em caso de dúvida, eleve o nível de abstração: defina primeiro a capacidade e, depois, permita que os plugins se conectem a ela.

## Modelo de execução

Os plugins nativos do OpenClaw são executados **no mesmo processo** que o Gateway. Eles não ficam isolados em sandbox. Um plugin nativo carregado tem o mesmo limite de confiança no nível do processo que o código do núcleo.

<Warning>
Implicações dos plugins nativos: um plugin pode registrar ferramentas, manipuladores de rede, hooks e serviços; um bug em um plugin pode causar falhas ou desestabilizar o Gateway; e um plugin nativo mal-intencionado equivale à execução arbitrária de código dentro do processo do OpenClaw.
</Warning>

Os pacotes compatíveis são mais seguros por padrão, pois atualmente o OpenClaw os trata como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente Skills incluídas.

Use listas de permissões e caminhos explícitos de instalação/carregamento para plugins não integrados. Trate plugins do workspace como código de desenvolvimento, não como padrões de produção.

Para nomes de pacotes integrados do workspace, mantenha o id do plugin ancorado no nome npm: `@openclaw/<id>` por padrão ou um sufixo tipado aprovado, como `-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding`, quando o pacote expuser intencionalmente uma função de plugin mais específica.

<Note>
**Observação sobre confiança:** `plugins.allow` confia em **ids de plugins**, não na procedência do código-fonte. Um plugin do workspace com o mesmo id de um plugin integrado substitui intencionalmente a cópia integrada quando esse plugin do workspace está habilitado/incluído na lista de permissões. Isso é normal e útil para desenvolvimento local, testes de patches e correções emergenciais. A confiança em plugins integrados é determinada com base no snapshot do código-fonte — o manifesto e o código no disco no momento do carregamento —, e não nos metadados de instalação. Um registro de instalação corrompido ou substituído não pode ampliar silenciosamente a superfície de confiança de um plugin integrado além do que o código-fonte real declara.
</Note>

## Limite de exportação

O OpenClaw exporta capacidades, não conveniências de implementação.

Mantenha público o registro de capacidades. Remova exportações de auxiliares que não fazem parte do contrato:

- subcaminhos auxiliares específicos de plugins integrados
- subcaminhos de infraestrutura de runtime que não se destinam a ser uma API pública
- auxiliares de conveniência específicos de fornecedores
- auxiliares de configuração/integração inicial que sejam detalhes de implementação

Os subcaminhos auxiliares reservados de plugins integrados foram removidos do mapa de exportação gerado do SDK. Mantenha os auxiliares específicos de cada proprietário dentro do pacote do plugin correspondente; promova apenas comportamentos reutilizáveis do host a contratos genéricos do SDK, como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

## Aspectos internos e referência

Para conhecer o pipeline de carregamento, o modelo de registro, os hooks de runtime dos provedores, as rotas HTTP do Gateway, os esquemas de ferramentas de mensagens, a resolução de destinos de canais, os catálogos de provedores, os plugins do mecanismo de contexto e o guia para adicionar uma nova capacidade, consulte [Aspectos internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals).

## Relacionados

- [Como criar plugins](/pt-BR/plugins/building-plugins)
- [Manifesto de plugin](/pt-BR/plugins/manifest)
- [Configuração do SDK de plugins](/pt-BR/plugins/sdk-setup)
