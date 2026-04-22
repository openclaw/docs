---
read_when:
    - Criando ou depurando plugins nativos do OpenClaw
    - Entendendo o modelo de capacidades do Plugin ou os limites de propriedade
    - Trabalhando no pipeline de carregamento de plugin ou no registro
    - Implementando hooks de runtime de provedor ou plugins de canal
sidebarTitle: Internals
summary: 'Internos de Plugin: modelo de capacidades, propriedade, contratos, pipeline de carregamento e auxiliares de runtime'
title: Internos de Plugin
x-i18n:
    generated_at: "2026-04-22T04:23:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69080a1d0e496b321a6fd5a3e925108c3a03c41710073f8f23af13933a091e28
    source_path: plugins/architecture.md
    workflow: 15
---

# Internos de Plugin

<Info>
  Esta é a **referência profunda de arquitetura**. Para guias práticos, consulte:
  - [Instalar e usar plugins](/pt-BR/tools/plugin) — guia do usuário
  - [Primeiros passos](/pt-BR/plugins/building-plugins) — primeiro tutorial de plugin
  - [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) — crie um canal de mensagens
  - [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) — crie um provedor de modelo
  - [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — mapa de importação e API de registro
</Info>

Esta página cobre a arquitetura interna do sistema de plugins do OpenClaw.

## Modelo público de capacidades

Capacidades são o modelo público de **plugin nativo** dentro do OpenClaw. Todo
plugin nativo do OpenClaw se registra em um ou mais tipos de capacidade:

| Capacidade             | Método de registro                              | Plugins de exemplo                   |
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
| Busca na web           | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Pesquisa na web        | `api.registerWebSearchProvider(...)`             | `google`                             |
| Canal / mensagens      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |

Um plugin que registra zero capacidades, mas fornece hooks, ferramentas ou
serviços, é um plugin **legado somente com hooks**. Esse padrão ainda é totalmente compatível.

### Postura de compatibilidade externa

O modelo de capacidades foi incorporado ao core e é usado por plugins
incluídos/nativos hoje, mas a compatibilidade de plugins externos ainda precisa de um critério mais rígido do que “está exportado, portanto está congelado”.

Orientação atual:

- **plugins externos existentes:** mantenha integrações baseadas em hooks funcionando; trate
  isso como a linha de base de compatibilidade
- **novos plugins incluídos/nativos:** prefira registro explícito de capacidades em vez de acessos
  específicos de fornecedor ou novos designs somente com hooks
- **plugins externos adotando registro de capacidades:** permitido, mas trate as superfícies auxiliares
  específicas de capacidade como evolutivas, a menos que a documentação marque explicitamente um contrato como estável

Regra prática:

- APIs de registro de capacidade são a direção pretendida
- hooks legados continuam sendo o caminho mais seguro sem quebras para plugins externos durante
  a transição
- nem todos os subcaminhos auxiliares exportados são iguais; prefira o contrato documentado e restrito,
  não exportações auxiliares incidentais

### Formatos de plugin

O OpenClaw classifica cada plugin carregado em um formato com base em seu comportamento real
de registro (não apenas em metadados estáticos):

- **plain-capability** -- registra exatamente um tipo de capacidade (por exemplo, um
  plugin somente de provedor como `mistral`)
- **hybrid-capability** -- registra vários tipos de capacidade (por exemplo,
  `openai` controla inferência de texto, fala, compreensão de mídia e geração
  de imagem)
- **hook-only** -- registra apenas hooks (tipados ou personalizados), sem
  capacidades, ferramentas, comandos ou serviços
- **non-capability** -- registra ferramentas, comandos, serviços ou rotas, mas nenhuma
  capacidade

Use `openclaw plugins inspect <id>` para ver o formato de um plugin e a divisão
de capacidades. Consulte [referência da CLI](/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como um caminho de compatibilidade para
plugins somente com hooks. Plugins legados reais ainda dependem dele.

Direção:

- mantê-lo funcionando
- documentá-lo como legado
- preferir `before_model_resolve` para trabalho de substituição de modelo/provedor
- preferir `before_prompt_build` para trabalho de mutação de prompt
- remover apenas depois que o uso real cair e a cobertura de fixtures comprovar segurança de migração

### Sinais de compatibilidade

Quando você executa `openclaw doctor` ou `openclaw plugins inspect <id>`, pode ver
um destes rótulos:

| Sinal                     | Significado                                                 |
| ------------------------- | ----------------------------------------------------------- |
| **config valid**          | A configuração é analisada corretamente e os plugins são resolvidos |
| **compatibility advisory** | O plugin usa um padrão compatível, mas mais antigo (por exemplo, `hook-only`) |
| **legacy warning**        | O plugin usa `before_agent_start`, que está obsoleto        |
| **hard error**            | A configuração é inválida ou o plugin não foi carregado     |

Nem `hook-only` nem `before_agent_start` quebrarão seu plugin hoje --
`hook-only` é apenas informativo, e `before_agent_start` apenas dispara um aviso. Esses
sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de plugins do OpenClaw tem quatro camadas:

1. **Manifesto + descoberta**
   O OpenClaw encontra plugins candidatos a partir de caminhos configurados, raízes de workspace,
   raízes globais de extensões e extensões incluídas. A descoberta lê primeiro
   manifestos nativos `openclaw.plugin.json` e manifestos de bundle compatíveis.
2. **Ativação + validação**
   O core decide se um plugin descoberto está ativado, desativado, bloqueado ou
   selecionado para um slot exclusivo, como memória.
3. **Carregamento em runtime**
   Plugins nativos do OpenClaw são carregados in-process via jiti e registram
   capacidades em um registro central. Bundles compatíveis são normalizados em
   registros do registro sem importar código de runtime.
4. **Consumo de superfície**
   O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração
   de provedor, hooks, rotas HTTP, comandos de CLI e serviços.

Especificamente para a CLI de plugins, a descoberta do comando raiz é dividida em duas fases:

- metadados em tempo de análise vêm de `registerCli(..., { descriptors: [...] })`
- o módulo real de CLI do plugin pode permanecer lazy e se registrar na primeira invocação

Isso mantém o código de CLI controlado pelo plugin dentro do plugin, ao mesmo tempo em que permite ao OpenClaw
reservar nomes de comandos raiz antes da análise.

O limite de design importante:

- descoberta + validação de configuração devem funcionar a partir de metadados de **manifesto/schema**
  sem executar código do plugin
- o comportamento nativo de runtime vem do caminho `register(api)` do módulo do plugin

Essa separação permite que o OpenClaw valide a configuração, explique plugins ausentes/desativados e
construa dicas de UI/schema antes que o runtime completo esteja ativo.

### Plugins de canal e a ferramenta compartilhada de mensagem

Plugins de canal não precisam registrar uma ferramenta separada de enviar/editar/reagir para
ações normais de chat. O OpenClaw mantém uma ferramenta `message` compartilhada no core, e
plugins de canal controlam a descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o core controla o host da ferramenta `message` compartilhada, a integração com prompt, o
  bookkeeping de sessão/thread e o despacho de execução
- plugins de canal controlam a descoberta de ações com escopo, a descoberta de capacidades e quaisquer
  fragmentos de schema específicos do canal
- plugins de canal controlam a gramática de conversa de sessão específica do provedor, como
  IDs de conversa codificam IDs de thread ou herdam de conversas pai
- plugins de canal executam a ação final por meio de seu adaptador de ação

Para plugins de canal, a superfície do SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada de descoberta
permite que um plugin retorne suas ações visíveis, capacidades e contribuições de schema
juntas, para que essas partes não se desviem entre si.

Quando um parâmetro da ferramenta de mensagem específico do canal carrega uma fonte de mídia como
um caminho local ou URL de mídia remota, o plugin também deve retornar
`mediaSourceParams` de `describeMessageTool(...)`. O core usa essa lista explícita
para aplicar normalização de caminho em sandbox e dicas de acesso de mídia de saída
sem codificar nomes de parâmetro controlados pelo plugin.
Prefira mapas com escopo por ação ali, não uma lista plana única por canal, para que um
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
- `requesterSenderId` de entrada confiável

Isso importa para plugins sensíveis ao contexto. Um canal pode ocultar ou expor
ações de mensagem com base na conta ativa, sala/thread/mensagem atual ou
identidade confiável do solicitante sem codificar ramificações específicas do canal na
ferramenta `message` do core.

É por isso que mudanças de roteamento do executor embutido ainda são trabalho do plugin: o executor é
responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta do plugin, para que a ferramenta `message` compartilhada exponha a superfície correta controlada pelo canal
para o turno atual.

Para auxiliares de execução controlados pelo canal, plugins incluídos devem manter o runtime de execução
dentro de seus próprios módulos de extensão. O core não controla mais os
runtimes de ação de mensagem do Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`.
Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e plugins
incluídos devem importar seu próprio código de runtime local diretamente de seus
módulos controlados pela extensão.

O mesmo limite se aplica a costuras de SDK nomeadas por provedor em geral: o core não deve
importar barrels de conveniência específicos de canal para Slack, Discord, Signal,
WhatsApp ou extensões semelhantes. Se o core precisar de um comportamento, ou consuma o
próprio barrel `api.ts` / `runtime-api.ts` do plugin incluído, ou promova a necessidade
para uma capacidade genérica e restrita no SDK compartilhado.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a base compartilhada para canais que se encaixam no modelo comum
  de enquete
- `actions.handleAction("poll")` é o caminho preferido para semântica de enquete específica
  do canal ou parâmetros extras de enquete

Agora o core adia a análise compartilhada de enquete até que o despacho de enquete do plugin recuse
a ação, para que manipuladores de enquete controlados pelo plugin possam aceitar campos
de enquete específicos do canal sem serem bloqueados antes pelo parser genérico de enquete.

Consulte [Pipeline de carregamento](#load-pipeline) para a sequência completa de inicialização.

## Modelo de propriedade de capacidades

O OpenClaw trata um plugin nativo como o limite de propriedade de uma **empresa** ou de um
**recurso**, não como um conjunto de integrações não relacionadas.

Isso significa:

- um plugin de empresa normalmente deve controlar todas as superfícies do OpenClaw dessa
  empresa
- um plugin de recurso normalmente deve controlar toda a superfície do recurso que introduz
- canais devem consumir capacidades compartilhadas do core em vez de reimplementar comportamento de
  provedor de forma ad hoc

Exemplos:

- o plugin `openai` incluído controla o comportamento do provedor de modelo OpenAI e o comportamento de fala + voz em tempo real + compreensão de mídia + geração de imagem do OpenAI
- o plugin `elevenlabs` incluído controla o comportamento de fala do ElevenLabs
- o plugin `microsoft` incluído controla o comportamento de fala da Microsoft
- o plugin `google` incluído controla o comportamento do provedor de modelo Google mais o comportamento de compreensão de mídia + geração de imagem + pesquisa na web do Google
- o plugin `firecrawl` incluído controla o comportamento de busca na web do Firecrawl
- os plugins `minimax`, `mistral`, `moonshot` e `zai` incluídos controlam seus backends de compreensão de mídia
- o plugin `qwen` incluído controla o comportamento do provedor de texto do Qwen mais o comportamento de compreensão de mídia e geração de vídeo
- o plugin `voice-call` é um plugin de recurso: ele controla transporte de chamada, ferramentas, CLI, rotas e bridging de stream de mídia do Twilio, mas consome capacidades compartilhadas de fala mais transcrição em tempo real e voz em tempo real, em vez de importar plugins de fornecedor diretamente

O estado final pretendido é:

- OpenAI vive em um único plugin mesmo que abranja modelos de texto, fala, imagens e
  vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual plugin de fornecedor controla o provedor; eles consomem o
  contrato de capacidade compartilhada exposto pelo core

Esta é a distinção principal:

- **plugin** = limite de propriedade
- **capacidade** = contrato do core que vários plugins podem implementar ou consumir

Portanto, se o OpenClaw adicionar um novo domínio, como vídeo, a primeira pergunta não é
“qual provedor deve codificar o tratamento de vídeo?” A primeira pergunta é “qual é
o contrato de capacidade de vídeo no core?” Quando esse contrato existir, plugins de fornecedor
poderão se registrar nele, e plugins de canal/recurso poderão consumi-lo.

Se a capacidade ainda não existir, o movimento correto normalmente é:

1. definir a capacidade ausente no core
2. expô-la por meio da API/runtime de plugin de forma tipada
3. conectar canais/recursos a essa capacidade
4. permitir que plugins de fornecedor registrem implementações

Isso mantém a propriedade explícita, evitando comportamento no core que dependa de um
único fornecedor ou de um caminho de código específico de plugin e pontual.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código pertence:

- **camada de capacidade do core**: orquestração compartilhada, política, fallback, regras de mesclagem de configuração, semântica de entrega e contratos tipados
- **camada de plugin de fornecedor**: APIs específicas do fornecedor, autenticação, catálogos de modelo, síntese de fala, geração de imagem, futuros backends de vídeo, endpoints de uso
- **camada de plugin de canal/recurso**: integração Slack/Discord/voice-call/etc. que consome capacidades do core e as apresenta em uma superfície

Por exemplo, TTS segue este formato:

- o core controla a política de TTS no momento da resposta, ordem de fallback, preferências e entrega por canal
- `openai`, `elevenlabs` e `microsoft` controlam implementações de síntese
- `voice-call` consome o auxiliar de runtime de TTS de telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de plugin de empresa com várias capacidades

Um plugin de empresa deve parecer coeso por fora. Se o OpenClaw tiver contratos compartilhados
para modelos, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia,
geração de imagem, geração de vídeo, busca na web e pesquisa na web,
um fornecedor poderá controlar todas as suas superfícies em um só lugar:

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
      // hooks de autenticação/catálogo de modelo/runtime
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
        // lógica de credencial + busca
      }),
    );
  },
};

export default plugin;
```

O importante não são os nomes exatos dos auxiliares. O formato importa:

- um plugin controla a superfície do fornecedor
- o core ainda controla os contratos de capacidade
- canais e plugins de recurso consomem auxiliares `api.runtime.*`, não código do fornecedor
- testes de contrato podem afirmar que o plugin registrou as capacidades que
  afirma controlar

### Exemplo de capacidade: compreensão de vídeo

O OpenClaw já trata compreensão de imagem/áudio/vídeo como uma única
capacidade compartilhada. O mesmo modelo de propriedade se aplica aqui:

1. o core define o contrato de compreensão de mídia
2. plugins de fornecedor registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. canais e plugins de recurso consomem o comportamento compartilhado do core em vez de
   se conectarem diretamente ao código do fornecedor

Isso evita embutir no core suposições de vídeo de um único provedor. O plugin controla
a superfície do fornecedor; o core controla o contrato de capacidade e o comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o core controla o contrato tipado de
capacidade e o auxiliar de runtime, e plugins de fornecedor registram
implementações `api.registerVideoGenerationProvider(...)` nele.

Precisa de um checklist concreto de rollout? Consulte
[Capability Cookbook](/pt-BR/plugins/architecture).

## Contratos e imposição

A superfície da API de plugin é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e
os auxiliares de runtime nos quais um plugin pode confiar.

Por que isso importa:

- autores de plugins recebem um padrão interno estável
- o core pode rejeitar propriedade duplicada, como dois plugins registrando o mesmo
  ID de provedor
- a inicialização pode expor diagnósticos acionáveis para registros malformados
- testes de contrato podem impor a propriedade dos plugins incluídos e evitar desvio silencioso

Há duas camadas de imposição:

1. **imposição de registro em runtime**
   O registro de plugins valida registros à medida que plugins são carregados. Exemplos:
   IDs de provedor duplicados, IDs de provedor de fala duplicados e registros
   malformados produzem diagnósticos de plugin em vez de comportamento indefinido.
2. **testes de contrato**
   Plugins incluídos são capturados em registros de contrato durante execuções de teste, para que o
   OpenClaw possa afirmar explicitamente a propriedade. Hoje isso é usado para
   provedores de modelo, provedores de fala, provedores de pesquisa na web e
   propriedade de registro incluída.

O efeito prático é que o OpenClaw sabe, antecipadamente, qual plugin controla qual
superfície. Isso permite que o core e os canais se componham sem atrito, porque a
propriedade é declarada, tipada e testável, em vez de implícita.

### O que pertence a um contrato

Bons contratos de plugin são:

- tipados
- pequenos
- específicos de capacidade
- controlados pelo core
- reutilizáveis por vários plugins
- consumíveis por canais/recursos sem conhecimento do fornecedor

Contratos de plugin ruins são:

- política específica do fornecedor escondida no core
- escape hatches pontuais de plugin que ignoram o registro
- código de canal acessando diretamente uma implementação de fornecedor
- objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` ou
  `api.runtime`

Em caso de dúvida, eleve o nível de abstração: defina a capacidade primeiro e depois
permita que plugins se conectem a ela.

## Modelo de execução

Plugins nativos do OpenClaw executam **in-process** com o Gateway. Eles não são
isolados em sandbox. Um plugin nativo carregado tem o mesmo limite de confiança no nível de processo que o código do core.

Implicações:

- um plugin nativo pode registrar ferramentas, manipuladores de rede, hooks e serviços
- um bug em plugin nativo pode travar ou desestabilizar o gateway
- um plugin nativo malicioso equivale à execução arbitrária de código dentro do processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente
Skills incluídas.

Use listas de permissões e caminhos explícitos de instalação/carregamento para plugins não incluídos. Trate
plugins de workspace como código de desenvolvimento, não como padrão de produção.

Para nomes de pacote de workspace incluídos, mantenha o ID do plugin ancorado no nome
npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding` quando
o pacote expõe intencionalmente uma função de plugin mais restrita.

Observação importante sobre confiança:

- `plugins.allow` confia em **IDs de plugin**, não na procedência da origem.
- Um plugin de workspace com o mesmo ID de um plugin incluído intencionalmente sombreia
  a cópia incluída quando esse plugin de workspace está ativado/na lista de permissões.
- Isso é normal e útil para desenvolvimento local, testes de patch e hotfixes.

## Limite de exportação

O OpenClaw exporta capacidades, não conveniências de implementação.

Mantenha o registro de capacidades público. Reduza exportações auxiliares fora do contrato:

- subcaminhos específicos de plugins incluídos
- subcaminhos de plumbing de runtime que não se destinam a ser API pública
- auxiliares de conveniência específicos do fornecedor
- auxiliares de configuração/onboarding que são detalhes de implementação

Alguns subcaminhos auxiliares de plugins incluídos ainda permanecem no mapa de exportação gerado do SDK por compatibilidade e manutenção de plugins incluídos. Exemplos atuais incluem
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e várias costuras `plugin-sdk/matrix*`. Trate-os como
exportações reservadas de detalhe de implementação, não como o padrão de SDK recomendado para
novos plugins de terceiros.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de plugin
2. lê manifestos nativos ou de bundle compatível e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a ativação para cada candidato
6. carrega módulos nativos ativados via jiti
7. chama os hooks nativos `register(api)` (ou `activate(api)` — um alias legado) e coleta registros no registro de plugins
8. expõe o registro para superfícies de comando/runtime

<Note>
`activate` é um alias legado para `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins incluídos usam `register`; prefira `register` para novos plugins.
</Note>

As barreiras de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do plugin, o caminho é gravável por todos ou a
propriedade do caminho parece suspeita para plugins não incluídos.

### Comportamento manifest-first

O manifesto é a fonte de verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/Skills/schema de configuração declarados ou capacidades de bundle
- validar `plugins.entries.<id>.config`
- ampliar rótulos/placeholders da UI de controle
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e configuração sem carregar o runtime do plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
comportamento real, como hooks, ferramentas, comandos ou fluxos de provedor.

Blocos opcionais `activation` e `setup` do manifesto permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de configuração;
não substituem registro de runtime, `register(...)` nem `setupEntry`.
Os primeiros consumidores de ativação live agora usam dicas de comando, canal e provedor do manifesto
para restringir o carregamento de plugin antes de uma materialização mais ampla do registro:

- o carregamento da CLI é restringido a plugins que controlam o comando primário solicitado
- a resolução de configuração/plugin de canal é restringida a plugins que controlam o
  ID de canal solicitado
- a resolução explícita de configuração/runtime de provedor é restringida a plugins que controlam o
  ID de provedor solicitado

A descoberta de configuração agora prefere IDs controlados por descritor, como `setup.providers` e
`setup.cliBackends`, para restringir plugins candidatos antes de usar como fallback
`setup-api` para plugins que ainda precisam de hooks de runtime em tempo de configuração. Se mais de
um plugin descoberto declarar o mesmo ID normalizado de provedor de configuração ou backend de CLI,
a busca de configuração recusa o proprietário ambíguo em vez de depender da ordem
de descoberta.

### O que o carregador coloca em cache

O OpenClaw mantém caches curtos in-process para:

- resultados de descoberta
- dados do registro de manifestos
- registros de plugins carregados

Esses caches reduzem inicializações em rajada e a sobrecarga de comandos repetidos. É seguro
pensar neles como caches de desempenho de curta duração, não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desativar esses caches.
- Ajuste as janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não alteram diretamente globais aleatórios do core. Eles se registram em um
registro central de plugins.

O registro acompanha:

- registros de plugin (identidade, origem, procedência, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- provedores
- manipuladores RPC do gateway
- rotas HTTP
- registradores de CLI
- serviços em segundo plano
- comandos controlados por plugin

Recursos do core então leem esse registro em vez de falar diretamente com módulos de plugin.
Isso mantém o carregamento em uma única direção:

- módulo de plugin -> registro no registry
- runtime do core -> consumo do registry

Essa separação importa para manutenção. Significa que a maioria das superfícies do core precisa
apenas de um ponto de integração: “ler o registry”, não “tratar cada módulo
de plugin de forma especial”.

## Callbacks de vinculação de conversa

Plugins que vinculam uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma solicitação de vinculação for aprovada ou negada:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Agora existe uma vinculação para este plugin + conversa.
        console.log(event.binding?.conversationId);
        return;
      }

      // A solicitação foi negada; limpe qualquer estado pendente local.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campos da carga do callback:

- `status`: `"approved"` ou `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` ou `"deny"`
- `binding`: a vinculação resolvida para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de desvinculação, ID do remetente e
  metadados da conversa

Esse callback serve apenas para notificação. Ele não altera quem tem permissão para vincular uma
conversa, e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime do provedor

Plugins de provedor agora têm duas camadas:

- metadados de manifesto: `providerAuthEnvVars` para busca barata de autenticação de provedor por env
  antes do carregamento do runtime, `providerAuthAliases` para variantes de provedor que compartilham
  autenticação, `channelEnvVars` para busca barata de env/configuração de canal antes do carregamento
  do runtime, além de `providerAuthChoices` para rótulos baratos de onboarding/escolha de autenticação e
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

O OpenClaw ainda controla o loop genérico do agente, failover, tratamento de transcrição e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico do provedor sem
precisar de um transporte de inferência totalmente personalizado.

Use `providerAuthEnvVars` no manifesto quando o provedor tiver credenciais baseadas em env
que caminhos genéricos de autenticação/status/seletor de modelo devem enxergar sem carregar o runtime do plugin. Use `providerAuthAliases` no manifesto quando um ID de provedor
deve reutilizar as variáveis de env, perfis de autenticação, autenticação baseada em configuração e escolha de onboarding por chave de API de outro ID de provedor. Use `providerAuthChoices` no manifesto quando superfícies de CLI de onboarding/escolha de autenticação
devem conhecer o ID de escolha do provedor, rótulos de grupo e ligação simples de autenticação
de uma flag sem carregar o runtime do provedor. Mantenha `envVars` do runtime do provedor para
dicas voltadas ao operador, como rótulos de onboarding ou variáveis de configuração de
client-id/client-secret do OAuth.

Use `channelEnvVars` no manifesto quando um canal tiver autenticação ou configuração orientada por env
que fallback genérico de env no shell, verificações de config/status ou prompts de configuração
devem enxergar sem carregar o runtime do canal.

### Ordem dos hooks e uso

Para plugins de modelo/provedor, o OpenClaw chama hooks aproximadamente nesta ordem.
A coluna “Quando usar” é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                                |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provedor em `models.providers` durante a geração de `models.json`                   | O provedor controla um catálogo ou padrões de URL base                                                                                   |
| 2   | `applyConfigDefaults`             | Aplica padrões globais de configuração controlados pelo provedor durante a materialização da configuração      | Os padrões dependem do modo de autenticação, env ou da semântica da família de modelos do provedor                                      |
| --  | _(built-in model lookup)_         | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                | _(não é um hook de plugin)_                                                                                                              |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de prévia de ID de modelo antes da busca                                          | O provedor controla a limpeza de aliases antes da resolução canônica do modelo                                                           |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família de provedor antes da montagem genérica do modelo                        | O provedor controla a limpeza de transporte para IDs de provedor personalizados na mesma família de transporte                          |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provedor                                       | O provedor precisa de limpeza de configuração que deve ficar com o plugin; auxiliares incluídos da família Google também dão suporte a entradas compatíveis de configuração do Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica regravações de compatibilidade de uso de streaming nativo a provedores de configuração                  | O provedor precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                         |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de env para provedores de configuração antes do carregamento da autenticação de runtime | O provedor tem resolução de chave de API por marcador de env controlada pelo provedor; `amazon-bedrock` também tem aqui um resolvedor integrado de marcador de env da AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/self-hosted ou baseada em configuração sem persistir texto simples                    | O provedor pode operar com um marcador de credencial sintética/local                                                                     |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis de autenticação externos controlados pelo provedor; `persistence` padrão é `runtime-only` para credenciais controladas por CLI/app | O provedor reutiliza credenciais externas de autenticação sem persistir tokens de atualização copiados                                  |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders de perfis sintéticos armazenados atrás de autenticação baseada em env/configuração       | O provedor armazena perfis placeholder sintéticos que não devem ganhar precedência                                                      |
| 11  | `resolveDynamicModel`             | Fallback síncrono para IDs de modelo controlados pelo provedor que ainda não estão no registro local          | O provedor aceita IDs arbitrários de modelos upstream                                                                                    |
| 12  | `prepareDynamicModel`             | Warm-up assíncrono, depois `resolveDynamicModel` é executado novamente                                         | O provedor precisa de metadados de rede antes de resolver IDs desconhecidos                                                             |
| 13  | `normalizeResolvedModel`          | Regravação final antes que o executor embutido use o modelo resolvido                                          | O provedor precisa de regravações de transporte, mas ainda usa um transporte do core                                                    |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos do fornecedor por trás de outro transporte compatível          | O provedor reconhece seus próprios modelos em transportes proxy sem assumir o controle do provedor                                      |
| 15  | `capabilities`                    | Metadados de transcrição/ferramentas controlados pelo provedor usados pela lógica compartilhada do core       | O provedor precisa de particularidades de transcrição/família de provedor                                                               |
| 16  | `normalizeToolSchemas`            | Normaliza schemas de ferramentas antes que o executor embutido os veja                                         | O provedor precisa de limpeza de schema para a família de transporte                                                                     |
| 17  | `inspectToolSchemas`              | Expõe diagnósticos de schema controlados pelo provedor após a normalização                                     | O provedor quer avisos de palavra-chave sem ensinar regras específicas de provedor ao core                                              |
| 18  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de raciocínio nativo vs com tags                                                   | O provedor precisa de saída de raciocínio/final com tags em vez de campos nativos                                                       |
| 19  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes dos wrappers genéricos de opção de stream                      | O provedor precisa de parâmetros padrão de requisição ou limpeza de parâmetros por provedor                                             |
| 20  | `createStreamFn`                  | Substitui totalmente o caminho normal de stream por um transporte personalizado                                | O provedor precisa de um protocolo wire personalizado, não apenas de um wrapper                                                         |
| 21  | `wrapStreamFn`                    | Wrapper de stream após a aplicação dos wrappers genéricos                                                      | O provedor precisa de wrappers de compatibilidade de cabeçalhos/corpo/modelo da requisição sem um transporte personalizado              |
| 22  | `resolveTransportTurnState`       | Anexa cabeçalhos nativos por turno ou metadados de transporte                                                  | O provedor quer que transportes genéricos enviem identidade de turno nativa do provedor                                                 |
| 23  | `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos nativos de WebSocket ou política de cooldown da sessão                                        | O provedor quer que transportes WS genéricos ajustem cabeçalhos de sessão ou política de fallback                                      |
| 24  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado se torna a string `apiKey` de runtime               | O provedor armazena metadados extras de autenticação e precisa de um formato personalizado de token de runtime                         |
| 25  | `refreshOAuth`                    | Substituição de atualização de OAuth para endpoints personalizados de atualização ou política de falha de atualização | O provedor não se encaixa nos atualizadores compartilhados de `pi-ai`                                                                   |
| 26  | `buildAuthDoctorHint`             | Dica de reparo anexada quando a atualização de OAuth falha                                                     | O provedor precisa de orientação de reparo de autenticação controlada pelo provedor após falha de atualização                          |
| 27  | `matchesContextOverflowError`     | Correspondência de overflow da janela de contexto controlada pelo provedor                                     | O provedor tem erros brutos de overflow que heurísticas genéricas deixariam passar                                                      |
| 28  | `classifyFailoverReason`          | Classificação do motivo de failover controlada pelo provedor                                                   | O provedor pode mapear erros brutos de API/transporte para limite de taxa/sobrecarga/etc.                                              |
| 29  | `isCacheTtlEligible`              | Política de cache de prompt para provedores proxy/backhaul                                                     | O provedor precisa de restrição de TTL de cache específica para proxy                                                                    |
| 30  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação de autenticação ausente                                       | O provedor precisa de uma dica específica de recuperação para autenticação ausente                                                      |
| 31  | `suppressBuiltInModel`            | Supressão de modelo upstream desatualizado, com dica opcional de erro voltada ao usuário                      | O provedor precisa ocultar linhas upstream desatualizadas ou substituí-las por uma dica do fornecedor                                  |
| 32  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                                | O provedor precisa de linhas sintéticas de compatibilidade futura em `models list` e nos seletores                                     |
| 33  | `resolveThinkingProfile`          | Conjunto de níveis `/think`, rótulos de exibição e padrão específicos do modelo                               | O provedor expõe uma escada personalizada de thinking ou rótulo binário para modelos selecionados                                      |
| 34  | `isBinaryThinking`                | Hook de compatibilidade para alternância de raciocínio ligado/desligado                                        | O provedor expõe apenas thinking binário ligado/desligado                                                                                |
| 35  | `supportsXHighThinking`           | Hook de compatibilidade para suporte a raciocínio `xhigh`                                                      | O provedor quer `xhigh` apenas em um subconjunto de modelos                                                                              |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidade para nível padrão de `/think`                                                          | O provedor controla a política padrão de `/think` para uma família de modelos                                                            |
| 37  | `isModernModelRef`                | Correspondência de modelo moderno para filtros de perfil live e seleção smoke                                  | O provedor controla a correspondência de modelo preferido em live/smoke                                                                  |
| 38  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime imediatamente antes da inferência           | O provedor precisa de uma troca de token ou de uma credencial de requisição de curta duração                                              |
| 39  | `resolveUsageAuth`                | Resolve credenciais de uso/faturamento para `/usage` e superfícies relacionadas de status                     | O provedor precisa de análise personalizada de token de uso/cota ou de uma credencial de uso diferente                                   |
| 40  | `fetchUsageSnapshot`              | Busca e normaliza snapshots específicos do provedor de uso/cota depois que a autenticação é resolvida        | O provedor precisa de um endpoint de uso específico do provedor ou de um parser de carga                                                 |
| 41  | `createEmbeddingProvider`         | Constrói um adaptador de embedding controlado pelo provedor para memória/pesquisa                             | O comportamento de embedding de memória pertence ao plugin do provedor                                                                    |
| 42  | `buildReplayPolicy`               | Retorna uma política de replay que controla o tratamento de transcrição para o provedor                       | O provedor precisa de uma política personalizada de transcrição (por exemplo, remoção de blocos de thinking)                            |
| 43  | `sanitizeReplayHistory`           | Regrava o histórico de replay após a limpeza genérica da transcrição                                          | O provedor precisa de regravações de replay específicas do provedor além dos auxiliares compartilhados de Compaction                    |
| 44  | `validateReplayTurns`             | Validação final ou remodelagem dos turnos de replay antes do executor embutido                                | O transporte do provedor precisa de validação mais rígida dos turnos após o saneamento genérico                                         |
| 45  | `onModelSelected`                 | Executa efeitos colaterais pós-seleção controlados pelo provedor                                              | O provedor precisa de telemetria ou de estado controlado pelo provedor quando um modelo se torna ativo                                  |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
plugin do provedor correspondente e depois percorrem outros plugins de provedor com capacidade de hook
até que um realmente altere o ID do modelo ou o transporte/configuração. Isso mantém
shims de alias/compatibilidade de provedor funcionando sem exigir que o chamador saiba qual
plugin incluído controla a regravação. Se nenhum hook de provedor regravar uma
entrada de configuração compatível da família Google, o normalizador de configuração incluído do Google ainda aplica essa limpeza de compatibilidade.

Se o provedor precisar de um protocolo wire totalmente personalizado ou de um executor de requisição personalizado,
isso é uma classe diferente de extensão. Esses hooks servem para comportamento do provedor
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

- O Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  e `wrapStreamFn` porque controla compatibilidade futura com Claude 4.6,
  dicas de família de provedor, orientação de reparo de autenticação, integração com endpoint de uso,
  elegibilidade para cache de prompt, padrões de configuração sensíveis à autenticação, política
  padrão/adaptativa de thinking do Claude e modelagem de stream específica do Anthropic para
  cabeçalhos beta, `/fast` / `serviceTier` e `context1m`.
- Os auxiliares de stream específicos de Claude do Anthropic permanecem por enquanto na
  própria costura pública `api.ts` / `contract-api.ts` do plugin incluído. Essa superfície do pacote
  exporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e builders de wrapper
  de Anthropic de nível mais baixo, em vez de ampliar o SDK genérico em torno das regras de
  cabeçalho beta de um único provedor.
- O OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities`, além de `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` e `isModernModelRef`
  porque controla compatibilidade futura com GPT-5.4, a normalização direta do OpenAI
  de `openai-completions` -> `openai-responses`, dicas de autenticação com reconhecimento de Codex,
  supressão do Spark, linhas sintéticas de lista OpenAI, e política de thinking /
  modelo live do GPT-5; a família de stream `openai-responses-defaults` controla os
  wrappers nativos compartilhados de OpenAI Responses para cabeçalhos de atribuição,
  `/fast`/`serviceTier`, verbosidade de texto, pesquisa web nativa do Codex,
  modelagem de carga de compatibilidade de raciocínio e gerenciamento de contexto do Responses.
- O OpenRouter usa `catalog` mais `resolveDynamicModel` e
  `prepareDynamicModel` porque o provedor é pass-through e pode expor novos
  IDs de modelo antes que o catálogo estático do OpenClaw seja atualizado; ele também usa
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` para manter
  cabeçalhos de requisição específicos do provedor, metadados de roteamento, patches de raciocínio e
  política de cache de prompt fora do core. Sua política de replay vem da
  família `passthrough-gemini`, enquanto a família de stream `openrouter-thinking`
  controla a injeção de raciocínio via proxy e os desvios para modelos sem suporte / `auto`.
- O GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities`, além de `prepareRuntimeAuth` e `fetchUsageSnapshot`, porque
  precisa de login por dispositivo controlado pelo provedor, comportamento de fallback de modelo, particularidades
  de transcrição do Claude, uma troca de token GitHub -> token Copilot e um endpoint de uso
  controlado pelo provedor.
- O OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog`, além de
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot`, porque
  ainda é executado nos transportes OpenAI do core, mas controla sua normalização de
  transporte/URL base, política de fallback de atualização de OAuth, escolha de transporte padrão,
  linhas sintéticas do catálogo Codex e integração com o endpoint de uso do ChatGPT; ele
  compartilha a mesma família de stream `openai-responses-defaults` do OpenAI direto.
- O Google AI Studio e o OAuth do Gemini CLI usam `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` porque a
  família de replay `google-gemini` controla fallback de compatibilidade futura do Gemini 3.1,
  validação nativa de replay do Gemini, saneamento de replay de bootstrap, modo de
  saída de raciocínio com tags e correspondência de modelo moderno, enquanto a
  família de stream `google-thinking` controla a normalização da carga de thinking do Gemini;
  o OAuth do Gemini CLI também usa `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` para formatação de token, análise de token e integração com endpoint
  de cota.
- O Anthropic Vertex usa `buildReplayPolicy` por meio da
  família de replay `anthropic-by-model`, para que a limpeza de replay específica de Claude permaneça
  limitada a IDs Claude, em vez de todo transporte `anthropic-messages`.
- O Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveThinkingProfile` porque controla
  a classificação de erro específica do Bedrock para throttle/não pronto/overflow de contexto
  em tráfego Anthropic-on-Bedrock; sua política de replay ainda compartilha a mesma
  proteção somente de Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode e Opencode Go usam `buildReplayPolicy`
  por meio da família de replay `passthrough-gemini`, porque fazem proxy de modelos Gemini
  através de transportes compatíveis com OpenAI e precisam de
  saneamento de assinatura de pensamento do Gemini sem validação nativa de replay do Gemini ou
  regravações de bootstrap.
- O MiniMax usa `buildReplayPolicy` por meio da
  família de replay `hybrid-anthropic-openai`, porque um provedor controla tanto
  semânticas compatíveis com mensagens Anthropic quanto com OpenAI; ele mantém a remoção
  de bloco de thinking somente de Claude no lado Anthropic, enquanto substitui o modo de saída de raciocínio de volta para nativo, e a família de stream `minimax-fast-mode` controla
  regravações de modelo em fast-mode no caminho de stream compartilhado.
- O Moonshot usa `catalog`, `resolveThinkingProfile` e `wrapStreamFn`, porque ainda usa o
  transporte OpenAI compartilhado, mas precisa de normalização da carga de thinking controlada pelo provedor; a
  família de stream `moonshot-thinking` mapeia a configuração mais o estado de `/think` para sua
  carga nativa binária de thinking.
- O Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` porque precisa de cabeçalhos de requisição controlados pelo provedor,
  normalização da carga de raciocínio, dicas de transcrição do Gemini e
  restrição de TTL de cache do Anthropic; a família de stream `kilocode-thinking` mantém a injeção
  de thinking do Kilo no caminho de stream proxy compartilhado, ao mesmo tempo em que ignora `kilo/auto` e
  outros IDs de modelo proxy que não aceitam cargas explícitas de raciocínio.
- O Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` porque controla fallback do GLM-5,
  padrões de `tool_stream`, UX binária de thinking, correspondência de modelo moderno e tanto
  autenticação de uso quanto busca de cota; a família de stream `tool-stream-default-on` mantém
  o wrapper padrão ativado de `tool_stream` fora da cola manuscrita por provedor.
- O xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  porque controla a normalização nativa do transporte xAI Responses, regravações de alias de fast-mode do Grok, `tool_stream` padrão, limpeza rígida de strict-tool / carga de raciocínio,
  reutilização de autenticação de fallback para ferramentas controladas pelo plugin, resolução de modelo Grok com compatibilidade futura e patches de compatibilidade controlados pelo provedor, como perfil de schema de ferramenta do xAI,
  palavras-chave de schema sem suporte, `web_search` nativo e decodificação de argumentos de chamada de ferramenta com entidades HTML.
- Mistral, OpenCode Zen e OpenCode Go usam apenas `capabilities` para manter
  particularidades de transcrição/ferramentas fora do core.
- Provedores incluídos somente com catálogo, como `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine`, usam
  apenas `catalog`.
- O Qwen usa `catalog` para seu provedor de texto, além de registros compartilhados de compreensão de mídia e
  geração de vídeo para suas superfícies multimodais.
- MiniMax e Xiaomi usam `catalog` mais hooks de uso porque seu comportamento de `/usage`
  é controlado pelo plugin, embora a inferência ainda seja executada pelos transportes compartilhados.

## Auxiliares de runtime

Plugins podem acessar auxiliares selecionados do core via `api.runtime`. Para TTS:

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

- `textToSpeech` retorna a carga normal de saída de TTS do core para superfícies de arquivo/mensagem de voz.
- Usa a configuração `messages.tts` e a seleção de provedor do core.
- Retorna buffer de áudio PCM + sample rate. Plugins devem fazer resample/encode para provedores.
- `listVoices` é opcional por provedor. Use para seletores de voz ou fluxos de configuração controlados pelo fornecedor.
- Listas de vozes podem incluir metadados mais ricos, como locale, gênero e tags de personalidade para seletores com reconhecimento do provedor.
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
- O modelo de propriedade preferido é orientado por empresa: um plugin de fornecedor pode controlar
  texto, fala, imagem e futuros provedores de mídia à medida que o OpenClaw adiciona esses
  contratos de capacidade.

Para compreensão de imagem/áudio/vídeo, plugins registram um único provedor tipado
de compreensão de mídia em vez de um pacote genérico chave/valor:

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

- Mantenha orquestração, fallback, configuração e integração de canal no core.
- Mantenha o comportamento do fornecedor no plugin do provedor.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos opcionais
  de resultado, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core controla o contrato de capacidade e o auxiliar de runtime
  - plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - plugins de recurso/canal consomem `api.runtime.videoGeneration.*`

Para auxiliares de runtime de compreensão de mídia, plugins podem chamar:

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

Para transcrição de áudio, plugins podem usar o runtime de compreensão de mídia
ou o alias STT mais antigo:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opcional quando o MIME não puder ser inferido com confiabilidade:
  mime: "audio/ogg",
});
```

Observações:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferida para
  compreensão de imagem/áudio/vídeo.
- Usa a configuração de áudio de compreensão de mídia do core (`tools.media.audio`) e a ordem de fallback do provedor.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/sem suporte).
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

- `provider` e `model` são substituições opcionais por execução, não mudanças persistentes de sessão.
- O OpenClaw só respeita esses campos de substituição para chamadores confiáveis.
- Para execuções de fallback controladas pelo plugin, operadores precisam ativar explicitamente com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a destinos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer destino.
- Execuções de subagente de plugins não confiáveis ainda funcionam, mas solicitações de substituição são rejeitadas em vez de usar fallback silenciosamente.

Para pesquisa na web, plugins podem consumir o auxiliar de runtime compartilhado em vez de
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

Plugins também podem registrar provedores de pesquisa na web via
`api.registerWebSearchProvider(...)`.

Observações:

- Mantenha seleção de provedor, resolução de credenciais e semântica compartilhada de requisição no core.
- Use provedores de pesquisa na web para transportes de pesquisa específicos do fornecedor.
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

- `generate(...)`: gera uma imagem usando a cadeia configurada de provedores de geração de imagem.
- `listProviders(...)`: lista os provedores disponíveis de geração de imagem e suas capacidades.

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
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway, ou `"plugin"` para autenticação/validação de Webhook controlada pelo plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a requisição.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará um erro de carregamento do plugin. Use `api.registerHttpRoute(...)`.
- Rotas de plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com diferentes níveis de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de autenticação.
- Rotas `auth: "plugin"` **não** recebem automaticamente escopos de runtime do operador. Elas servem para Webhooks/validação de assinatura controlados pelo plugin, não para chamadas privilegiadas a auxiliares do Gateway.
- Rotas `auth: "gateway"` são executadas dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém escopos de runtime de rota de plugin fixos em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo, `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) respeitam `x-openclaw-scopes` apenas quando o cabeçalho está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas requisições de rota de plugin com identidade, o escopo de runtime usa fallback para `operator.write`
- Regra prática: não assuma que uma rota de plugin autenticada pelo gateway é implicitamente uma superfície de admin. Se sua rota precisar de comportamento exclusivo de admin, exija um modo de autenticação com identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.

## Caminhos de importação do Plugin SDK

Use subcaminhos do SDK em vez da importação monolítica `openclaw/plugin-sdk` ao
criar plugins:

- `openclaw/plugin-sdk/plugin-entry` para primitivas de registro de plugin.
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
  `openclaw/plugin-sdk/webhook-ingress` para integração compartilhada de
  configuração/autenticação/resposta/Webhook. `channel-inbound` é o lar compartilhado para debounce, correspondência de menção,
  auxiliares de política de menção de entrada, formatação de envelope e auxiliares de contexto
  de envelope de entrada.
  `channel-setup` é a costura restrita de configuração de instalação opcional.
  `setup-runtime` é a superfície de configuração segura para runtime usada por `setupEntry` /
  inicialização adiada, incluindo adaptadores de patch de configuração seguros para importação.
  `setup-adapter-runtime` é a costura de adaptador de configuração de conta com reconhecimento de env.
  `setup-tools` é a pequena costura de auxiliares de CLI/arquivo/docs (`formatCliCommand`,
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
  `openclaw/plugin-sdk/directory-runtime` para auxiliares compartilhados de runtime/configuração.
  `telegram-command-config` é a costura pública restrita para normalização/validação de comando personalizado do Telegram e permanece disponível mesmo que a superfície de contrato incluída do Telegram fique temporariamente indisponível.
  `text-runtime` é a costura compartilhada de texto/markdown/logging, incluindo
  remoção de texto visível ao assistente, auxiliares de renderização/fragmentação de markdown, auxiliares de redação,
  auxiliares de tag de diretiva e utilitários de texto seguro.
- Costuras de canal específicas de aprovação devem preferir um único contrato `approvalCapability` no plugin. O core então lê autenticação, entrega, renderização, roteamento nativo e comportamento lazy de handler nativo de aprovação por meio dessa única capacidade, em vez de misturar comportamento de aprovação em campos não relacionados do plugin.
- `openclaw/plugin-sdk/channel-runtime` está obsoleto e permanece apenas como um
  shim de compatibilidade para plugins mais antigos. Código novo deve importar as primitivas genéricas mais restritas, e o código do repositório não deve adicionar novas importações do
  shim.
- Internos de extensões incluídas permanecem privados. Plugins externos devem usar apenas subcaminhos `openclaw/plugin-sdk/*`. O código core/test do OpenClaw pode usar os pontos de entrada públicos do repositório sob a raiz de um pacote de plugin, como `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e arquivos de escopo restrito, como
  `login-qr-api.js`. Nunca importe `src/*` de um pacote de plugin a partir do core ou de outra extensão.
- Divisão do ponto de entrada do repositório:
  `<plugin-package-root>/api.js` é o barrel de auxiliares/tipos,
  `<plugin-package-root>/runtime-api.js` é o barrel somente de runtime,
  `<plugin-package-root>/index.js` é a entrada do plugin incluído,
  e `<plugin-package-root>/setup-entry.js` é a entrada do plugin de configuração.
- Exemplos atuais de provedores incluídos:
  - O Anthropic usa `api.js` / `contract-api.js` para auxiliares de stream do Claude, como
    `wrapAnthropicProviderStream`, auxiliares de cabeçalho beta e parsing de `service_tier`.
  - O OpenAI usa `api.js` para builders de provedor, auxiliares de modelo padrão e builders de provedor em tempo real.
  - O OpenRouter usa `api.js` para seu builder de provedor mais auxiliares de onboarding/configuração, enquanto `register.runtime.js` ainda pode reexportar auxiliares genéricos `plugin-sdk/provider-stream` para uso local do repositório.
- Pontos de entrada públicos carregados por facade preferem o snapshot ativo de configuração de runtime quando ele existe e depois usam como fallback o arquivo de configuração resolvido em disco quando o OpenClaw ainda não está servindo um snapshot de runtime.
- Primitivas genéricas compartilhadas continuam sendo o contrato público preferido do SDK. Ainda existe um pequeno conjunto reservado de costuras auxiliares com marca de canais incluídos para compatibilidade. Trate-as como costuras de manutenção/compatibilidade de plugins incluídos, não como novos alvos de importação de terceiros; novos contratos entre canais ainda devem ser colocados em subcaminhos genéricos `plugin-sdk/*` ou nos barrels locais do plugin `api.js` /
  `runtime-api.js`.

Observação de compatibilidade:

- Evite o barrel raiz `openclaw/plugin-sdk` em código novo.
- Prefira primeiro as primitivas estáveis e restritas. Os subcaminhos mais novos de setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool são o contrato pretendido para novo trabalho com
  plugins incluídos e externos.
  A análise/correspondência de destino pertence a `openclaw/plugin-sdk/channel-targets`.
  Gates de ação de mensagem e auxiliares de ID de mensagem de reação pertencem a
  `openclaw/plugin-sdk/channel-actions`.
- Barrels auxiliares específicos de extensões incluídas não são estáveis por padrão. Se um
  auxiliar for necessário apenas por uma extensão incluída, mantenha-o atrás da costura
  local `api.js` ou `runtime-api.js` da extensão, em vez de promovê-lo para
  `openclaw/plugin-sdk/<extension>`.
- Novas costuras de auxiliares compartilhados devem ser genéricas, não com marca de canal. A análise
  compartilhada de destino pertence a `openclaw/plugin-sdk/channel-targets`; internos específicos
  do canal permanecem atrás da costura local `api.js` ou `runtime-api.js` do plugin proprietário.
- Subcaminhos específicos de capacidade, como `image-generation`,
  `media-understanding` e `speech`, existem porque plugins incluídos/nativos os usam
  hoje. Sua presença não significa por si só que todo auxiliar exportado seja um
  contrato externo congelado de longo prazo.

## Schemas da ferramenta de mensagem

Plugins devem controlar contribuições específicas do canal em `describeMessageTool(...)`
para primitivas que não sejam mensagem, como reações, leituras e enquetes.
O envio compartilhado de apresentação deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos de botões, componentes, blocos ou cartões do provedor.
Consulte [Message Presentation](/pt-BR/plugins/message-presentation) para o contrato,
regras de fallback, mapeamento de provedor e checklist para autores de plugins.

Plugins com capacidade de envio declaram o que conseguem renderizar por meio de capacidades de mensagem:

- `presentation` para blocos de apresentação semântica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O core decide se renderiza a apresentação nativamente ou a degrada para texto.
Não exponha escape hatches de UI nativa do provedor a partir da ferramenta genérica de mensagem.
Auxiliares de SDK obsoletos para schemas nativos legados continuam exportados para
plugins de terceiros existentes, mas plugins novos não devem usá-los.

## Resolução de destino de canal

Plugins de canal devem controlar a semântica específica do canal para destinos. Mantenha o
host genérico de saída e use a superfície do adaptador de mensagens para regras do provedor:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca no diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve pular diretamente para resolução semelhante a ID, em vez de busca em diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando o
  core precisa de uma resolução final controlada pelo provedor após a normalização ou após falha
  no diretório.
- `messaging.resolveOutboundSessionRoute(...)` controla a construção de rota de sessão
  específica do provedor depois que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes de
  pesquisar pares/grupos.
- Use `looksLikeId` para verificações do tipo “trate isto como um ID de destino explícito/nativo”.
- Use `resolveTarget` para fallback de normalização específico do provedor, não para
  busca ampla em diretório.
- Mantenha IDs nativos do provedor, como IDs de chat, IDs de thread, JIDs, handles e IDs de sala,
  dentro de valores `target` ou de parâmetros específicos do provedor, não em campos genéricos do SDK.

## Diretórios baseados em configuração

Plugins que derivam entradas de diretório a partir da configuração devem manter essa lógica no
plugin e reutilizar os auxiliares compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de pares/grupos baseados em configuração, como:

- pares de DM controlados por lista de permissões
- mapas configurados de canal/grupo
- fallbacks estáticos de diretório com escopo de conta

Os auxiliares compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consulta
- aplicação de limite
- auxiliares de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

A inspeção de conta específica do canal e a normalização de ID devem permanecer na
implementação do plugin.

## Catálogos de provedor

Plugins de provedor podem definir catálogos de modelo para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provedor
- `{ providers }` para várias entradas de provedor

Use `catalog` quando o plugin controlar IDs de modelo específicos do provedor, padrões de URL base
ou metadados de modelo restritos por autenticação.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos
provedores implícitos integrados do OpenClaw:

- `simple`: provedores simples orientados por chave de API ou env
- `profile`: provedores que aparecem quando perfis de autenticação existem
- `paired`: provedores que sintetizam várias entradas relacionadas de provedor
- `late`: último passo, depois de outros provedores implícitos

Provedores posteriores vencem em caso de colisão de chave, então plugins podem substituir
intencionalmente uma entrada de provedor integrada com o mesmo ID de provedor.

Compatibilidade:

- `discovery` ainda funciona como alias legado
- se `catalog` e `discovery` estiverem registrados, o OpenClaw usa `catalog`

## Inspeção de canal somente leitura

Se seu plugin registra um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que credenciais
  estão totalmente materializadas e pode falhar rapidamente quando segredos obrigatórios estiverem ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de doctor/reparo
  de configuração não devem precisar materializar credenciais de runtime apenas para
  descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status de credencial quando relevantes, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para relatar disponibilidade somente leitura. Retornar `tokenStatus: "available"` (e o campo de origem correspondente) já é suficiente para comandos do tipo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura relatem “configurado, mas indisponível neste caminho de comando” em vez de travar ou informar incorretamente que a conta não está configurada.

## Pacotes de pacote

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

Cada entrada se torna um plugin. Se o pacote listar várias extensões, o ID do plugin
se torna `name/<fileBase>`.

Se seu plugin importa dependências npm, instale-as nesse diretório para que
`node_modules` fique disponível (`npm install` / `pnpm install`).

Barreira de segurança: toda entrada `openclaw.extensions` deve permanecer dentro do diretório do plugin
após a resolução de symlink. Entradas que escapem do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências de plugin com
`npm install --omit=dev --ignore-scripts` (sem scripts de ciclo de vida, sem dependências de desenvolvimento em runtime). Mantenha as árvores de dependência do plugin em “JS/TS puro” e evite pacotes que exijam builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve apenas de configuração.
Quando o OpenClaw precisa de superfícies de configuração para um plugin de canal desativado, ou
quando um plugin de canal está ativado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso mantém a inicialização e a configuração mais leves
quando a entrada principal do plugin também conecta ferramentas, hooks ou outro código
somente de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode colocar um plugin de canal no mesmo caminho `setupEntry` durante a fase de
inicialização pré-listen do gateway, mesmo quando o canal já está configurado.

Use isso apenas quando `setupEntry` cobrir totalmente a superfície de inicialização que deve existir
antes que o gateway comece a escutar. Na prática, isso significa que a entrada de configuração
deve registrar toda capacidade controlada pelo canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes que o gateway comece a escutar
- quaisquer métodos, ferramentas ou serviços do gateway que precisem existir durante essa mesma janela

Se sua entrada completa ainda controlar qualquer capacidade de inicialização necessária, não ative
essa flag. Mantenha o plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais incluídos também podem publicar auxiliares de superfície de contrato apenas de configuração que o core
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual de promoção de configuração é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O core usa essa superfície quando precisa promover uma configuração legada de canal de conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
O Matrix é o exemplo incluído atual: ele move apenas chaves de autenticação/bootstrap para uma
conta promovida nomeada quando contas nomeadas já existem, e pode preservar uma
chave configurada de conta padrão não canônica, em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de configuração mantêm lazy a descoberta da superfície de contrato incluída. O tempo de importação permanece leve; a superfície de promoção é carregada apenas no primeiro uso, em vez de reentrar na inicialização do canal incluído ao importar o módulo.

Quando essas superfícies de inicialização incluem métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces de admin do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) permanecem reservados e sempre resolvem
para `operator.admin`, mesmo que um plugin solicite um escopo mais restrito.

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

Plugins de canal podem anunciar metadados de configuração/descoberta via `openclaw.channel` e
dicas de instalação via `openclaw.install`. Isso mantém os dados do catálogo do core livres de dados.

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
      "blurb": "Chat self-hosted via bots de Webhook do Nextcloud Talk.",
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
- `docsLabel`: substitui o texto do link para o link da documentação
- `preferOver`: IDs de plugin/canal de menor prioridade que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de cópia da superfície de seleção
- `markdownCapable`: marca o canal como compatível com markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de configuração quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: coloca o canal no fluxo padrão de quickstart `allowFrom`
- `forceAccountBinding`: exige vinculação explícita de conta mesmo quando existe apenas uma conta
- `preferSessionLookupForAnnounceTarget`: prefere busca de sessão ao resolver destinos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canal** (por exemplo, uma exportação
de registro MPM). Coloque um arquivo JSON em um destes caminhos:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto controlam a orquestração do contexto da sessão para ingestão, montagem
e Compaction. Registre-os em seu plugin com
`api.registerContextEngine(id, factory)` e selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline de contexto
padrão, em vez de apenas adicionar pesquisa de memória ou hooks.

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

Se seu mecanismo **não** controla o algoritmo de Compaction, mantenha `compact()`
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

Quando um plugin precisa de um comportamento que não se encaixa na API atual, não ignore
o sistema de plugins com um acesso privado. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato do core
   Decida qual comportamento compartilhado o core deve controlar: política, fallback, mesclagem de configuração,
   ciclo de vida, semântica voltada ao canal e formato do auxiliar de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor superfície tipada
   útil de capacidade.
3. conecte consumidores do core + canal/recurso
   Canais e plugins de recurso devem consumir a nova capacidade por meio do core,
   não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends nessa capacidade.
5. adicione cobertura de contrato
   Adicione testes para que a propriedade e o formato do registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw continua opinativo sem ficar codificado para a visão de mundo de um
único provedor. Consulte o [Capability Cookbook](/pt-BR/plugins/architecture)
para um checklist concreto de arquivos e um exemplo completo.

### Checklist de capacidade

Quando você adiciona uma nova capacidade, a implementação normalmente deve tocar estas
superfícies em conjunto:

- tipos de contrato do core em `src/<capability>/types.ts`
- executor/auxiliar de runtime do core em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- integração do registro de plugins em `src/plugins/registry.ts`
- exposição de runtime de plugin em `src/plugins/runtime/*` quando plugins de recurso/canal
  precisam consumi-la
- auxiliares de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de propriedade/contrato em `src/plugins/contracts/registry.ts`
- documentação para operador/plugin em `docs/`

Se uma dessas superfícies estiver faltando, normalmente isso é sinal de que a capacidade
ainda não está totalmente integrada.

### Modelo de capacidade

Padrão mínimo:

```ts
// contrato do core
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

// auxiliar de runtime compartilhado para plugins de recurso/canal
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

- o core controla o contrato de capacidade + orquestração
- plugins de fornecedor controlam implementações de fornecedor
- plugins de recurso/canal consomem auxiliares de runtime
- testes de contrato mantêm a propriedade explícita
