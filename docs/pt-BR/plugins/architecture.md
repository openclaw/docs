---
read_when:
    - Como criar ou depurar plugins nativos do OpenClaw
    - Entendendo o modelo de recursos de plugins ou os limites de responsabilidade
    - Trabalhando no pipeline de carregamento ou no registro de plugins
    - Implementação de hooks de runtime de provedores ou plugins de canais
sidebarTitle: Internals
summary: 'Aspectos internos do Plugin: modelo de capacidades, responsabilidade, contratos, pipeline de carregamento e auxiliares de runtime'
title: Detalhes internos do Plugin
x-i18n:
    generated_at: "2026-07-12T15:22:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

Esta é a **referência detalhada da arquitetura** do sistema de plugins do OpenClaw. Para guias práticos, comece por uma das páginas específicas abaixo.

<CardGroup cols={2}>
  <Card title="Instalar e usar plugins" icon="plug" href="/pt-BR/tools/plugin">
    Guia para usuários finais sobre como adicionar, habilitar e solucionar problemas de plugins.
  </Card>
  <Card title="Como criar plugins" icon="rocket" href="/pt-BR/plugins/building-plugins">
    Tutorial do primeiro plugin com o menor manifesto funcional.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um plugin de canal de mensagens.
  </Card>
  <Card title="Plugins de provedor" icon="microchip" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um plugin de provedor de modelos.
  </Card>
  <Card title="Visão geral do SDK" icon="book" href="/pt-BR/plugins/sdk-overview">
    Referência do mapa de importações e da API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

As capacidades são o modelo público de **plugins nativos** no OpenClaw. Cada plugin nativo do OpenClaw se registra em um ou mais tipos de capacidade:

| Capacidade                  | Método de registro                              | Plugins de exemplo                |
| --------------------------- | ----------------------------------------------- | --------------------------------- |
| Inferência de texto         | `api.registerProvider(...)`                     | `anthropic`, `openai`             |
| Backend de inferência da CLI | `api.registerCliBackend(...)`                   | `anthropic`, `openai`             |
| Embeddings                  | `api.registerEmbeddingProvider(...)`            | Plugins vetoriais do provedor     |
| Fala                        | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`         |
| Transcrição em tempo real   | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                         |
| Voz em tempo real           | `api.registerRealtimeVoiceProvider(...)`        | `google`, `openai`                |
| Compreensão de mídia        | `api.registerMediaUnderstandingProvider(...)`   | `google`, `openai`                |
| Fonte de transcrições       | `api.registerTranscriptSourceProvider(...)`     | `discord`                         |
| Geração de imagens          | `api.registerImageGenerationProvider(...)`      | `fal`, `google`, `openai`         |
| Geração de música           | `api.registerMusicGenerationProvider(...)`      | `fal`, `google`, `minimax`        |
| Geração de vídeo            | `api.registerVideoGenerationProvider(...)`      | `fal`, `google`, `qwen`           |
| Busca de conteúdo da Web    | `api.registerWebFetchProvider(...)`             | `firecrawl`                       |
| Pesquisa na Web             | `api.registerWebSearchProvider(...)`            | `brave`, `firecrawl`, `google`    |
| Canal / mensagens           | `api.registerChannel(...)`                      | `matrix`, `msteams`               |
| Descoberta do Gateway       | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                         |

<Note>
Um plugin que registra zero capacidades, mas fornece hooks, ferramentas, serviços de descoberta ou serviços em segundo plano, é um plugin **legado somente com hooks**. Esse padrão ainda é totalmente compatível.
</Note>

### Postura de compatibilidade externa

O modelo de capacidades foi incorporado ao núcleo e é usado atualmente por plugins integrados/nativos, mas a compatibilidade de plugins externos ainda exige um critério mais rigoroso do que "foi exportado, portanto está congelado".

| Situação do plugin                                 | Orientação                                                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Plugins externos existentes                        | Mantenha as integrações baseadas em hooks funcionando; essa é a base de compatibilidade.                                |
| Novos plugins integrados/nativos                   | Prefira o registro explícito de capacidades a acessos internos específicos de fornecedores ou novos designs somente com hooks. |
| Plugins externos adotando o registro de capacidades | Permitido, mas trate as interfaces auxiliares específicas de capacidades como sujeitas a evolução, a menos que a documentação as marque como estáveis. |

O registro de capacidades é a direção pretendida. Os hooks legados continuam sendo o caminho mais seguro e sem quebras para plugins externos durante a transição. Nem todos os subcaminhos auxiliares exportados são equivalentes — prefira contratos restritos e documentados a exportações auxiliares incidentais.

### Formatos de plugin

O OpenClaw classifica cada plugin carregado em um formato com base em seu comportamento real de registro (não apenas em metadados estáticos):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra exatamente um tipo de capacidade (por exemplo, um plugin somente de provedor, como `arcee` ou `chutes`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra vários tipos de capacidade (por exemplo, `openai` é responsável por inferência de texto, fala, compreensão de mídia e geração de imagens).
  </Accordion>
  <Accordion title="hook-only">
    Registra somente hooks (tipados ou personalizados), sem capacidades, ferramentas, comandos ou serviços.
  </Accordion>
  <Accordion title="non-capability">
    Registra ferramentas, comandos, serviços ou rotas, mas nenhuma capacidade.
  </Accordion>
</AccordionGroup>

Use `openclaw plugins inspect <id>` para ver o formato e a divisão de capacidades de um plugin. Consulte a [referência da CLI](/pt-BR/cli/plugins#inspect) para obter detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como um caminho de compatibilidade para plugins somente com hooks. Plugins legados usados no mundo real ainda dependem dele.

Direção:

- mantê-lo funcionando
- documentá-lo como legado
- preferir `before_model_resolve` para trabalhos de substituição de modelo/provedor
- preferir `before_prompt_build` para trabalhos de modificação de prompts
- removê-lo somente após a redução do uso real e quando a cobertura de fixtures comprovar a segurança da migração

### Sinais de compatibilidade

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` e `openclaw plugins doctor` apresentam estes avisos de compatibilidade:

| Sinal                                      | Significado                                                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **configuração válida**                    | A configuração é analisada corretamente e os plugins são resolvidos                                                           |
| **somente com hooks** (informação)          | O plugin registra somente hooks; é um caminho compatível, mas ainda não foi migrado para o registro de capacidades             |
| **`before_agent_start` legado** (aviso)     | O plugin usa o hook obsoleto `before_agent_start` em vez de `before_model_resolve`/`before_prompt_build`                       |
| **API de embeddings de memória obsoleta** (aviso) | Um plugin não integrado usa a antiga API de provedor de embeddings específica para memória em vez de `registerEmbeddingProvider` |
| **erro grave**                             | A configuração é inválida ou houve falha ao carregar o plugin                                                                  |

Nenhum dos sinais informativos ou de aviso interrompe seu plugin atualmente. Esses sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

<Steps>
  <Step title="Manifesto + descoberta">
    O OpenClaw encontra plugins candidatos em caminhos configurados, raízes de espaços de trabalho, raízes globais de plugins e plugins integrados. A descoberta lê primeiro os manifestos nativos `openclaw.plugin.json` e os manifestos de pacotes compatíveis.
  </Step>
  <Step title="Habilitação + validação">
    O núcleo decide se um plugin descoberto está habilitado, desabilitado, bloqueado ou selecionado para um slot exclusivo, como memória.
  </Step>
  <Step title="Carregamento em tempo de execução">
    Os plugins nativos do OpenClaw são carregados no processo e registram capacidades em um registro central. O JavaScript empacotado é carregado pelo `require` nativo; o código-fonte TypeScript local de terceiros usa o Jiti como alternativa emergencial. Pacotes compatíveis são normalizados em registros do registro sem importar código de tempo de execução.
  </Step>
  <Step title="Consumo de interfaces">
    O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração de provedores, hooks, rotas HTTP, comandos da CLI e serviços.
  </Step>
</Steps>

Especificamente para a CLI de plugins, a descoberta de comandos raiz é dividida em duas fases:

- os metadados do momento da análise vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do plugin pode permanecer com carregamento adiado e ser registrado na primeira invocação

Isso mantém o código da CLI pertencente ao plugin dentro do próprio plugin, enquanto ainda permite que o OpenClaw reserve os nomes dos comandos raiz antes da análise.

O limite de design importante:

- a validação de manifesto/configuração deve funcionar com base nos **metadados de manifesto/esquema**, sem executar o código do plugin
- a descoberta de capacidades nativas pode carregar o código de entrada de plugins confiáveis para criar um snapshot do registro sem ativação
- o comportamento nativo em tempo de execução vem do caminho `register(api)` do módulo do plugin com `api.registrationMode === "full"`

Essa separação permite que o OpenClaw valide configurações, explique plugins ausentes/desabilitados e crie dicas de interface/esquema antes que o ambiente de execução completo esteja ativo.

### Snapshot de metadados de plugins e tabela de consulta

A inicialização do Gateway cria um `PluginMetadataSnapshot` para o snapshot atual da configuração. O snapshot contém somente metadados: ele armazena o índice de plugins instalados, o registro de manifestos, os diagnósticos de manifestos, os mapas de responsáveis, um normalizador de IDs de plugins e os registros de manifestos. Ele não contém módulos de plugins carregados, SDKs de provedores, conteúdo de pacotes nem exportações de tempo de execução.

A validação de configuração ciente de plugins, a habilitação automática na inicialização e a inicialização de plugins do Gateway consomem esse snapshot em vez de recriar independentemente os metadados de manifesto/índice. A `PluginLookUpTable` é derivada do mesmo snapshot e adiciona o plano de plugins de inicialização para a configuração atual do ambiente de execução.

Após a inicialização, o Gateway mantém o snapshot atual de metadados como um produto substituível do ambiente de execução. A descoberta repetida de provedores em tempo de execução pode usar esse snapshot em vez de reconstruir o índice instalado e o registro de manifestos em cada passagem pelo catálogo de provedores. O snapshot é limpo ou substituído quando o Gateway é encerrado, quando há alterações na configuração ou no inventário de plugins e quando há gravações no índice instalado; os chamadores recorrem ao caminho frio de manifesto/índice quando não existe um snapshot atual compatível. As verificações de compatibilidade devem incluir as raízes de descoberta de plugins, como `plugins.load.paths`, e o espaço de trabalho padrão do agente, pois os plugins do espaço de trabalho fazem parte do escopo dos metadados.

O snapshot e a tabela de consulta mantêm decisões repetidas de inicialização no caminho rápido:

- responsabilidade pelos canais
- inicialização adiada de canais
- IDs de plugins de inicialização
- responsabilidade por provedores e backends da CLI
- responsabilidade por provedor de configuração, alias de comando, provedor de catálogo de modelos e contrato de manifesto
- validação do esquema de configuração de plugins e do esquema de configuração de canais
- decisões de habilitação automática na inicialização

O limite de segurança é a substituição do snapshot, não sua mutação. Recrie o snapshot quando houver alterações na configuração, no inventário de plugins, nos registros de instalação ou na política persistida do índice. Não o trate como um registro global amplamente mutável e não mantenha snapshots históricos ilimitados. O carregamento de plugins em tempo de execução permanece separado dos snapshots de metadados para que estados obsoletos do ambiente de execução não possam ser ocultados por um cache de metadados.

A regra de cache está documentada em [Detalhes internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals#plugin-cache-boundary): os metadados de manifesto e descoberta são atuais, a menos que um chamador mantenha um snapshot, uma tabela de consulta ou um registro de manifestos explícito para o fluxo atual. Caches ocultos de metadados e TTLs baseados no relógio não fazem parte do carregamento de plugins. Somente os caches do carregador de tempo de execução, de módulos e de artefatos de dependências podem persistir depois que o código ou os artefatos instalados forem efetivamente carregados.

Alguns chamadores do caminho frio ainda reconstroem registros de manifestos diretamente do índice persistido de plugins instalados, em vez de receber uma `PluginLookUpTable` do Gateway. Esse caminho agora reconstrói o registro sob demanda; prefira transmitir a tabela de consulta atual ou um registro de manifestos explícito pelos fluxos de tempo de execução quando um chamador já tiver um deles.

### Planejamento de ativação

O planejamento de ativação faz parte do plano de controle. Os chamadores podem consultar quais plugins são relevantes para um comando, provedor, canal, rota, ambiente de execução de agente ou recurso específico antes de carregar registros de runtime mais abrangentes.

O planejador mantém compatibilidade com o comportamento atual do manifesto:

- os campos `activation.*` são dicas explícitas para o planejador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e os hooks continuam sendo o fallback de propriedade do manifesto
- a API do planejador que retorna apenas IDs permanece disponível para os chamadores existentes
- a API de plano informa rótulos de motivo para que os diagnósticos possam distinguir dicas explícitas do fallback de propriedade

<Warning>
Não trate `activation` como um hook de ciclo de vida nem como substituto de `register(...)`. São metadados usados para restringir o carregamento. Prefira campos de propriedade quando eles já descreverem a relação; use `activation` apenas para dicas adicionais ao planejador.
</Warning>

### Plugins de canal e a ferramenta compartilhada de mensagens

Os plugins de canal não precisam registrar uma ferramenta separada para enviar, editar ou reagir em ações normais de chat. O OpenClaw mantém uma única ferramenta compartilhada `message` no núcleo, enquanto os plugins de canal são responsáveis pela descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o núcleo é responsável pelo host da ferramenta compartilhada `message`, pela integração com prompts, pelo controle de sessões/threads e pelo despacho da execução
- os plugins de canal são responsáveis pela descoberta de ações dentro do escopo, pela descoberta de recursos e por quaisquer fragmentos de esquema específicos do canal
- os plugins de canal são responsáveis pela gramática de conversação de sessão específica do provedor, como a forma pela qual os IDs de conversa codificam IDs de thread ou são herdados de conversas pai
- os plugins de canal executam a ação final por meio do próprio adaptador de ações

Para plugins de canal, a superfície do SDK é `ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta permite que um plugin retorne, em conjunto, suas ações visíveis, seus recursos e suas contribuições ao esquema, evitando que esses elementos fiquem dessincronizados.

Quando um parâmetro da ferramenta de mensagens específico do canal contém uma origem de mídia, como um caminho local ou uma URL remota de mídia, o plugin também deve retornar `mediaSourceParams` de `describeMessageTool(...)`. O núcleo usa essa lista explícita para aplicar a normalização de caminhos do sandbox e dicas de acesso à mídia de saída sem codificar diretamente os nomes dos parâmetros pertencentes ao plugin. Prefira mapas com escopo por ação nesse local, em vez de uma única lista simples para todo o canal, para que um parâmetro de mídia exclusivo do perfil não seja normalizado em ações não relacionadas, como `send`.

O núcleo passa o escopo do runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` confiável recebido na entrada

Isso é importante para plugins sensíveis ao contexto. Um canal pode ocultar ou expor ações de mensagem com base na conta ativa, sala/thread/mensagem atual ou identidade confiável do solicitante, sem codificar diretamente ramificações específicas do canal na ferramenta central `message`.

É por isso que alterações de roteamento do executor incorporado continuam sendo responsabilidade do plugin: o executor é responsável por encaminhar a identidade atual do chat/sessão para o limite de descoberta do plugin, para que a ferramenta compartilhada `message` exponha a superfície correta, pertencente ao canal, para o turno atual.

Para auxiliares de execução pertencentes ao canal, os plugins incluídos devem manter o runtime de execução dentro de seus próprios módulos de plugin. O núcleo não é mais responsável pelos runtimes de ações de mensagem do Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`. Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e os plugins incluídos devem importar diretamente o próprio código de runtime local de seus módulos pertencentes ao plugin.

O mesmo limite se aplica, em geral, às interfaces do SDK nomeadas por provedor: o núcleo não deve importar barrels de conveniência específicos de canal para Discord, Signal, Slack, WhatsApp ou plugins semelhantes. Se o núcleo precisar de um comportamento, ele deverá consumir o barrel `api.ts` / `runtime-api.ts` do próprio plugin incluído ou promover a necessidade a um recurso genérico e restrito no SDK compartilhado.

Os plugins incluídos seguem a mesma regra. O `runtime-api.ts` de um plugin incluído não deve reexportar sua própria fachada identificada por marca `openclaw/plugin-sdk/<plugin-id>`. Essas fachadas identificadas por marca continuam sendo shims de compatibilidade para plugins externos e consumidores mais antigos, mas os plugins incluídos devem usar exportações locais e subcaminhos genéricos restritos do SDK, como `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` ou `openclaw/plugin-sdk/webhook-ingress`. Código novo não deve adicionar fachadas de SDK específicas do ID do plugin, a menos que o limite de compatibilidade de um ecossistema externo existente exija isso.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a base compartilhada para canais que se adaptam ao modelo comum de enquete
- `actions.handleAction("poll")` é o caminho preferencial para semânticas de enquete específicas do canal ou parâmetros adicionais de enquete

Agora, o núcleo adia a análise compartilhada da enquete até que o despacho da enquete pelo plugin recuse a ação, permitindo que manipuladores de enquete pertencentes ao plugin aceitem campos de enquete específicos do canal sem que o analisador genérico de enquetes os bloqueie primeiro.

Consulte [detalhes internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals) para ver a sequência completa de inicialização.

## Modelo de propriedade de recursos

O OpenClaw trata um plugin nativo como o limite de propriedade de uma **empresa** ou de uma **funcionalidade**, não como um conjunto aleatório de integrações não relacionadas.

Isso significa que:

- um plugin de empresa normalmente deve ser responsável por todas as superfícies dessa empresa voltadas ao OpenClaw
- um plugin de funcionalidade normalmente deve ser responsável por toda a superfície da funcionalidade que introduz
- os canais devem consumir recursos compartilhados do núcleo em vez de reimplementar de forma ad hoc o comportamento do provedor

<AccordionGroup>
  <Accordion title="Fornecedor com vários recursos">
    `google` é responsável por inferência de texto, backend da CLI, embeddings, fala, voz em tempo real, compreensão de mídia, geração de imagens/música/vídeos e pesquisa na web. `openai` é responsável por inferência de texto, embeddings, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia e geração de imagens/vídeos. `minimax` é responsável por inferência de texto, além de compreensão de mídia, fala, geração de imagens/música/vídeos e pesquisa na web.
  </Accordion>
  <Accordion title="Fornecedor com um único recurso">
    `arcee` e `chutes` são responsáveis apenas pela inferência de texto; `microsoft` é responsável apenas por fala. Um plugin de fornecedor pode permanecer com esse escopo restrito até precisar abranger uma parte maior da superfície desse fornecedor.
  </Accordion>
  <Accordion title="Plugin de funcionalidade">
    `voice-call` é responsável pelo transporte de chamadas, ferramentas, CLI, rotas e intermediação do fluxo de mídia do Twilio, mas consome recursos compartilhados de fala, transcrição em tempo real e voz em tempo real em vez de importar plugins de fornecedores diretamente.
  </Accordion>
</AccordionGroup>

O estado final pretendido é:

- a superfície de um fornecedor voltada ao OpenClaw reside em um único plugin, mesmo que abranja modelos de texto, fala, imagens e vídeo
- outros fornecedores podem fazer o mesmo para as próprias áreas de atuação
- os canais não precisam saber qual plugin de fornecedor é responsável pelo provedor; eles consomem o contrato de recurso compartilhado exposto pelo núcleo

Esta é a distinção fundamental:

- **plugin** = limite de propriedade
- **recurso** = contrato do núcleo que vários plugins podem implementar ou consumir

Portanto, se o OpenClaw adicionar um novo domínio, como vídeo, a primeira pergunta não será "qual provedor deve codificar diretamente o processamento de vídeo?". A primeira pergunta será "qual é o contrato central do recurso de vídeo?". Depois que esse contrato existir, os plugins de fornecedores poderão se registrar nele e os plugins de canal/funcionalidade poderão consumi-lo.

Se o recurso ainda não existir, a ação correta geralmente será:

<Steps>
  <Step title="Definir o recurso">
    Defina no núcleo o recurso que está faltando.
  </Step>
  <Step title="Expor por meio do SDK">
    Exponha-o de forma tipada por meio da API/runtime do plugin.
  </Step>
  <Step title="Integrar consumidores">
    Integre canais/funcionalidades a esse recurso.
  </Step>
  <Step title="Implementações dos fornecedores">
    Permita que plugins de fornecedores registrem implementações.
  </Step>
</Steps>

Isso mantém a propriedade explícita e evita que o comportamento do núcleo dependa de um único fornecedor ou de um caminho de código específico e isolado para um plugin.

### Camadas de recursos

Use este modelo mental ao decidir onde o código deve ficar:

<Tabs>
  <Tab title="Camada de recursos do núcleo">
    Orquestração compartilhada, política, fallback, regras de mesclagem de configuração, semântica de entrega e contratos tipados.
  </Tab>
  <Tab title="Camada de plugins de fornecedores">
    APIs específicas do fornecedor, autenticação, catálogos de modelos, síntese de fala, geração de imagens, backends de vídeo e endpoints de uso.
  </Tab>
  <Tab title="Camada de plugins de canal/funcionalidade">
    Integração com Discord/Slack/voice-call/etc. que consome recursos do núcleo e os apresenta em uma superfície.
  </Tab>
</Tabs>

Por exemplo, o TTS segue esta estrutura:

- o núcleo é responsável pela política de TTS no momento da resposta, pela ordem de fallback, pelas preferências e pela entrega no canal
- `elevenlabs`, `google`, `microsoft` e `openai` são responsáveis pelas implementações de síntese
- `voice-call` consome o auxiliar de runtime de TTS para telefonia

Esse mesmo padrão deve ser preferido para recursos futuros.

### Exemplo de plugin de empresa com vários recursos

Um plugin de empresa deve parecer coeso externamente. Se o OpenClaw tiver contratos compartilhados para modelos, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia, geração de imagens, geração de vídeos, obtenção de conteúdo da web e pesquisa na web, um fornecedor poderá ser responsável por todas as suas superfícies em um único lugar:

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
      // hooks de autenticação/catálogo de modelos/runtime
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
        // lógica de credenciais + busca
      }),
    );
  },
};

export default plugin;
```

O que importa não são os nomes exatos dos auxiliares. A estrutura é o que importa:

- um único plugin é responsável pela superfície do fornecedor
- o núcleo continua sendo responsável pelos contratos de recursos
- canais e plugins de funcionalidade consomem auxiliares `api.runtime.*`, não código do fornecedor
- testes de contrato podem verificar se o plugin registrou os recursos pelos quais declara ser responsável

### Exemplo de recurso: compreensão de vídeo

O OpenClaw já trata a compreensão de imagens/áudio/vídeo como um único recurso compartilhado. O mesmo modelo de propriedade se aplica nesse caso:

<Steps>
  <Step title="O núcleo define o contrato">
    O núcleo define o contrato de compreensão de mídia.
  </Step>
  <Step title="Plugins de fornecedores se registram">
    Os plugins de fornecedores registram `describeImage`, `transcribeAudio` e `describeVideo`, conforme aplicável.
  </Step>
  <Step title="Os consumidores usam o comportamento compartilhado">
    Canais e plugins de funcionalidade consomem o comportamento compartilhado do núcleo em vez de se conectarem diretamente ao código do fornecedor.
  </Step>
</Steps>

Isso evita incorporar ao núcleo as suposições de vídeo de um único provedor. O plugin é responsável pela superfície do fornecedor; o núcleo é responsável pelo contrato do recurso e pelo comportamento de fallback.

A geração de vídeos já usa essa mesma sequência: o núcleo é responsável pelo contrato tipado do recurso e pelo auxiliar de runtime, enquanto os plugins de fornecedores registram implementações de `api.registerVideoGenerationProvider(...)` nesse contrato.

Precisa de uma lista de verificação concreta para a implementação? Consulte o [Guia prático de recursos](/pt-BR/plugins/adding-capabilities).

## Contratos e fiscalização

A superfície da API de plugins é intencionalmente tipada e centralizada em `OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e os auxiliares de runtime dos quais um plugin pode depender.

Por que isso é importante:

- os autores de plugins têm um único padrão interno estável
- o núcleo pode rejeitar propriedade duplicada, como dois plugins registrando o mesmo id de provedor
- a inicialização pode apresentar diagnósticos acionáveis para registros malformados
- testes de contrato podem impor a propriedade de plugins integrados e evitar divergências silenciosas

Há duas camadas de imposição:

<AccordionGroup>
  <Accordion title="Imposição de registro em runtime">
    O registro de plugins valida os registros à medida que os plugins são carregados. Exemplos: ids de provedor duplicados, ids de provedor de fala duplicados e registros malformados produzem diagnósticos de plugin em vez de comportamento indefinido.
  </Accordion>
  <Accordion title="Testes de contrato">
    Os plugins integrados são capturados em registros de contrato durante as execuções de teste para que o OpenClaw possa verificar explicitamente a propriedade. Atualmente, isso é usado para provedores de modelos, provedores de fala, provedores de pesquisa na web e propriedade de registros integrados.
  </Accordion>
</AccordionGroup>

O efeito prático é que o OpenClaw sabe, antecipadamente, qual plugin é proprietário de cada superfície. Isso permite que o núcleo e os canais funcionem em conjunto de forma integrada, pois a propriedade é declarada, tipada e testável, em vez de implícita.

### O que pertence a um contrato

<Tabs>
  <Tab title="Bons contratos">
    - tipados
    - pequenos
    - específicos por recurso
    - pertencentes ao núcleo
    - reutilizáveis por vários plugins
    - utilizáveis por canais/recursos sem conhecimento do fornecedor

  </Tab>
  <Tab title="Contratos inadequados">
    - política específica do fornecedor oculta no núcleo
    - mecanismos de escape pontuais de plugins que contornam o registro
    - código de canal acessando diretamente uma implementação de fornecedor
    - objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` nem de `api.runtime`

  </Tab>
</Tabs>

Em caso de dúvida, eleve o nível de abstração: primeiro defina o recurso e depois permita que os plugins se integrem a ele.

## Modelo de execução

Os plugins nativos do OpenClaw são executados **no mesmo processo** que o Gateway. Eles não são isolados em sandbox. Um plugin nativo carregado tem o mesmo limite de confiança no nível do processo que o código do núcleo.

<Warning>
Implicações dos plugins nativos: um plugin pode registrar ferramentas, manipuladores de rede, hooks e serviços; um bug em um plugin pode causar falha ou instabilidade no Gateway; e um plugin nativo malicioso equivale à execução arbitrária de código dentro do processo do OpenClaw.
</Warning>

Os pacotes compatíveis são mais seguros por padrão, pois atualmente o OpenClaw os trata como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente Skills integradas.

Use listas de permissões e caminhos explícitos de instalação/carregamento para plugins não integrados. Trate plugins do workspace como código de desenvolvimento, não como padrões de produção.

Para nomes de pacotes integrados do workspace, mantenha o id do plugin ancorado no nome npm: `@openclaw/<id>` por padrão, ou use um sufixo tipado aprovado, como `-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding`, quando o pacote expuser intencionalmente uma função de plugin mais restrita.

<Note>
**Observação sobre confiança:** `plugins.allow` confia em **ids de plugins**, não na procedência do código-fonte. Um plugin do workspace com o mesmo id de um plugin integrado substitui intencionalmente a cópia integrada quando esse plugin do workspace está habilitado/incluído na lista de permissões. Isso é normal e útil para desenvolvimento local, testes de patches e correções emergenciais. A confiança em plugins integrados é determinada pelo snapshot do código-fonte — o manifesto e o código presentes no disco no momento do carregamento — e não pelos metadados de instalação. Um registro de instalação corrompido ou substituído não pode ampliar silenciosamente a superfície de confiança de um plugin integrado além do que o código-fonte real declara.
</Note>

## Limite de exportação

O OpenClaw exporta recursos, não conveniências de implementação.

Mantenha público o registro de recursos. Remova exportações auxiliares que não fazem parte do contrato:

- subcaminhos auxiliares específicos de plugins integrados
- subcaminhos da infraestrutura de runtime que não se destinam a ser API pública
- auxiliares de conveniência específicos de fornecedores
- auxiliares de configuração/integração inicial que são detalhes de implementação

Os subcaminhos auxiliares reservados de plugins integrados foram removidos do mapa de exportação gerado do SDK. Mantenha os auxiliares específicos do proprietário dentro do pacote do plugin correspondente; promova apenas comportamentos reutilizáveis do host a contratos genéricos do SDK, como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

## Detalhes internos e referência

Para conhecer o pipeline de carregamento, o modelo de registro, os hooks de runtime dos provedores, as rotas HTTP do Gateway, os esquemas das ferramentas de mensagens, a resolução de destinos de canais, os catálogos de provedores, os plugins do mecanismo de contexto e o guia para adicionar um novo recurso, consulte [Detalhes internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals).

## Relacionados

- [Criação de plugins](/pt-BR/plugins/building-plugins)
- [Manifesto de plugin](/pt-BR/plugins/manifest)
- [Configuração do SDK de plugins](/pt-BR/plugins/sdk-setup)
