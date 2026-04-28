---
read_when:
    - Criando ou depurando plugins nativos do OpenClaw
    - Entendendo o modelo de capacidades de Plugin ou limites de propriedade
    - Trabalhando no pipeline de carregamento ou registro de Plugin
    - Implementando hooks de runtime de provedor ou plugins de canal
sidebarTitle: Internals
summary: 'Internos de Plugin: modelo de capacidades, propriedade, contratos, pipeline de carregamento e auxiliares de runtime'
title: Internos de Plugin
x-i18n:
    generated_at: "2026-04-26T11:33:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16664d284a8bfbfcb9914bb012d1f36dfdd60406636d6bf4b011f76e886cb518
    source_path: plugins/architecture.md
    workflow: 15
---

Esta é a **referência profunda de arquitetura** do sistema de plugins do OpenClaw. Para guias práticos, comece por uma das páginas focadas abaixo.

<CardGroup cols={2}>
  <Card title="Instalar e usar plugins" icon="plug" href="/pt-BR/tools/plugin">
    Guia para usuários finais sobre como adicionar, ativar e solucionar problemas de plugins.
  </Card>
  <Card title="Criando plugins" icon="rocket" href="/pt-BR/plugins/building-plugins">
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

| Capacidade             | Método de registro                              | Plugins de exemplo                    |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferência de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferência CLI  | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Fala                  | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Entendimento de mídia  | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Geração de imagem      | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Geração de música      | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Busca na web           | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pesquisa na web        | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensagens      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Descoberta do Gateway  | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Um plugin que registra zero capacidades, mas fornece hooks, ferramentas, serviços de descoberta ou serviços em segundo plano é um plugin **legado somente de hooks**. Esse padrão continua totalmente compatível.
</Note>

### Posição de compatibilidade externa

O modelo de capacidades já foi adotado no core e é usado hoje por plugins nativos/empacotados, mas a compatibilidade de plugins externos ainda precisa de um padrão mais rígido do que “está exportado, portanto está congelado”.

| Situação do plugin                                  | Orientação                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugins externos existentes                         | Mantenha integrações baseadas em hooks funcionando; esta é a linha de base de compatibilidade.                        |
| Novos plugins nativos/empacotados                        | Prefira registro explícito de capacidades em vez de acessos específicos de fornecedor ou novos designs somente com hooks. |
| Plugins externos adotando registro de capacidades | Permitido, mas trate superfícies auxiliares específicas de capacidade como evolutivas, a menos que a documentação as marque como estáveis. |

O registro de capacidades é a direção pretendida. Hooks legados continuam sendo o caminho mais seguro, sem quebra, para plugins externos durante a transição. Nem todos os subcaminhos auxiliares exportados são iguais — prefira contratos estreitos e documentados em vez de exportações auxiliares incidentais.

### Formatos de plugin

O OpenClaw classifica cada plugin carregado em um formato com base em seu comportamento real de registro (não apenas em metadados estáticos):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registra exatamente um tipo de capacidade (por exemplo, um plugin apenas de provedor como `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registra vários tipos de capacidade (por exemplo, `openai` é responsável por inferência de texto, fala, entendimento de mídia e geração de imagem).
  </Accordion>
  <Accordion title="hook-only">
    Registra apenas hooks (tipados ou personalizados), sem capacidades, ferramentas, comandos ou serviços.
  </Accordion>
  <Accordion title="non-capability">
    Registra ferramentas, comandos, serviços ou rotas, mas nenhuma capacidade.
  </Accordion>
</AccordionGroup>

Use `openclaw plugins inspect <id>` para ver o formato e o detalhamento de capacidades de um plugin. Consulte [Referência da CLI](/pt-BR/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como caminho de compatibilidade para plugins somente com hooks. Plugins legados do mundo real ainda dependem dele.

Direção:

- mantenha-o funcionando
- documente-o como legado
- prefira `before_model_resolve` para trabalho de substituição de modelo/provedor
- prefira `before_prompt_build` para trabalho de mutação de prompt
- remova-o apenas depois que o uso real cair e a cobertura de fixtures provar segurança na migração

### Sinais de compatibilidade

Quando você executa `openclaw doctor` ou `openclaw plugins inspect <id>`, pode ver um destes rótulos:

| Sinal                     | Significado                                                      |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | A configuração é analisada corretamente e os plugins são resolvidos                       |
| **compatibility advisory** | O plugin usa um padrão compatível, mas mais antigo (por exemplo, `hook-only`) |
| **legacy warning**         | O plugin usa `before_agent_start`, que está descontinuado        |
| **hard error**             | A configuração é inválida ou o plugin falhou ao carregar                   |

Nem `hook-only` nem `before_agent_start` quebrarão seu plugin hoje: `hook-only` é apenas consultivo, e `before_agent_start` aciona apenas um aviso. Esses sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

<Steps>
  <Step title="Manifesto + descoberta">
    O OpenClaw encontra plugins candidatos em caminhos configurados, raízes de workspace, raízes globais de plugins e plugins empacotados. A descoberta lê primeiro manifestos nativos `openclaw.plugin.json` e manifestos de pacote compatíveis.
  </Step>
  <Step title="Ativação + validação">
    O core decide se um plugin descoberto está ativado, desativado, bloqueado ou selecionado para um slot exclusivo, como memória.
  </Step>
  <Step title="Carregamento de runtime">
    Plugins nativos do OpenClaw são carregados in-process via jiti e registram capacidades em um registro central. Pacotes compatíveis são normalizados em registros de registro sem importar código de runtime.
  </Step>
  <Step title="Consumo de superfície">
    O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração de provedor, hooks, rotas HTTP, comandos CLI e serviços.
  </Step>
</Steps>

Especificamente para a CLI de plugins, a descoberta do comando raiz é dividida em duas fases:

- os metadados em tempo de parsing vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real da CLI do plugin pode permanecer lazy e se registrar na primeira invocação

Isso mantém o código da CLI do plugin dentro do plugin, ao mesmo tempo que permite ao OpenClaw reservar nomes de comandos raiz antes do parsing.

O limite de design importante:

- a validação de manifesto/configuração deve funcionar a partir de metadados de **manifesto/schema** sem executar código do plugin
- a descoberta nativa de capacidades pode carregar código de entrada de plugin confiável para construir um snapshot de registro não ativador
- o comportamento nativo de runtime vem do caminho `register(api)` do módulo do plugin com `api.registrationMode === "full"`

Essa divisão permite ao OpenClaw validar configuração, explicar plugins ausentes/desativados e construir dicas de UI/schema antes de o runtime completo estar ativo.

### Planejamento de ativação

O planejamento de ativação faz parte do plano de controle. Chamadores podem perguntar quais plugins são relevantes para um comando, provedor, canal, rota, harness de agente ou capacidade concretos antes de carregar registros de runtime mais amplos.

O planejador mantém o comportamento atual do manifesto compatível:

- campos `activation.*` são dicas explícitas para o planejador
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` e hooks continuam sendo fallback de propriedade do manifesto
- a API do planejador apenas com ids continua disponível para chamadores existentes
- a API de plano relata rótulos de motivo para que diagnósticos possam distinguir dicas explícitas de fallback de propriedade

<Warning>
Não trate `activation` como um hook de ciclo de vida nem como substituto para `register(...)`. Ele é um metadado usado para restringir o carregamento. Prefira campos de propriedade quando eles já descrevem a relação; use `activation` apenas para dicas extras ao planejador.
</Warning>

### Plugins de canal e a ferramenta compartilhada de mensagens

Plugins de canal não precisam registrar uma ferramenta separada de enviar/editar/reagir para ações normais de chat. O OpenClaw mantém uma única ferramenta compartilhada `message` no core, e plugins de canal são responsáveis pela descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o core é responsável pelo host compartilhado da ferramenta `message`, integração com prompt, bookkeeping de sessão/thread e despacho de execução
- plugins de canal são responsáveis pela descoberta de ações com escopo, descoberta de capacidades e quaisquer fragmentos de schema específicos do canal
- plugins de canal são responsáveis pela gramática de conversa de sessão específica do provedor, como ids de conversa codificam ids de thread ou herdam de conversas pai
- plugins de canal executam a ação final por meio de seu adaptador de ação

Para plugins de canal, a superfície do SDK é `ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta permite que um plugin retorne suas ações visíveis, capacidades e contribuições de schema em conjunto, para que essas partes não se desalinhem.

Quando um parâmetro da ferramenta de mensagens específico de canal carrega uma fonte de mídia, como um caminho local ou URL remota de mídia, o plugin também deve retornar `mediaSourceParams` de `describeMessageTool(...)`. O core usa essa lista explícita para aplicar normalização de caminho de sandbox e dicas de acesso de mídia de saída sem codificar nomes de parâmetros pertencentes ao plugin. Prefira mapas com escopo por ação ali, não uma lista plana por canal, para que um parâmetro de mídia apenas de perfil não seja normalizado em ações não relacionadas como `send`.

O core passa o escopo de runtime para essa etapa de descoberta. Campos importantes incluem:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` de entrada confiável

Isso importa para plugins sensíveis ao contexto. Um canal pode ocultar ou expor ações de mensagem com base na conta ativa, sala/thread/mensagem atual ou identidade confiável do solicitante, sem codificar branches específicas de canal na ferramenta `message` do core.

É por isso que mudanças de roteamento do runner embutido ainda são trabalho de plugin: o runner é responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta do plugin para que a ferramenta compartilhada `message` exponha a superfície pertencente ao canal correta para o turno atual.

Para auxiliares de execução pertencentes ao canal, plugins empacotados devem manter o runtime de execução dentro de seus próprios módulos de extensão. O core não é mais responsável pelos runtimes de ação de mensagem do Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`. Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e plugins empacotados devem importar seu próprio código local de runtime diretamente de seus módulos pertencentes à extensão.

O mesmo limite se aplica a seams do SDK nomeados por provedor em geral: o core não deve importar barrels de conveniência específicos de canal para extensões como Slack, Discord, Signal, WhatsApp ou semelhantes. Se o core precisar de um comportamento, deve consumir o próprio barrel `api.ts` / `runtime-api.ts` do plugin empacotado ou promover a necessidade para uma capacidade genérica e estreita no SDK compartilhado.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a linha de base compartilhada para canais que se encaixam no modelo comum de enquete
- `actions.handleAction("poll")` é o caminho preferido para semântica de enquete específica do canal ou parâmetros extras de enquete

O core agora adia o parsing compartilhado de enquete até depois que o despacho de enquete do plugin recusa a ação, para que handlers de enquete pertencentes ao plugin possam aceitar campos de enquete específicos do canal sem serem bloqueados antes pelo parser genérico de enquete.

Consulte [Internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals) para a sequência completa de inicialização.

## Modelo de propriedade de capacidades

O OpenClaw trata um plugin nativo como o limite de propriedade de uma **empresa** ou de um **recurso**, não como uma coleção aleatória de integrações sem relação.

Isso significa:

- um plugin de empresa normalmente deve ser dono de todas as superfícies do OpenClaw voltadas para essa empresa
- um plugin de recurso normalmente deve ser dono da superfície completa do recurso que ele introduz
- canais devem consumir capacidades compartilhadas do core em vez de reimplementar comportamento de provedor de forma ad hoc

<AccordionGroup>
  <Accordion title="Fornecedor com múltiplas capacidades">
    `openai` é responsável por inferência de texto, fala, voz em tempo real, entendimento de mídia e geração de imagem. `google` é responsável por inferência de texto mais entendimento de mídia, geração de imagem e pesquisa na web. `qwen` é responsável por inferência de texto mais entendimento de mídia e geração de vídeo.
  </Accordion>
  <Accordion title="Fornecedor com capacidade única">
    `elevenlabs` e `microsoft` são responsáveis por fala; `firecrawl` é responsável por busca na web; `minimax` / `mistral` / `moonshot` / `zai` são responsáveis por backends de entendimento de mídia.
  </Accordion>
  <Accordion title="Plugin de recurso">
    `voice-call` é responsável por transporte de chamada, ferramentas, CLI, rotas e ponte de fluxo de mídia do Twilio, mas consome capacidades compartilhadas de fala, transcrição em tempo real e voz em tempo real em vez de importar plugins de fornecedor diretamente.
  </Accordion>
</AccordionGroup>

O estado final pretendido é:

- OpenAI vive em um único plugin mesmo que abranja modelos de texto, fala, imagens e vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual plugin de fornecedor é dono do provedor; eles consomem o contrato de capacidade compartilhado exposto pelo core

Esta é a distinção principal:

- **plugin** = limite de propriedade
- **capacidade** = contrato do core que vários plugins podem implementar ou consumir

Então, se o OpenClaw adicionar um novo domínio como vídeo, a primeira pergunta não é “qual provedor deve codificar rigidamente o tratamento de vídeo?”. A primeira pergunta é “qual é o contrato central de capacidade de vídeo?”. Quando esse contrato existir, plugins de fornecedor poderão se registrar nele e plugins de canal/recurso poderão consumi-lo.

Se a capacidade ainda não existir, o movimento correto normalmente é:

<Steps>
  <Step title="Definir a capacidade">
    Definir a capacidade ausente no core.
  </Step>
  <Step title="Expor pelo SDK">
    Expô-la pela API/runtime do plugin de forma tipada.
  </Step>
  <Step title="Conectar consumidores">
    Conectar canais/recursos a essa capacidade.
  </Step>
  <Step title="Implementações de fornecedor">
    Permitir que plugins de fornecedor registrem implementações.
  </Step>
</Steps>

Isso mantém a propriedade explícita, evitando ao mesmo tempo comportamento do core que dependa de um único fornecedor ou de um caminho de código específico de plugin e isolado.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código pertence:

<Tabs>
  <Tab title="Camada de capacidade do core">
    Orquestração compartilhada, política, fallback, regras de mesclagem de configuração, semântica de entrega e contratos tipados.
  </Tab>
  <Tab title="Camada de plugin de fornecedor">
    APIs específicas do fornecedor, autenticação, catálogos de modelos, síntese de fala, geração de imagem, backends futuros de vídeo, endpoints de uso.
  </Tab>
  <Tab title="Camada de plugin de canal/recurso">
    Integrações como Slack/Discord/voice-call/etc. que consomem capacidades do core e as apresentam em uma superfície.
  </Tab>
</Tabs>

Por exemplo, TTS segue esse formato:

- o core é responsável por política de TTS no momento da resposta, ordem de fallback, preferências e entrega por canal
- `openai`, `elevenlabs` e `microsoft` são responsáveis pelas implementações de síntese
- `voice-call` consome o helper de runtime de TTS para telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de plugin de empresa com múltiplas capacidades

Um plugin de empresa deve parecer coeso por fora. Se o OpenClaw tiver contratos compartilhados para modelos, fala, transcrição em tempo real, voz em tempo real, entendimento de mídia, geração de imagem, geração de vídeo, busca na web e pesquisa na web, um fornecedor pode ser dono de todas as suas superfícies em um só lugar:

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
      // configuração de fala do fornecedor — implemente a interface SpeechProviderPlugin diretamente
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
        // lógica de credencial + busca
      }),
    );
  },
};

export default plugin;
```

O que importa não são os nomes exatos dos helpers. O formato importa:

- um plugin é dono da superfície do fornecedor
- o core continua sendo dono dos contratos de capacidade
- canais e plugins de recurso consomem helpers `api.runtime.*`, não código do fornecedor
- testes de contrato podem afirmar que o plugin registrou as capacidades que declara possuir

### Exemplo de capacidade: entendimento de vídeo

O OpenClaw já trata entendimento de imagem/áudio/vídeo como uma única capacidade compartilhada. O mesmo modelo de propriedade se aplica aqui:

<Steps>
  <Step title="O core define o contrato">
    O core define o contrato de entendimento de mídia.
  </Step>
  <Step title="Plugins de fornecedor se registram">
    Plugins de fornecedor registram `describeImage`, `transcribeAudio` e `describeVideo`, conforme aplicável.
  </Step>
  <Step title="Consumidores usam o comportamento compartilhado">
    Canais e plugins de recurso consomem o comportamento compartilhado do core em vez de se conectar diretamente ao código do fornecedor.
  </Step>
</Steps>

Isso evita incorporar no core pressupostos de vídeo de um único provedor. O plugin é dono da superfície do fornecedor; o core é dono do contrato de capacidade e do comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o core é dono do contrato tipado de capacidade e do helper de runtime, e plugins de fornecedor registram implementações `api.registerVideoGenerationProvider(...)` nele.

Precisa de um checklist concreto de rollout? Consulte [Capability Cookbook](/pt-BR/plugins/architecture).

## Contratos e aplicação

A superfície da API de plugins é intencionalmente tipada e centralizada em `OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e os helpers de runtime em que um plugin pode confiar.

Por que isso importa:

- autores de plugins obtêm um padrão interno estável
- o core pode rejeitar propriedade duplicada, como dois plugins registrando o mesmo id de provedor
- a inicialização pode expor diagnósticos acionáveis para registros malformados
- testes de contrato podem impor a propriedade de plugins empacotados e evitar desvio silencioso

Há duas camadas de aplicação:

<AccordionGroup>
  <Accordion title="Aplicação de registro em runtime">
    O registro de plugins valida registros à medida que os plugins são carregados. Exemplos: ids de provedor duplicados, ids de provedor de fala duplicados e registros malformados produzem diagnósticos de plugin em vez de comportamento indefinido.
  </Accordion>
  <Accordion title="Testes de contrato">
    Plugins empacotados são capturados em registros de contrato durante execuções de teste, para que o OpenClaw possa afirmar explicitamente a propriedade. Hoje isso é usado para provedores de modelo, provedores de fala, provedores de pesquisa na web e propriedade de registro empacotado.
  </Accordion>
</AccordionGroup>

O efeito prático é que o OpenClaw sabe, de antemão, qual plugin é dono de qual superfície. Isso permite que core e canais componham sem atrito, porque a propriedade é declarada, tipada e testável, em vez de implícita.

### O que pertence a um contrato

<Tabs>
  <Tab title="Bons contratos">
    - tipados
    - pequenos
    - específicos de capacidade
    - pertencentes ao core
    - reutilizáveis por múltiplos plugins
    - consumíveis por canais/recursos sem conhecimento do fornecedor
  </Tab>
  <Tab title="Maus contratos">
    - política específica de fornecedor escondida no core
    - escapatórias isoladas de plugin que contornam o registro
    - código de canal acessando diretamente uma implementação de fornecedor
    - objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` ou `api.runtime`
  </Tab>
</Tabs>

Em caso de dúvida, eleve o nível de abstração: defina primeiro a capacidade e depois deixe os plugins se conectarem a ela.

## Modelo de execução

Plugins nativos do OpenClaw são executados **in-process** com o Gateway. Eles não são colocados em sandbox. Um plugin nativo carregado tem o mesmo limite de confiança no nível de processo que o código do core.

<Warning>
Implicações:

- um plugin nativo pode registrar ferramentas, handlers de rede, hooks e serviços
- um bug em plugin nativo pode travar ou desestabilizar o gateway
- um plugin nativo malicioso equivale à execução arbitrária de código dentro do processo do OpenClaw
</Warning>

Pacotes compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente Skills empacotadas.

Use allowlists e caminhos explícitos de instalação/carregamento para plugins não empacotados. Trate plugins de workspace como código de tempo de desenvolvimento, não como padrão de produção.

Para nomes de pacotes de workspace empacotados, mantenha o id do plugin ancorado no nome npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado como `-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` quando o pacote expuser intencionalmente um papel de plugin mais estreito.

<Note>
**Observação de confiança:**

- `plugins.allow` confia em **ids de plugin**, não na procedência da origem.
- Um plugin de workspace com o mesmo id de um plugin empacotado intencionalmente sombreia a cópia empacotada quando esse plugin de workspace está ativado/na allowlist.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.
- A confiança em plugins empacotados é resolvida a partir do snapshot da origem — o manifesto e o código em disco no momento do carregamento — e não dos metadados de instalação. Um registro de instalação corrompido ou substituído não pode ampliar silenciosamente a superfície de confiança de um plugin empacotado além do que a origem real declara.
</Note>

## Limite de exportação

O OpenClaw exporta capacidades, não conveniências de implementação.

Mantenha o registro de capacidades público. Reduza exportações auxiliares fora de contrato:

- subcaminhos auxiliares específicos de plugin empacotado
- subcaminhos de plumbing de runtime não destinados a API pública
- helpers de conveniência específicos de fornecedor
- helpers de configuração/onboarding que são detalhes de implementação

Alguns subcaminhos auxiliares de plugins empacotados ainda permanecem no mapa de exportação gerado do SDK para compatibilidade e manutenção de plugins empacotados. Exemplos atuais incluem `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup` e vários seams `plugin-sdk/matrix*`. Trate-os como exportações reservadas de detalhe de implementação, não como o padrão recomendado de SDK para novos plugins de terceiros.

## Internos e referência

Para o pipeline de carregamento, modelo de registro, hooks de runtime de provedor, rotas HTTP do Gateway, schemas da ferramenta de mensagens, resolução de destino de canal, catálogos de provedores, plugins do mecanismo de contexto e o guia para adicionar uma nova capacidade, consulte [Internos da arquitetura de plugins](/pt-BR/plugins/architecture-internals).

## Relacionados

- [Criando plugins](/pt-BR/plugins/building-plugins)
- [Manifesto de Plugin](/pt-BR/plugins/manifest)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
