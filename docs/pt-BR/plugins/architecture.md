---
read_when:
    - Criando ou depurando Plugins nativos do OpenClaw
    - Entendendo o modelo de capacidades de Plugin ou os limites de propriedade
    - Trabalhando no pipeline de carregamento ou no registro de Plugins
    - Implementando hooks de runtime de provider ou Plugins de canal
sidebarTitle: Internals
summary: 'Internos de Plugin: modelo de capacidades, propriedade, contratos, pipeline de carregamento e helpers de runtime'
title: Internos de Plugin
x-i18n:
    generated_at: "2026-04-25T13:50:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1fd7d9192c8c06aceeb6e8054a740bba27c94770e17eabf064627adda884e77
    source_path: plugins/architecture.md
    workflow: 15
---

Esta é a **referência profunda de arquitetura** do sistema de Plugins do OpenClaw. Para
guias práticos, comece por uma das páginas focadas abaixo.

<CardGroup cols={2}>
  <Card title="Instalar e usar Plugins" icon="plug" href="/pt-BR/tools/plugin">
    Guia para usuários finais adicionarem, ativarem e solucionarem problemas de Plugins.
  </Card>
  <Card title="Criando Plugins" icon="rocket" href="/pt-BR/plugins/building-plugins">
    Tutorial do primeiro Plugin com o menor manifest funcional.
  </Card>
  <Card title="Plugins de canal" icon="comments" href="/pt-BR/plugins/sdk-channel-plugins">
    Crie um Plugin de canal de mensagens.
  </Card>
  <Card title="Plugins de provider" icon="microchip" href="/pt-BR/plugins/sdk-provider-plugins">
    Crie um Plugin de provider de modelo.
  </Card>
  <Card title="Visão geral do SDK" icon="book" href="/pt-BR/plugins/sdk-overview">
    Referência do mapa de importação e da API de registro.
  </Card>
</CardGroup>

## Modelo público de capacidades

Capacidades são o modelo público de **Plugin nativo** dentro do OpenClaw. Todo
Plugin nativo do OpenClaw é registrado em um ou mais tipos de capacidade:

| Capacidade             | Método de registro                              | Exemplos de Plugins                  |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Inferência de texto    | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| Backend de inferência CLI | `api.registerCliBackend(...)`                 | `openai`, `anthropic`                |
| Fala                   | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                          |
| Voz em tempo real      | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Compreensão de mídia   | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Geração de imagem      | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Geração de música      | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Geração de vídeo       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Busca na web           | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pesquisa na web        | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensagens      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Descoberta do Gateway  | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

Um Plugin que registra zero capacidades, mas fornece hooks, ferramentas, serviços de descoberta
ou serviços em segundo plano, é um Plugin **legado apenas com hooks**. Esse padrão
continua totalmente compatível.

### Posição de compatibilidade externa

O modelo de capacidades já foi integrado ao core e é usado hoje por Plugins incluídos/nativos,
mas a compatibilidade com Plugins externos ainda precisa de um critério mais rígido do que “está
exportado, logo está congelado”.

| Situação do Plugin                                 | Orientação                                                                                         |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Plugins externos existentes                        | Mantenha integrações baseadas em hooks funcionando; esta é a linha de base de compatibilidade.    |
| Novos Plugins incluídos/nativos                    | Prefira registro explícito de capacidade a acessos específicos de fornecedor ou novos designs apenas com hooks. |
| Plugins externos adotando registro de capacidade   | Permitido, mas trate superfícies auxiliares específicas de capacidade como evolutivas, a menos que a documentação as marque como estáveis. |

O registro de capacidades é a direção pretendida. Hooks legados continuam sendo o
caminho mais seguro sem quebra para Plugins externos durante a transição. Subcaminhos auxiliares exportados não são todos equivalentes — prefira contratos estreitos e documentados em vez de exports auxiliares incidentais.

### Formatos de Plugin

O OpenClaw classifica cada Plugin carregado em um formato com base em seu comportamento real
de registro (não apenas em metadados estáticos):

- **plain-capability**: registra exatamente um tipo de capacidade (por exemplo um
  Plugin apenas de provider como `mistral`).
- **hybrid-capability**: registra vários tipos de capacidade (por exemplo
  `openai` controla inferência de texto, fala, compreensão de mídia e geração
  de imagem).
- **hook-only**: registra apenas hooks (tipados ou personalizados), sem
  capacidades, ferramentas, comandos ou serviços.
- **non-capability**: registra ferramentas, comandos, serviços ou rotas, mas nenhuma
  capacidade.

Use `openclaw plugins inspect <id>` para ver o formato e o detalhamento de capacidades de um Plugin. Consulte [Referência de CLI](/pt-BR/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como um caminho de compatibilidade para
Plugins apenas com hooks. Plugins legados do mundo real ainda dependem dele.

Direção:

- mantê-lo funcional
- documentá-lo como legado
- preferir `before_model_resolve` para trabalho de substituição de modelo/provider
- preferir `before_prompt_build` para trabalho de mutação de prompt
- removê-lo apenas depois que o uso real cair e a cobertura de fixtures comprovar a segurança da migração

### Sinais de compatibilidade

Quando você executa `openclaw doctor` ou `openclaw plugins inspect <id>`, pode ver
um destes rótulos:

| Sinal                      | Significado                                                  |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | A configuração é analisada corretamente e os Plugins são resolvidos |
| **compatibility advisory** | O Plugin usa um padrão compatível, porém mais antigo (por exemplo `hook-only`) |
| **legacy warning**         | O Plugin usa `before_agent_start`, que está obsoleto         |
| **hard error**             | A configuração é inválida ou o Plugin não foi carregado      |

Nem `hook-only` nem `before_agent_start` quebrarão seu Plugin hoje:
`hook-only` é consultivo, e `before_agent_start` apenas aciona um aviso. Esses
sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de Plugins do OpenClaw tem quatro camadas:

1. **Manifest + descoberta**
   O OpenClaw encontra Plugins candidatos a partir de caminhos configurados, raízes de workspace,
   raízes globais de Plugins e Plugins incluídos. A descoberta lê primeiro
   manifests nativos `openclaw.plugin.json` mais manifests de bundle compatíveis.
2. **Ativação + validação**
   O core decide se um Plugin descoberto está ativado, desativado, bloqueado ou
   selecionado para um slot exclusivo, como memória.
3. **Carregamento em runtime**
   Plugins nativos do OpenClaw são carregados in-process via jiti e registram
   capacidades em um registro central. Bundles compatíveis são normalizados em
   registros de registro sem importar código de runtime.
4. **Consumo de superfície**
   O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração
   de provider, hooks, rotas HTTP, comandos CLI e serviços.

Especificamente para a CLI de Plugin, a descoberta de comando raiz é dividida em duas fases:

- os metadados em tempo de análise vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real de CLI do Plugin pode permanecer lazy e registrar-se na primeira invocação

Isso mantém o código de CLI de propriedade do Plugin dentro do próprio Plugin, ao mesmo tempo que permite ao OpenClaw
reservar nomes de comandos raiz antes da análise.

O limite de design importante:

- a validação de manifest/configuração deve funcionar a partir de **metadados de manifest/schema**
  sem executar código do Plugin
- a descoberta nativa de capacidades pode carregar código de entrada de Plugin confiável para construir um
  snapshot de registro não ativador
- o comportamento nativo em runtime vem do caminho `register(api)` do módulo do Plugin
  com `api.registrationMode === "full"`

Essa divisão permite que o OpenClaw valide a configuração, explique Plugins ausentes/desativados e
construa dicas de UI/schema antes que o runtime completo esteja ativo.

### Planejamento de ativação

O planejamento de ativação faz parte do plano de controle. Chamadores podem perguntar quais Plugins
são relevantes para um comando, provider, canal, rota, harness de agente ou
capacidade concretos antes de carregar registros mais amplos de runtime.

O planejador mantém o comportamento atual de manifest compatível:

- campos `activation.*` são dicas explícitas do planejador
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` e hooks continuam sendo fallback de propriedade do manifest
- a API do planejador somente com IDs continua disponível para chamadores existentes
- a API do plano relata rótulos de motivo para que diagnósticos possam distinguir dicas explícitas de fallback de propriedade

Não trate `activation` como hook de ciclo de vida nem como substituto de
`register(...)`. Ele é um metadado usado para restringir o carregamento. Prefira campos de propriedade
quando eles já descrevem a relação; use `activation` apenas para dicas extras do planejador.

### Plugins de canal e a ferramenta compartilhada de mensagens

Plugins de canal não precisam registrar uma ferramenta separada de enviar/editar/reagir para
ações normais de chat. O OpenClaw mantém uma única ferramenta `message` compartilhada no core, e
Plugins de canal controlam a descoberta e a execução específicas do canal por trás dela.

O limite atual é:

- o core controla o host da ferramenta compartilhada `message`, a integração com o prompt, o
  bookkeeping de sessão/thread e o despacho de execução
- Plugins de canal controlam a descoberta de ações com escopo, a descoberta de capacidades e quaisquer
  fragmentos de schema específicos do canal
- Plugins de canal controlam a gramática de conversa de sessão específica do provider, como
  IDs de conversa codificam IDs de thread ou herdam de conversas pai
- Plugins de canal executam a ação final por meio de seu adaptador de ação

Para Plugins de canal, a superfície de SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta
permite que um Plugin retorne suas ações visíveis, capacidades e contribuições
de schema juntas, para que essas partes não se desalinhem.

Quando um parâmetro específico do canal da ferramenta de mensagens carrega uma origem de mídia como
um caminho local ou URL remota de mídia, o Plugin também deve retornar
`mediaSourceParams` de `describeMessageTool(...)`. O core usa essa lista explícita
para aplicar normalização de caminho de sandbox e dicas de acesso a mídia de saída
sem codificar nomes de parâmetros de propriedade do Plugin.
Prefira mapas com escopo por ação aí, não uma única lista plana por canal, para que um
parâmetro de mídia apenas de perfil não seja normalizado em ações não relacionadas como
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

Isso importa para Plugins sensíveis ao contexto. Um canal pode ocultar ou expor
ações de mensagem com base na conta ativa, sala/thread/mensagem atual ou
identidade confiável do solicitante, sem codificar branches específicos de canal no
core da ferramenta `message`.

É por isso que mudanças de roteamento no embedded-runner ainda são trabalho de Plugin: o runner é
responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta do Plugin, para que a ferramenta compartilhada `message` exponha a superfície correta, de propriedade do canal, para o turno atual.

Para helpers de execução de propriedade do canal, Plugins incluídos devem manter o runtime de execução
dentro de seus próprios módulos de extensão. O core não controla mais os runtimes de ação de mensagem
de Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`.
Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e Plugins incluídos
devem importar seu próprio código local de runtime diretamente de seus
módulos de propriedade da extensão.

O mesmo limite se aplica a seams de SDK nomeadas por provider em geral: o core não
deve importar barrels de conveniência específicos de canal para extensões Slack, Discord, Signal,
WhatsApp ou semelhantes. Se o core precisar de um comportamento, deve consumir o
próprio barrel `api.ts` / `runtime-api.ts` do Plugin incluído ou promover a necessidade
a uma capacidade genérica e estreita no SDK compartilhado.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a linha de base compartilhada para canais que se encaixam no modelo comum
  de enquete
- `actions.handleAction("poll")` é o caminho preferido para semântica de enquete específica do canal ou parâmetros extras de enquete

O core agora adia a análise compartilhada de enquete até depois que o despacho de enquete do Plugin recusa
a ação, para que handlers de enquete de propriedade do Plugin possam aceitar campos de enquete específicos do canal sem serem bloqueados primeiro pelo parser genérico de enquete.

Consulte [Internos da arquitetura de Plugin](/pt-BR/plugins/architecture-internals) para a sequência completa de inicialização.

## Modelo de propriedade de capacidades

O OpenClaw trata um Plugin nativo como o limite de propriedade de uma **empresa** ou de um
**recurso**, não como um amontoado de integrações não relacionadas.

Isso significa:

- um Plugin de empresa normalmente deve controlar todas as superfícies voltadas ao OpenClaw dessa empresa
- um Plugin de recurso normalmente deve controlar toda a superfície do recurso que introduz
- canais devem consumir capacidades compartilhadas do core em vez de reimplementar comportamento de provider de forma ad hoc

<Accordion title="Exemplos de padrões de propriedade em Plugins incluídos">
  - **Fornecedor com várias capacidades**: `openai` controla inferência de texto, fala, voz em tempo real,
    compreensão de mídia e geração de imagem. `google` controla inferência de texto
    mais compreensão de mídia, geração de imagem e pesquisa na web.
    `qwen` controla inferência de texto mais compreensão de mídia e geração de vídeo.
  - **Fornecedor com capacidade única**: `elevenlabs` e `microsoft` controlam fala;
    `firecrawl` controla busca na web; `minimax` / `mistral` / `moonshot` / `zai` controlam
    backends de compreensão de mídia.
  - **Plugin de recurso**: `voice-call` controla transporte de chamadas, ferramentas, CLI, rotas
    e bridge de media-stream do Twilio, mas consome capacidades compartilhadas de fala, transcrição em tempo real e voz em tempo real em vez de importar Plugins de fornecedor diretamente.
</Accordion>

O estado final pretendido é:

- OpenAI vive em um único Plugin mesmo que abranja modelos de texto, fala, imagens e
  vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual Plugin de fornecedor controla o provider; eles consomem o contrato
  de capacidade compartilhada exposto pelo core

Esta é a distinção principal:

- **Plugin** = limite de propriedade
- **capacidade** = contrato do core que vários Plugins podem implementar ou consumir

Portanto, se o OpenClaw adicionar um novo domínio como vídeo, a primeira pergunta não é
“qual provider deve codificar tratamento de vídeo?” A primeira pergunta é “qual é
o contrato central de capacidade de vídeo?” Depois que esse contrato existir,
Plugins de fornecedor podem se registrar nele e Plugins de canal/recurso podem consumi-lo.

Se a capacidade ainda não existir, o movimento correto geralmente é:

1. definir a capacidade ausente no core
2. expô-la por meio da API/runtime de Plugin de forma tipada
3. conectar canais/recursos a essa capacidade
4. deixar Plugins de fornecedor registrarem implementações

Isso mantém a propriedade explícita e evita comportamento do core que dependa de um
único fornecedor ou de um codepath único específico de Plugin.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código pertence:

- **camada de capacidade do core**: orquestração compartilhada, política, fallback, regras de
  mesclagem de configuração, semântica de entrega e contratos tipados
- **camada de Plugin de fornecedor**: APIs específicas do fornecedor, auth, catálogos de modelo, síntese de fala,
  geração de imagem, futuros backends de vídeo, endpoints de uso
- **camada de Plugin de canal/recurso**: integração Slack/Discord/voice-call/etc.
  que consome capacidades do core e as apresenta em uma superfície

Por exemplo, TTS segue este formato:

- o core controla a política de TTS no momento da resposta, ordem de fallback, preferências e entrega por canal
- `openai`, `elevenlabs` e `microsoft` controlam implementações de síntese
- `voice-call` consome o helper de runtime de TTS de telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de Plugin de empresa com várias capacidades

Um Plugin de empresa deve parecer coeso por fora. Se o OpenClaw tiver contratos compartilhados
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
      // hooks de auth/catálogo de modelo/runtime
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

- um Plugin controla a superfície do fornecedor
- o core continua controlando os contratos de capacidade
- canais e Plugins de recurso consomem helpers `api.runtime.*`, não código do fornecedor
- testes de contrato podem afirmar que o Plugin registrou as capacidades que
  afirma controlar

### Exemplo de capacidade: compreensão de vídeo

O OpenClaw já trata compreensão de imagem/áudio/vídeo como uma única
capacidade compartilhada. O mesmo modelo de propriedade se aplica aqui:

1. o core define o contrato de compreensão de mídia
2. Plugins de fornecedor registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. Plugins de canal e recurso consomem o comportamento compartilhado do core em vez de
   se conectar diretamente ao código do fornecedor

Isso evita embutir no core pressupostos de vídeo de um único provider. O Plugin controla
a superfície do fornecedor; o core controla o contrato de capacidade e o comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o core controla o contrato tipado
de capacidade e o helper de runtime, e Plugins de fornecedor registram
implementações `api.registerVideoGenerationProvider(...)` contra ele.

Precisa de um checklist concreto de rollout? Consulte
[Capability Cookbook](/pt-BR/plugins/architecture).

## Contratos e imposição

A superfície da API de Plugin é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e
os helpers de runtime nos quais um Plugin pode confiar.

Por que isso importa:

- autores de Plugins recebem um padrão interno estável
- o core pode rejeitar propriedade duplicada, como dois Plugins registrando o mesmo
  id de provider
- a inicialização pode exibir diagnósticos acionáveis para registros malformados
- testes de contrato podem impor a propriedade de Plugins incluídos e evitar desvio silencioso

Há duas camadas de imposição:

1. **imposição de registro em runtime**
   O registro de Plugins valida registros à medida que os Plugins são carregados. Exemplos:
   ids de provider duplicados, ids de provider de fala duplicados e registros
   malformados produzem diagnósticos de Plugin em vez de comportamento indefinido.
2. **testes de contrato**
   Plugins incluídos são capturados em registros de contrato durante execuções de teste para que o
   OpenClaw possa afirmar a propriedade explicitamente. Hoje isso é usado para
   providers de modelo, providers de fala, providers de pesquisa na web e propriedade de registro incluído.

O efeito prático é que o OpenClaw sabe, desde o início, qual Plugin controla qual
superfície. Isso permite que core e canais se componham sem fricção porque a propriedade é
declarada, tipada e testável, em vez de implícita.

### O que pertence a um contrato

Bons contratos de Plugin são:

- tipados
- pequenos
- específicos por capacidade
- controlados pelo core
- reutilizáveis por vários Plugins
- consumíveis por canais/recursos sem conhecimento do fornecedor

Maus contratos de Plugin são:

- política específica de fornecedor oculta no core
- escape hatches únicos de Plugin que ignoram o registro
- código de canal acessando diretamente uma implementação de fornecedor
- objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` ou
  `api.runtime`

Em caso de dúvida, eleve o nível de abstração: defina a capacidade primeiro e, depois,
deixe os Plugins se conectarem a ela.

## Modelo de execução

Plugins nativos do OpenClaw são executados **in-process** com o Gateway. Eles não
rodam em sandbox. Um Plugin nativo carregado tem o mesmo limite de confiança no nível do processo que
o código do core.

Implicações:

- um Plugin nativo pode registrar ferramentas, handlers de rede, hooks e serviços
- um bug em um Plugin nativo pode derrubar ou desestabilizar o Gateway
- um Plugin nativo malicioso equivale a execução arbitrária de código dentro do
  processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente
Skills incluídas.

Use allowlists e caminhos explícitos de instalação/carregamento para Plugins não incluídos. Trate
Plugins de workspace como código de desenvolvimento, não como padrão de produção.

Para nomes de pacotes incluídos do workspace, mantenha o id do Plugin ancorado no nome
npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` quando
o pacote expõe intencionalmente um papel de Plugin mais estreito.

Observação importante sobre confiança:

- `plugins.allow` confia em **ids de Plugin**, não na procedência da fonte.
- Um Plugin de workspace com o mesmo id de um Plugin incluído intencionalmente sombreia
  a cópia incluída quando esse Plugin de workspace está ativado/na allowlist.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.
- A confiança em Plugin incluído é resolvida a partir do snapshot da fonte — o manifest e o
  código em disco no momento do carregamento — e não a partir de metadados de instalação. Um registro de instalação corrompido
  ou substituído não pode ampliar silenciosamente a superfície de confiança de um Plugin incluído
  além do que a fonte real afirma.

## Limite de exportação

O OpenClaw exporta capacidades, não conveniências de implementação.

Mantenha público o registro de capacidades. Reduza exports auxiliares que não sejam contratos:

- subcaminhos auxiliares específicos de Plugins incluídos
- subcaminhos de infraestrutura de runtime que não se destinam à API pública
- helpers de conveniência específicos de fornecedor
- helpers de configuração/onboarding que são detalhes de implementação

Alguns subcaminhos auxiliares de Plugins incluídos ainda permanecem no mapa de exportação gerado do SDK
por compatibilidade e manutenção de Plugins incluídos. Exemplos atuais incluem
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e várias seams `plugin-sdk/matrix*`. Trate-os como
exports reservados de detalhe de implementação, não como o padrão recomendado de SDK para
novos Plugins de terceiros.

## Internos e referência

Para o pipeline de carregamento, o modelo de registro, hooks de runtime de provider, rotas HTTP do Gateway,
schemas da ferramenta de mensagens, resolução de alvo de canal, catálogos de provider,
Plugins de mecanismo de contexto e o guia para adicionar uma nova capacidade, consulte
[Internos da arquitetura de Plugin](/pt-BR/plugins/architecture-internals).

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins)
- [Configuração do SDK de Plugin](/pt-BR/plugins/sdk-setup)
- [Manifest de Plugin](/pt-BR/plugins/manifest)
