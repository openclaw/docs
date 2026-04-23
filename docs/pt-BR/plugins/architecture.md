---
read_when:
    - Criando ou depurando plugins nativos do OpenClaw
    - Entendendo o modelo de capacidade de plugin ou os limites de ownership
    - Trabalhando no pipeline de carregamento ou no registro de plugins
    - Implementando hooks de runtime de provider ou plugins de canal
sidebarTitle: Internals
summary: 'Internos de Plugin: modelo de capacidade, ownership, contratos, pipeline de carregamento e helpers de runtime'
title: Internos de Plugin
x-i18n:
    generated_at: "2026-04-23T14:04:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5a766c267b2618140c744cbebd28f2b206568f26ce50095b898520f4663e21d
    source_path: plugins/architecture.md
    workflow: 15
---

# Internos de Plugin

<Info>
  Esta é a **referência de arquitetura profunda**. Para guias práticos, consulte:
  - [Instalar e usar plugins](/pt-BR/tools/plugin) — guia do usuário
  - [Primeiros passos](/pt-BR/plugins/building-plugins) — primeiro tutorial de plugin
  - [Plugins de Canal](/pt-BR/plugins/sdk-channel-plugins) — crie um canal de mensagens
  - [Plugins de Provider](/pt-BR/plugins/sdk-provider-plugins) — crie um provider de modelos
  - [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — mapa de importação e API de registro
</Info>

Esta página cobre a arquitetura interna do sistema de Plugin do OpenClaw.

## Modelo público de capacidade

Capacidades são o modelo público de **plugin nativo** dentro do OpenClaw. Todo
plugin nativo do OpenClaw é registrado em um ou mais tipos de capacidade:

| Capacidade            | Método de registro                              | Exemplos de plugins                   |
| --------------------- | ----------------------------------------------- | ------------------------------------- |
| Inferência de texto   | `api.registerProvider(...)`                     | `openai`, `anthropic`                 |
| Backend de inferência CLI | `api.registerCliBackend(...)`               | `openai`, `anthropic`                 |
| Fala                  | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`             |
| Transcrição em tempo real | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                          |
| Voz em tempo real     | `api.registerRealtimeVoiceProvider(...)`        | `openai`                              |
| Compreensão de mídia  | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                    |
| Geração de imagem     | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax`  |
| Geração de música     | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                   |
| Geração de vídeo      | `api.registerVideoGenerationProvider(...)`      | `qwen`                                |
| Busca web             | `api.registerWebFetchProvider(...)`             | `firecrawl`                           |
| Pesquisa na web       | `api.registerWebSearchProvider(...)`            | `google`                              |
| Canal / mensagens     | `api.registerChannel(...)`                      | `msteams`, `matrix`                   |

Um plugin que registra zero capacidades, mas fornece hooks, ferramentas ou
serviços, é um plugin **legado apenas com hooks**. Esse padrão continua sendo totalmente compatível.

### Postura de compatibilidade externa

O modelo de capacidade já chegou ao core e é usado hoje por plugins
incluídos/nativos, mas a compatibilidade de plugins externos ainda precisa de um
critério mais rígido do que "está exportado, portanto está congelado".

Orientação atual:

- **plugins externos existentes:** mantenha integrações baseadas em hook funcionando; trate
  isso como a linha de base de compatibilidade
- **novos plugins incluídos/nativos:** prefira registro explícito de capacidade em vez de
  acessos específicos de fornecedor ou novos projetos apenas com hooks
- **plugins externos adotando registro de capacidade:** permitido, mas trate as
  superfícies auxiliares específicas de capacidade como algo em evolução, a menos que a documentação marque explicitamente um contrato como estável

Regra prática:

- APIs de registro de capacidade são a direção pretendida
- hooks legados continuam sendo o caminho mais seguro sem quebra para plugins externos durante
  a transição
- nem todos os subcaminhos auxiliares exportados são equivalentes; prefira o contrato
  documentado e restrito, não exports auxiliares incidentais

### Formatos de plugin

O OpenClaw classifica cada plugin carregado em um formato com base no seu
comportamento real de registro (não apenas em metadados estáticos):

- **plain-capability** -- registra exatamente um tipo de capacidade (por exemplo, um
  plugin apenas de provider como `mistral`)
- **hybrid-capability** -- registra vários tipos de capacidade (por exemplo,
  `openai` controla inferência de texto, fala, compreensão de mídia e geração
  de imagem)
- **hook-only** -- registra apenas hooks (tipados ou personalizados), sem capacidades,
  ferramentas, comandos ou serviços
- **non-capability** -- registra ferramentas, comandos, serviços ou rotas, mas sem
  capacidades

Use `openclaw plugins inspect <id>` para ver o formato e o detalhamento
de capacidades de um plugin. Consulte a [referência da CLI](/pt-BR/cli/plugins#inspect) para detalhes.

### Hooks legados

O hook `before_agent_start` continua compatível como caminho de compatibilidade para
plugins apenas com hooks. Plugins legados do mundo real ainda dependem dele.

Direção:

- manter funcionando
- documentá-lo como legado
- preferir `before_model_resolve` para trabalho de substituição de modelo/provider
- preferir `before_prompt_build` para trabalho de mutação de prompt
- remover apenas depois que o uso real cair e a cobertura de fixtures comprovar a segurança da migração

### Sinais de compatibilidade

Ao executar `openclaw doctor` ou `openclaw plugins inspect <id>`, você poderá ver
um destes rótulos:

| Sinal                      | Significado                                                  |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | A configuração é analisada corretamente e os plugins são resolvidos |
| **compatibility advisory** | O plugin usa um padrão compatível, mas mais antigo (ex.: `hook-only`) |
| **legacy warning**         | O plugin usa `before_agent_start`, que está obsoleto         |
| **hard error**             | A configuração é inválida ou o plugin não foi carregado      |

Nem `hook-only` nem `before_agent_start` vão quebrar seu plugin hoje --
`hook-only` é apenas consultivo, e `before_agent_start` gera apenas um aviso. Esses
sinais também aparecem em `openclaw status --all` e `openclaw plugins doctor`.

## Visão geral da arquitetura

O sistema de Plugin do OpenClaw tem quatro camadas:

1. **Manifesto + descoberta**
   O OpenClaw encontra plugins candidatos a partir de caminhos configurados, raízes de workspace,
   raízes globais de plugins e plugins incluídos. A descoberta lê primeiro
   manifestos nativos `openclaw.plugin.json`, além de manifestos de bundle compatíveis.
2. **Ativação + validação**
   O core decide se um plugin descoberto está ativado, desativado, bloqueado ou
   selecionado para um slot exclusivo, como memória.
3. **Carregamento em runtime**
   Plugins nativos do OpenClaw são carregados in-process via jiti e registram
   capacidades em um registro central. Bundles compatíveis são normalizados em
   registros de registro sem importar código de runtime.
4. **Consumo de superfície**
   O restante do OpenClaw lê o registro para expor ferramentas, canais, configuração
   de providers, hooks, rotas HTTP, comandos CLI e serviços.

Especificamente para a CLI de plugins, a descoberta de comandos-raiz é dividida em duas fases:

- metadados em tempo de análise vêm de `registerCli(..., { descriptors: [...] })`
- o módulo CLI real do plugin pode continuar lazy e registrar no primeiro uso

Isso mantém o código CLI controlado pelo plugin dentro do plugin, ao mesmo tempo
em que permite que o OpenClaw reserve nomes de comandos-raiz antes da análise.

O limite de design importante:

- descoberta + validação de configuração devem funcionar a partir de **metadados de manifesto/esquema**
  sem executar código de plugin
- o comportamento nativo em runtime vem do caminho `register(api)` do módulo do plugin

Essa separação permite que o OpenClaw valide configuração, explique plugins ausentes/desativados e
construa dicas de UI/esquema antes que o runtime completo esteja ativo.

### Plugins de canal e a ferramenta compartilhada de mensagem

Plugins de canal não precisam registrar uma ferramenta separada de enviar/editar/reagir para
ações normais de chat. O OpenClaw mantém uma única ferramenta `message` compartilhada no core, e
os plugins de canal controlam a descoberta e execução específicas do canal por trás dela.

O limite atual é:

- o core controla o host da ferramenta `message` compartilhada, a integração de prompt, o
  controle de sessão/thread e o despacho de execução
- os plugins de canal controlam a descoberta de ações com escopo, a descoberta de
  capacidades e quaisquer fragmentos de esquema específicos do canal
- os plugins de canal controlam a gramática de conversa da sessão específica do provider, como
  IDs de conversa codificam IDs de thread ou herdam de conversas pai
- os plugins de canal executam a ação final por meio de seu adaptador de ação

Para plugins de canal, a superfície do SDK é
`ChannelMessageActionAdapter.describeMessageTool(...)`. Essa chamada unificada
de descoberta permite que um plugin retorne suas ações visíveis, capacidades e contribuições
de esquema juntas, para que essas partes não se desalinhem.

Quando um parâmetro da ferramenta de mensagem específico do canal carrega uma fonte de mídia, como
um caminho local ou URL remota de mídia, o plugin também deve retornar
`mediaSourceParams` de `describeMessageTool(...)`. O core usa essa lista explícita
para aplicar normalização de caminho em sandbox e dicas de acesso de mídia de saída
sem codificar nomes de parâmetro controlados pelo plugin. Prefira
mapas com escopo de ação ali, não uma lista plana única por canal, para que um
parâmetro de mídia apenas de perfil não seja normalizado em ações não relacionadas, como
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

Isso é importante para plugins sensíveis ao contexto. Um canal pode ocultar ou expor
ações de mensagem com base na conta ativa, sala/thread/mensagem atual ou
identidade confiável do solicitante, sem codificar ramificações específicas do canal no
core da ferramenta `message`.

É por isso que mudanças de roteamento do runner embutido ainda são trabalho de plugin: o runner é
responsável por encaminhar a identidade atual de chat/sessão para o limite de descoberta
do plugin, para que a ferramenta `message` compartilhada exponha a superfície
controlada pelo canal correta para o turno atual.

Para helpers de execução controlados por canal, plugins incluídos devem manter o runtime
de execução dentro de seus próprios módulos de extensão. O core não controla mais os
runtimes de ação de mensagem de Discord, Slack, Telegram ou WhatsApp em `src/agents/tools`.
Não publicamos subcaminhos separados `plugin-sdk/*-action-runtime`, e plugins incluídos
devem importar seu próprio código local de runtime diretamente de seus
módulos controlados pela extensão.

O mesmo limite se aplica em geral a seams do SDK nomeados por provider: o core não
deve importar barrels de conveniência específicos de canal para Slack, Discord, Signal,
WhatsApp ou extensões semelhantes. Se o core precisar de um comportamento, ou deve consumir
o próprio barrel `api.ts` / `runtime-api.ts` do plugin incluído, ou promover a necessidade
a uma capacidade genérica e restrita no SDK compartilhado.

Especificamente para enquetes, há dois caminhos de execução:

- `outbound.sendPoll` é a linha de base compartilhada para canais que se encaixam no
  modelo comum de enquete
- `actions.handleAction("poll")` é o caminho preferido para semântica de enquete específica de canal ou parâmetros extras de enquete

Agora o core adia a análise compartilhada de enquete até depois que o despacho de enquete do plugin recusar
a ação, de modo que handlers de enquete controlados pelo plugin possam aceitar campos
de enquete específicos do canal sem serem bloqueados primeiro pelo analisador genérico de enquete.

Consulte [Pipeline de carregamento](#load-pipeline) para a sequência completa de inicialização.

## Modelo de ownership de capacidade

O OpenClaw trata um plugin nativo como o limite de ownership para uma **empresa** ou um
**recurso**, não como um amontoado de integrações não relacionadas.

Isso significa:

- um plugin de empresa normalmente deve controlar todas as superfícies do OpenClaw
  dessa empresa
- um plugin de recurso normalmente deve controlar toda a superfície do recurso que introduz
- canais devem consumir capacidades compartilhadas do core em vez de reimplementar
  comportamento de provider de forma ad hoc

Exemplos:

- o plugin incluído `openai` controla o comportamento de provider de modelo da OpenAI e o comportamento de fala + voz em tempo real + compreensão de mídia + geração de imagem da OpenAI
- o plugin incluído `elevenlabs` controla o comportamento de fala da ElevenLabs
- o plugin incluído `microsoft` controla o comportamento de fala da Microsoft
- o plugin incluído `google` controla o comportamento de provider de modelo do Google, além de compreensão de mídia + geração de imagem + pesquisa na web do Google
- o plugin incluído `firecrawl` controla o comportamento de busca web do Firecrawl
- os plugins incluídos `minimax`, `mistral`, `moonshot` e `zai` controlam seus backends de compreensão de mídia
- o plugin incluído `qwen` controla o comportamento de provider de texto do Qwen, além de comportamento de compreensão de mídia e geração de vídeo
- o plugin `voice-call` é um plugin de recurso: ele controla transporte de chamadas, ferramentas,
  CLI, rotas e bridge de stream de mídia do Twilio, mas consome capacidades compartilhadas de fala,
  além de transcrição em tempo real e voz em tempo real, em vez de importar plugins de fornecedor diretamente

O estado final pretendido é:

- OpenAI vive em um único plugin, mesmo que abranja modelos de texto, fala, imagens e
  vídeo no futuro
- outro fornecedor pode fazer o mesmo para sua própria área de superfície
- canais não se importam com qual plugin de fornecedor controla o provider; eles consomem o
  contrato de capacidade compartilhado exposto pelo core

Esta é a distinção-chave:

- **plugin** = limite de ownership
- **capacidade** = contrato do core que vários plugins podem implementar ou consumir

Então, se o OpenClaw adicionar um novo domínio, como vídeo, a primeira pergunta não é
"qual provider deve codificar o tratamento de vídeo?" A primeira pergunta é "qual é
o contrato de capacidade central para vídeo?" Depois que esse contrato existir, plugins
de fornecedor poderão registrar-se nele, e plugins de canal/recurso poderão consumi-lo.

Se a capacidade ainda não existir, o movimento certo geralmente é:

1. definir a capacidade ausente no core
2. expô-la pela API/runtime de plugin de forma tipada
3. conectar canais/recursos a essa capacidade
4. deixar plugins de fornecedor registrar implementações

Isso mantém o ownership explícito enquanto evita comportamento no core que dependa de um
único fornecedor ou de um caminho de código específico de plugin.

### Camadas de capacidade

Use este modelo mental ao decidir onde o código deve ficar:

- **camada de capacidade do core**: orquestração compartilhada, política, fallback, regras de mesclagem
  de configuração, semântica de entrega e contratos tipados
- **camada de plugin de fornecedor**: APIs específicas do fornecedor, autenticação, catálogos de modelos, síntese
  de fala, geração de imagem, futuros backends de vídeo, endpoints de uso
- **camada de plugin de canal/recurso**: integração com Slack/Discord/voice-call/etc.
  que consome capacidades centrais e as apresenta em uma superfície

Por exemplo, TTS segue este formato:

- o core controla política de TTS em tempo de resposta, ordem de fallback, preferências e entrega em canal
- `openai`, `elevenlabs` e `microsoft` controlam implementações de síntese
- `voice-call` consome o helper de runtime de TTS para telefonia

Esse mesmo padrão deve ser preferido para capacidades futuras.

### Exemplo de plugin de empresa com várias capacidades

Um plugin de empresa deve parecer coeso visto de fora. Se o OpenClaw tiver contratos
compartilhados para modelos, fala, transcrição em tempo real, voz em tempo real, compreensão de mídia,
geração de imagem, geração de vídeo, busca web e pesquisa na web, um fornecedor pode controlar
todas as suas superfícies em um único lugar:

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

O importante não são os nomes exatos dos helpers. O que importa é o formato:

- um plugin controla a superfície do fornecedor
- o core continua controlando os contratos de capacidade
- canais e plugins de recurso consomem helpers `api.runtime.*`, não código do fornecedor
- testes de contrato podem verificar se o plugin registrou as capacidades que
  afirma controlar

### Exemplo de capacidade: compreensão de vídeo

O OpenClaw já trata compreensão de imagem/áudio/vídeo como uma única
capacidade compartilhada. O mesmo modelo de ownership se aplica aqui:

1. o core define o contrato de compreensão de mídia
2. plugins de fornecedor registram `describeImage`, `transcribeAudio` e
   `describeVideo`, conforme aplicável
3. canais e plugins de recurso consomem o comportamento compartilhado do core em vez de
   se conectar diretamente ao código do fornecedor

Isso evita incorporar suposições de vídeo de um único provider no core. O plugin controla
a superfície do fornecedor; o core controla o contrato de capacidade e o comportamento de fallback.

A geração de vídeo já usa essa mesma sequência: o core controla o contrato de
capacidade tipado e o helper de runtime, e plugins de fornecedor registram
implementações `api.registerVideoGenerationProvider(...)` nele.

Precisa de uma checklist concreta de rollout? Consulte
[Capability Cookbook](/pt-BR/plugins/architecture).

## Contratos e enforcement

A superfície da API de plugin é intencionalmente tipada e centralizada em
`OpenClawPluginApi`. Esse contrato define os pontos de registro compatíveis e
os helpers de runtime nos quais um plugin pode confiar.

Por que isso importa:

- autores de plugin recebem um padrão interno estável
- o core pode rejeitar ownership duplicado, como dois plugins registrando o mesmo
  ID de provider
- a inicialização pode expor diagnósticos acionáveis para registros malformados
- testes de contrato podem aplicar ownership de plugins incluídos e evitar desvio silencioso

Há duas camadas de enforcement:

1. **enforcement de registro em runtime**
   O registro de plugins valida registros à medida que os plugins são carregados. Exemplos:
   IDs de provider duplicados, IDs duplicados de provider de fala e registros
   malformados produzem diagnósticos de plugin em vez de comportamento indefinido.
2. **testes de contrato**
   Plugins incluídos são capturados em registros de contrato durante execuções de teste, para que
   o OpenClaw possa verificar explicitamente o ownership. Hoje isso é usado para model
   providers, speech providers, web search providers e ownership de registro incluído.

O efeito prático é que o OpenClaw sabe, de antemão, qual plugin controla qual
superfície. Isso permite que o core e os canais componham sem atrito, porque o ownership é
declarado, tipado e testável, em vez de implícito.

### O que pertence a um contrato

Bons contratos de plugin são:

- tipados
- pequenos
- específicos de capacidade
- controlados pelo core
- reutilizáveis por vários plugins
- consumíveis por canais/recursos sem conhecimento do fornecedor

Contratos ruins de plugin são:

- política específica de fornecedor escondida no core
- escapatórias pontuais de plugin que contornam o registro
- código de canal acessando diretamente uma implementação de fornecedor
- objetos de runtime ad hoc que não fazem parte de `OpenClawPluginApi` nem de
  `api.runtime`

Na dúvida, eleve o nível de abstração: defina primeiro a capacidade e depois
deixe os plugins se conectarem a ela.

## Modelo de execução

Plugins nativos do OpenClaw são executados **in-process** com o Gateway. Eles não
ficam em sandbox. Um plugin nativo carregado tem o mesmo limite de confiança no nível de processo que
o código do core.

Implicações:

- um plugin nativo pode registrar ferramentas, handlers de rede, hooks e serviços
- um bug em plugin nativo pode travar ou desestabilizar o gateway
- um plugin nativo malicioso equivale a execução arbitrária de código dentro
  do processo do OpenClaw

Bundles compatíveis são mais seguros por padrão porque o OpenClaw atualmente os trata
como pacotes de metadados/conteúdo. Nas versões atuais, isso significa principalmente
Skills incluídas.

Use allowlists e caminhos explícitos de instalação/carregamento para plugins não incluídos. Trate
plugins de workspace como código de tempo de desenvolvimento, não como padrões de produção.

Para nomes de pacote de workspace incluídos, mantenha o ID do plugin ancorado no nome
npm: `@openclaw/<id>` por padrão, ou um sufixo tipado aprovado, como
`-provider`, `-plugin`, `-speech`, `-sandbox` ou `-media-understanding`, quando
o pacote expõe intencionalmente um papel de plugin mais restrito.

Observação importante sobre confiança:

- `plugins.allow` confia em **IDs de plugin**, não na proveniência da origem.
- Um plugin de workspace com o mesmo ID de um plugin incluído ofusca intencionalmente
  a cópia incluída quando esse plugin de workspace está ativado/na allowlist.
- Isso é normal e útil para desenvolvimento local, teste de patches e hotfixes.
- A confiança em plugin incluído é resolvida a partir do snapshot da origem — o manifesto e
  o código em disco no momento do carregamento — e não dos metadados de instalação. Um
  registro de instalação corrompido ou substituído não pode ampliar silenciosamente a
  superfície de confiança de um plugin incluído além do que a origem real afirma.

## Limite de exportação

O OpenClaw exporta capacidades, não conveniências de implementação.

Mantenha o registro de capacidade público. Reduza exports auxiliares fora de contrato:

- subcaminhos auxiliares específicos de plugin incluído
- subcaminhos de plumbing de runtime não destinados a API pública
- helpers de conveniência específicos de fornecedor
- helpers de setup/onboarding que sejam detalhes de implementação

Alguns subcaminhos auxiliares de plugins incluídos ainda permanecem no mapa de exportação
gerado do SDK por compatibilidade e manutenção de plugins incluídos. Exemplos atuais incluem
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e vários seams `plugin-sdk/matrix*`. Trate-os como
exports reservados de detalhe de implementação, não como o padrão recomendado do SDK para
novos plugins de terceiros.

## Pipeline de carregamento

Na inicialização, o OpenClaw faz aproximadamente isto:

1. descobre raízes candidatas de plugins
2. lê manifestos nativos ou de bundle compatíveis e metadados de pacote
3. rejeita candidatos inseguros
4. normaliza a configuração de plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide a ativação de cada candidato
6. carrega módulos nativos ativados: módulos incluídos já compilados usam um carregador nativo;
   plugins nativos não compilados usam jiti
7. chama hooks nativos `register(api)` e coleta registros no registro de plugins
8. expõe o registro a superfícies de comando/runtime

<Note>
`activate` é um alias legado para `register` — o carregador resolve o que estiver presente (`def.register ?? def.activate`) e o chama no mesmo ponto. Todos os plugins incluídos usam `register`; prefira `register` para novos plugins.
</Note>

As proteções de segurança acontecem **antes** da execução em runtime. Candidatos são bloqueados
quando a entrada escapa da raiz do plugin, quando o caminho é gravável por qualquer usuário ou quando a propriedade do caminho parece suspeita para plugins não incluídos.

### Comportamento manifest-first

O manifesto é a fonte de verdade do plano de controle. O OpenClaw o usa para:

- identificar o plugin
- descobrir canais/Skills/esquema de configuração declarados ou capacidades de bundle
- validar `plugins.entries.<id>.config`
- ampliar rótulos/placeholders da Control UI
- mostrar metadados de instalação/catálogo
- preservar descritores baratos de ativação e setup sem carregar o runtime do plugin

Para plugins nativos, o módulo de runtime é a parte do plano de dados. Ele registra
comportamento real, como hooks, ferramentas, comandos ou fluxos de provider.

Blocos opcionais `activation` e `setup` do manifesto permanecem no plano de controle.
Eles são descritores somente de metadados para planejamento de ativação e descoberta de setup;
não substituem o registro em runtime, `register(...)` nem `setupEntry`.
Os primeiros consumidores de ativação ao vivo agora usam dicas de manifesto de comando, canal e provider
para restringir o carregamento de plugin antes de uma materialização mais ampla do registro:

- O carregamento da CLI é restringido aos plugins que controlam o comando primário solicitado
- a resolução de setup/plugin de canal é restringida aos plugins que controlam o
  ID de canal solicitado
- a resolução explícita de setup/runtime de provider é restringida aos plugins que controlam o
  ID de provider solicitado

A descoberta de setup agora prioriza IDs controlados por descritor, como `setup.providers` e
`setup.cliBackends`, para restringir plugins candidatos antes de recorrer a
`setup-api` para plugins que ainda precisam de hooks de runtime em tempo de setup. Se mais de
um plugin descoberto reivindicar o mesmo ID normalizado de provider de setup ou backend CLI, a busca de setup recusa o owner ambíguo em vez de depender da ordem de descoberta.

### O que o carregador mantém em cache

O OpenClaw mantém caches curtos in-process para:

- resultados de descoberta
- dados do registro de manifestos
- registros de plugins carregados

Esses caches reduzem inicialização em rajadas e a sobrecarga de comandos repetidos. É seguro
pensar neles como caches de desempenho de curta duração, não como persistência.

Observação de desempenho:

- Defina `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` ou
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` para desativar esses caches.
- Ajuste as janelas de cache com `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modelo de registro

Plugins carregados não modificam diretamente globais aleatórios do core. Eles se registram em um
registro central de plugins.

O registro acompanha:

- registros de plugin (identidade, origem, procedência, status, diagnósticos)
- ferramentas
- hooks legados e hooks tipados
- canais
- providers
- handlers RPC do gateway
- rotas HTTP
- registradores CLI
- serviços em segundo plano
- comandos controlados pelo plugin

Os recursos do core então leem esse registro em vez de falar diretamente com módulos
de plugin. Isso mantém o carregamento em uma única direção:

- módulo do plugin -> registro no registro
- runtime do core -> consumo do registro

Essa separação importa para a manutenção. Significa que a maioria das superfícies do core só
precisa de um ponto de integração: "leia o registro", não "faça caso especial para cada módulo de plugin".

## Callbacks de binding de conversa

Plugins que fazem binding de uma conversa podem reagir quando uma aprovação é resolvida.

Use `api.onConversationBindingResolved(...)` para receber um callback depois que uma solicitação de binding
for aprovada ou negada:

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
- `binding`: o binding resolvido para solicitações aprovadas
- `request`: o resumo da solicitação original, dica de detach, ID do remetente e
  metadados da conversa

Esse callback é apenas notificacional. Ele não altera quem tem permissão para fazer binding de uma
conversa, e é executado depois que o tratamento de aprovação do core termina.

## Hooks de runtime de provider

Plugins de provider agora têm duas camadas:

- metadados de manifesto: `providerAuthEnvVars` para busca barata de autenticação
  por env do provider antes do carregamento do runtime, `providerAuthAliases` para variantes de provider que compartilham
  autenticação, `channelEnvVars` para busca barata de env/setup de canal antes do
  carregamento do runtime, além de `providerAuthChoices` para rótulos baratos de onboarding/escolha de autenticação e
  metadados de flags CLI antes do carregamento do runtime
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

O OpenClaw continua controlando o loop genérico do agente, failover, tratamento de transcrição e
política de ferramentas. Esses hooks são a superfície de extensão para comportamento específico de provider sem
exigir um transporte de inferência totalmente personalizado.

Use o manifesto `providerAuthEnvVars` quando o provider tiver credenciais baseadas em env
que caminhos genéricos de autenticação/status/seletor de modelo devam enxergar sem carregar o runtime do plugin.
Use o manifesto `providerAuthAliases` quando um ID de provider precisar reutilizar
variáveis de env, perfis de autenticação, autenticação com suporte de configuração e a escolha de onboarding de chave de API de outro ID de provider. Use o manifesto `providerAuthChoices` quando as
superfícies CLI de onboarding/escolha de autenticação precisarem conhecer o ID de escolha do provider, rótulos de grupo e a ligação simples de autenticação por uma flag sem carregar o runtime do provider. Mantenha o `envVars` do runtime do provider para dicas voltadas ao operador, como rótulos de onboarding ou variáveis de setup de client-id/client-secret de OAuth.

Use o manifesto `channelEnvVars` quando um canal tiver autenticação ou setup orientado por env que
fallback genérico de shell-env, verificações de config/status ou prompts de setup precisem enxergar
sem carregar o runtime do canal.

### Ordem dos hooks e uso

Para plugins de modelo/provider, o OpenClaw chama hooks nesta ordem aproximada.
A coluna "Quando usar" é o guia rápido de decisão.

| #   | Hook                              | O que faz                                                                                                      | Quando usar                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Publica a configuração do provider em `models.providers` durante a geração de `models.json`                   | O provider controla um catálogo ou padrões de URL base                                                                                        |
| 2   | `applyConfigDefaults`             | Aplica padrões globais controlados pelo provider durante a materialização da configuração                      | Os padrões dependem do modo de autenticação, env ou semântica da família de modelos do provider                                              |
| --  | _(busca de modelo embutida)_      | O OpenClaw tenta primeiro o caminho normal de registro/catálogo                                                | _(não é um hook de plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normaliza aliases legados ou de preview de ID de modelo antes da busca                                         | O provider controla a limpeza de aliases antes da resolução do modelo canônico                                                                |
| 4   | `normalizeTransport`              | Normaliza `api` / `baseUrl` da família do provider antes da montagem genérica do modelo                        | O provider controla a limpeza de transporte para IDs de provider personalizados na mesma família de transporte                               |
| 5   | `normalizeConfig`                 | Normaliza `models.providers.<id>` antes da resolução de runtime/provider                                       | O provider precisa de limpeza de configuração que deve ficar com o plugin; helpers incluídos da família Google também cobrem entradas compatíveis de configuração do Google |
| 6   | `applyNativeStreamingUsageCompat` | Aplica reescritas de compatibilidade de uso de streaming nativo a providers de configuração                    | O provider precisa de correções de metadados de uso de streaming nativo orientadas por endpoint                                              |
| 7   | `resolveConfigApiKey`             | Resolve autenticação por marcador de env para providers de configuração antes do carregamento de autenticação de runtime | O provider tem resolução própria de chave de API por marcador de env; `amazon-bedrock` também tem aqui um resolvedor embutido de marcador de env da AWS |
| 8   | `resolveSyntheticAuth`            | Expõe autenticação local/self-hosted ou com suporte de configuração sem persistir texto simples                | O provider pode operar com um marcador de credencial sintética/local                                                                         |
| 9   | `resolveExternalAuthProfiles`     | Sobrepõe perfis externos de autenticação controlados pelo provider; o `persistence` padrão é `runtime-only` para credenciais de CLI/app | O provider reutiliza credenciais externas de autenticação sem persistir tokens de refresh copiados; declare `contracts.externalAuthProviders` no manifesto |
| 10  | `shouldDeferSyntheticProfileAuth` | Rebaixa placeholders de perfil sintético armazenado abaixo de autenticação com suporte de env/configuração     | O provider armazena perfis placeholder sintéticos que não devem ganhar precedência                                                           |
| 11  | `resolveDynamicModel`             | Fallback síncrono para IDs de modelo controlados pelo provider que ainda não estão no registro local           | O provider aceita IDs arbitrários de modelo upstream                                                                                          |
| 12  | `prepareDynamicModel`             | Aquecimento assíncrono; depois `resolveDynamicModel` roda novamente                                            | O provider precisa de metadados de rede antes de resolver IDs desconhecidos                                                                   |
| 13  | `normalizeResolvedModel`          | Reescrita final antes de o runner embutido usar o modelo resolvido                                             | O provider precisa de reescritas de transporte, mas ainda usa um transporte do core                                                          |
| 14  | `contributeResolvedModelCompat`   | Contribui flags de compatibilidade para modelos do fornecedor atrás de outro transporte compatível             | O provider reconhece seus próprios modelos em transportes proxy sem assumir o controle do provider                                           |
| 15  | `capabilities`                    | Metadados de transcrição/ferramentas controlados pelo provider usados pela lógica compartilhada do core        | O provider precisa de peculiaridades de transcrição/família de provider                                                                       |
| 16  | `normalizeToolSchemas`            | Normaliza esquemas de ferramentas antes que o runner embutido os veja                                          | O provider precisa de limpeza de esquema da família de transporte                                                                             |
| 17  | `inspectToolSchemas`              | Expõe diagnósticos de esquema controlados pelo provider após a normalização                                     | O provider quer avisos de palavra-chave sem ensinar ao core regras específicas do provider                                                   |
| 18  | `resolveReasoningOutputMode`      | Seleciona contrato de saída de reasoning nativo vs com tags                                                    | O provider precisa de saída final/reasoning com tags em vez de campos nativos                                                                |
| 19  | `prepareExtraParams`              | Normalização de parâmetros de requisição antes dos wrappers genéricos de opções de stream                      | O provider precisa de parâmetros de requisição padrão ou limpeza de parâmetros por provider                                                  |
| 20  | `createStreamFn`                  | Substitui totalmente o caminho normal de stream por um transporte personalizado                                | O provider precisa de um protocolo de comunicação personalizado, não apenas de um wrapper                                                    |
| 21  | `wrapStreamFn`                    | Wrapper de stream depois que os wrappers genéricos são aplicados                                               | O provider precisa de wrappers de compatibilidade de cabeçalhos/corpo/modelo de requisição sem um transporte personalizado                  |
| 22  | `resolveTransportTurnState`       | Anexa cabeçalhos ou metadados nativos por turno ao transporte                                                  | O provider quer que transportes genéricos enviem identidade de turno nativa do provider                                                      |
| 23  | `resolveWebSocketSessionPolicy`   | Anexa cabeçalhos WebSocket nativos ou política de cooldown de sessão                                           | O provider quer que transportes genéricos WS ajustem cabeçalhos de sessão ou política de fallback                                            |
| 24  | `formatApiKey`                    | Formatador de perfil de autenticação: o perfil armazenado torna-se a string `apiKey` de runtime               | O provider armazena metadados extras de autenticação e precisa de um formato personalizado de token em runtime                              |
| 25  | `refreshOAuth`                    | Substituição de refresh OAuth para endpoints de refresh personalizados ou política de falha de refresh         | O provider não se encaixa nos refreshers compartilhados de `pi-ai`                                                                            |
| 26  | `buildAuthDoctorHint`             | Dica de correção anexada quando o refresh OAuth falha                                                          | O provider precisa de orientação de correção de autenticação específica do provider após falha de refresh                                    |
| 27  | `matchesContextOverflowError`     | Correspondência de overflow de janela de contexto controlada pelo provider                                     | O provider tem erros brutos de overflow que heurísticas genéricas não detectariam                                                            |
| 28  | `classifyFailoverReason`          | Classificação de motivo de failover controlada pelo provider                                                   | O provider pode mapear erros brutos de API/transporte para rate-limit/sobrecarga/etc.                                                        |
| 29  | `isCacheTtlEligible`              | Política de cache de prompt para providers proxy/backhaul                                                      | O provider precisa de controle de TTL de cache específico para proxy                                                                          |
| 30  | `buildMissingAuthMessage`         | Substituição da mensagem genérica de recuperação para autenticação ausente                                     | O provider precisa de uma dica de recuperação de autenticação ausente específica do provider                                                  |
| 31  | `suppressBuiltInModel`            | Supressão de modelo upstream obsoleto com dica opcional de erro voltada ao usuário                             | O provider precisa ocultar linhas upstream obsoletas ou substituí-las por uma dica do fornecedor                                             |
| 32  | `augmentModelCatalog`             | Linhas sintéticas/finais de catálogo anexadas após a descoberta                                                | O provider precisa de linhas sintéticas de compatibilidade futura em `models list` e seletores                                               |
| 33  | `resolveThinkingProfile`          | Conjunto de níveis `/think`, rótulos de exibição e padrão específicos do modelo                                | O provider expõe uma escada personalizada de thinking ou um rótulo binário para modelos selecionados                                         |
| 34  | `isBinaryThinking`                | Hook de compatibilidade para alternância de reasoning ligado/desligado                                         | O provider expõe apenas thinking binário ligado/desligado                                                                                     |
| 35  | `supportsXHighThinking`           | Hook de compatibilidade para suporte de reasoning `xhigh`                                                      | O provider quer `xhigh` apenas em um subconjunto de modelos                                                                                   |
| 36  | `resolveDefaultThinkingLevel`     | Hook de compatibilidade para nível padrão de `/think`                                                          | O provider controla a política padrão de `/think` para uma família de modelos                                                                 |
| 37  | `isModernModelRef`                | Correspondência de modelo moderno para filtros de perfil ao vivo e seleção de smoke                            | O provider controla a correspondência de modelo preferido para live/smoke                                                                     |
| 38  | `prepareRuntimeAuth`              | Troca uma credencial configurada pelo token/chave real de runtime imediatamente antes da inferência           | O provider precisa de uma troca de token ou de uma credencial de requisição de curta duração                                                 |
| 39  | `resolveUsageAuth`                | Resolve credenciais de uso/faturamento para `/usage` e superfícies de status relacionadas                     | O provider precisa de parsing personalizado de token de uso/cota ou de uma credencial de uso diferente                                      |
| 40  | `fetchUsageSnapshot`              | Busca e normaliza snapshots de uso/cota específicos do provider depois que a autenticação é resolvida         | O provider precisa de um endpoint de uso específico do provider ou de um parser de payload                                                   |
| 41  | `createEmbeddingProvider`         | Constrói um adaptador de embedding controlado pelo provider para memória/pesquisa                             | O comportamento de embedding de memória pertence ao plugin do provider                                                                        |
| 42  | `buildReplayPolicy`               | Retorna uma política de replay que controla o tratamento de transcrição para o provider                       | O provider precisa de uma política personalizada de transcrição (por exemplo, remoção de blocos de thinking)                                |
| 43  | `sanitizeReplayHistory`           | Reescreve o histórico de replay após a limpeza genérica de transcrição                                        | O provider precisa de reescritas de replay específicas além dos helpers compartilhados de Compaction                                         |
| 44  | `validateReplayTurns`             | Validação ou remodelagem final dos turnos de replay antes do runner embutido                                  | O transporte do provider precisa de validação de turnos mais estrita após a sanitização genérica                                             |
| 45  | `onModelSelected`                 | Executa efeitos colaterais pós-seleção controlados pelo provider                                              | O provider precisa de telemetria ou estado controlado pelo provider quando um modelo se torna ativo                                          |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` primeiro verificam o
plugin de provider correspondente e depois passam pelos demais plugins de provider com capacidade de hook
até que um deles realmente altere o ID do modelo ou o transporte/configuração. Isso mantém
shims de alias/provider compat funcionando sem exigir que o chamador saiba qual
plugin incluído controla a reescrita. Se nenhum hook de provider reescrever uma entrada de configuração
compatível da família Google, o normalizador de configuração incluído do Google ainda aplica
essa limpeza de compatibilidade.

Se o provider precisar de um protocolo de comunicação totalmente personalizado ou de um executor de requisição personalizado,
essa é outra classe de extensão. Esses hooks servem para comportamento de provider
que ainda roda no loop normal de inferência do OpenClaw.

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

### Exemplos incluídos

Plugins de provider incluídos usam os hooks acima em combinações adaptadas às necessidades de
catálogo, autenticação, thinking, replay e rastreamento de uso de cada fornecedor. O conjunto
exato de hooks por provider fica junto ao código-fonte do plugin em `extensions/`; trate
isso como a lista autoritativa em vez de espelhá-la aqui.

Padrões ilustrativos:

- **Providers de catálogo pass-through** (OpenRouter, Kilocode, Z.AI, xAI) registram
  `catalog` mais `resolveDynamicModel`/`prepareDynamicModel`, para que possam expor
  IDs de modelo upstream antes do catálogo estático do OpenClaw.
- **Providers com OAuth + endpoint de uso** (GitHub Copilot, Gemini CLI, ChatGPT
  Codex, MiniMax, Xiaomi, z.ai) combinam `prepareRuntimeAuth` ou `formatApiKey`
  com `resolveUsageAuth` + `fetchUsageSnapshot` para controlar a troca de token e a
  integração com `/usage`.
- **Limpeza de replay / transcrição** é compartilhada por famílias nomeadas:
  `google-gemini`, `passthrough-gemini`, `anthropic-by-model`,
  `hybrid-anthropic-openai`. Providers optam por participar por meio de `buildReplayPolicy`
  em vez de cada um implementar sua própria limpeza de transcrição.
- **Providers incluídos apenas com catálogo** (`byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`, `synthetic`, `together`,
  `venice`, `vercel-ai-gateway`, `volcengine`) registram apenas `catalog` e usam
  o loop compartilhado de inferência.
- **Helpers de stream específicos de Anthropic** (headers beta, `/fast`/`serviceTier`,
  `context1m`) ficam dentro do seam público `api.ts` /
  `contract-api.ts` do plugin incluído do Anthropic (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) em vez de ficarem no
  SDK genérico.

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

- `textToSpeech` retorna o payload normal de saída de TTS do core para superfícies de arquivo/nota de voz.
- Usa a configuração central `messages.tts` e a seleção de provider.
- Retorna buffer de áudio PCM + taxa de amostragem. Plugins devem reamostrar/codificar para providers.
- `listVoices` é opcional por provider. Use-o para seletores de voz ou fluxos de setup controlados pelo fornecedor.
- Listagens de vozes podem incluir metadados mais ricos, como localidade, gênero e tags de personalidade para seletores sensíveis ao provider.
- OpenAI e ElevenLabs oferecem suporte a telefonia atualmente. Microsoft não.

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

- Mantenha política de TTS, fallback e entrega de resposta no core.
- Use providers de fala para comportamento de síntese controlado pelo fornecedor.
- A entrada legada `edge` da Microsoft é normalizada para o ID de provider `microsoft`.
- O modelo preferido de ownership é orientado à empresa: um plugin de fornecedor pode controlar
  texto, fala, imagem e futuros providers de mídia à medida que o OpenClaw adiciona esses
  contratos de capacidade.

Para compreensão de imagem/áudio/vídeo, plugins registram um provider tipado único
de compreensão de mídia em vez de uma estrutura genérica de chave/valor:

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

- Mantenha orquestração, fallback, configuração e integração com canais no core.
- Mantenha o comportamento do fornecedor no plugin de provider.
- A expansão aditiva deve permanecer tipada: novos métodos opcionais, novos campos
  opcionais de resultado, novas capacidades opcionais.
- A geração de vídeo já segue o mesmo padrão:
  - o core controla o contrato de capacidade e o helper de runtime
  - plugins de fornecedor registram `api.registerVideoGenerationProvider(...)`
  - plugins de recurso/canal consomem `api.runtime.videoGeneration.*`

Para helpers de runtime de compreensão de mídia, plugins podem chamar:

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
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Observações:

- `api.runtime.mediaUnderstanding.*` é a superfície compartilhada preferida para
  compreensão de imagem/áudio/vídeo.
- Usa a configuração central de áudio de compreensão de mídia (`tools.media.audio`) e a ordem de fallback de provider.
- Retorna `{ text: undefined }` quando nenhuma saída de transcrição é produzida (por exemplo, entrada ignorada/não compatível).
- `api.runtime.stt.transcribeAudioFile(...)` continua como alias de compatibilidade.

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
- Para execuções de fallback controladas pelo plugin, operadores devem optar por isso com `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Use `plugins.entries.<id>.subagent.allowedModels` para restringir plugins confiáveis a alvos canônicos específicos `provider/model`, ou `"*"` para permitir explicitamente qualquer alvo.
- Execuções de subagente de plugins não confiáveis continuam funcionando, mas solicitações de substituição são rejeitadas em vez de cair silenciosamente em fallback.

Para pesquisa na web, plugins podem consumir o helper de runtime compartilhado em vez de
acessar a integração da ferramenta do agente:

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

- Mantenha seleção de provider, resolução de credenciais e semântica compartilhada de requisição no core.
- Use providers de pesquisa na web para transportes de busca específicos do fornecedor.
- `api.runtime.webSearch.*` é a superfície compartilhada preferida para plugins de recurso/canal que precisam de comportamento de busca sem depender do wrapper da ferramenta do agente.

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
- `listProviders(...)`: lista providers disponíveis de geração de imagem e suas capacidades.

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
- `auth`: obrigatório. Use `"gateway"` para exigir autenticação normal do gateway ou `"plugin"` para autenticação/verificação de Webhook gerenciada pelo plugin.
- `match`: opcional. `"exact"` (padrão) ou `"prefix"`.
- `replaceExisting`: opcional. Permite que o mesmo plugin substitua seu próprio registro de rota existente.
- `handler`: retorne `true` quando a rota tiver tratado a requisição.

Observações:

- `api.registerHttpHandler(...)` foi removido e causará erro de carregamento do plugin. Use `api.registerHttpRoute(...)` em vez disso.
- Rotas de plugin devem declarar `auth` explicitamente.
- Conflitos exatos de `path + match` são rejeitados, a menos que `replaceExisting: true`, e um plugin não pode substituir a rota de outro plugin.
- Rotas sobrepostas com diferentes níveis de `auth` são rejeitadas. Mantenha cadeias de fallthrough `exact`/`prefix` apenas no mesmo nível de autenticação.
- Rotas `auth: "plugin"` **não** recebem escopos de runtime do operador automaticamente. Elas servem para webhooks/verificação de assinatura gerenciados pelo plugin, não para chamadas auxiliares privilegiadas do Gateway.
- Rotas `auth: "gateway"` são executadas dentro de um escopo de runtime de requisição do Gateway, mas esse escopo é intencionalmente conservador:
  - autenticação bearer por segredo compartilhado (`gateway.auth.mode = "token"` / `"password"`) mantém os escopos de runtime de rotas de plugin fixados em `operator.write`, mesmo que o chamador envie `x-openclaw-scopes`
  - modos HTTP confiáveis com identidade (por exemplo `trusted-proxy` ou `gateway.auth.mode = "none"` em uma entrada privada) honram `x-openclaw-scopes` apenas quando o cabeçalho está explicitamente presente
  - se `x-openclaw-scopes` estiver ausente nessas requisições de rota de plugin com identidade, o escopo de runtime recorre a `operator.write`
- Regra prática: não presuma que uma rota de plugin autenticada pelo gateway é implicitamente uma superfície de administrador. Se sua rota precisar de comportamento exclusivo de administrador, exija um modo de autenticação com identidade e documente o contrato explícito do cabeçalho `x-openclaw-scopes`.

## Caminhos de importação do SDK de Plugin

Use subcaminhos estreitos do SDK em vez do barrel monolítico na raiz `openclaw/plugin-sdk`
ao criar novos plugins. Subcaminhos centrais:

| Subcaminho                          | Finalidade                                         |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Primitivas de registro de Plugin                   |
| `openclaw/plugin-sdk/channel-core`  | Helpers de entrada/construção de canal             |
| `openclaw/plugin-sdk/core`          | Helpers genéricos compartilhados e contrato guarda-chuva |
| `openclaw/plugin-sdk/config-schema` | Esquema Zod raiz de `openclaw.json` (`OpenClawSchema`) |

Plugins de canal escolhem entre uma família de seams estreitos — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. O comportamento de aprovação deve se consolidar
em um único contrato `approvalCapability`, em vez de se misturar entre campos
não relacionados do plugin. Consulte [Plugins de Canal](/pt-BR/plugins/sdk-channel-plugins).

Helpers de runtime e configuração ficam sob subcaminhos `*-runtime`
correspondentes (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` etc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` está obsoleto — é um shim de compatibilidade para
plugins mais antigos. Código novo deve importar primitivas genéricas mais estreitas.
</Info>

Pontos de entrada internos do repositório (por raiz de pacote de plugin incluído):

- `index.js` — entrada do plugin incluído
- `api.js` — barrel de helpers/tipos
- `runtime-api.js` — barrel apenas de runtime
- `setup-entry.js` — entrada do plugin de setup

Plugins externos devem importar apenas subcaminhos `openclaw/plugin-sdk/*`. Nunca
importe `src/*` do pacote de outro plugin a partir do core ou de outro plugin.
Pontos de entrada carregados por facade priorizam o snapshot ativo de configuração de runtime quando ele
existe e, em seguida, recorrem ao arquivo de configuração resolvido em disco.

Subcaminhos específicos de capacidade, como `image-generation`, `media-understanding`
e `speech`, existem porque plugins incluídos os usam hoje. Eles não são
automaticamente contratos externos congelados de longo prazo — consulte a página
de referência relevante do SDK ao depender deles.

## Esquemas da ferramenta de mensagem

Plugins devem controlar contribuições específicas de canal para o esquema de `describeMessageTool(...)`
para primitivas que não sejam mensagem, como reações, leituras e enquetes.
A apresentação compartilhada de envio deve usar o contrato genérico `MessagePresentation`
em vez de campos nativos de botões, componentes, blocos ou cards do provider.
Consulte [Message Presentation](/pt-BR/plugins/message-presentation) para o contrato,
regras de fallback, mapeamento por provider e checklist para autores de plugin.

Plugins com capacidade de envio declaram o que conseguem renderizar por meio de capacidades de mensagem:

- `presentation` para blocos semânticos de apresentação (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` para solicitações de entrega fixada

O core decide se deve renderizar a apresentação de forma nativa ou degradá-la para texto.
Não exponha escapatórias de UI nativas do provider a partir da ferramenta genérica de mensagem.
Helpers obsoletos do SDK para esquemas nativos legados continuam exportados para
plugins de terceiros existentes, mas novos plugins não devem usá-los.

## Resolução de destino de canal

Plugins de canal devem controlar a semântica específica de destino do canal. Mantenha
o host compartilhado de saída genérico e use a superfície do adaptador de mensagens para regras do provider:

- `messaging.inferTargetChatType({ to })` decide se um destino normalizado
  deve ser tratado como `direct`, `group` ou `channel` antes da busca no diretório.
- `messaging.targetResolver.looksLikeId(raw, normalized)` informa ao core se uma
  entrada deve ir direto para resolução tipo ID em vez de busca no diretório.
- `messaging.targetResolver.resolveTarget(...)` é o fallback do plugin quando
  o core precisa de uma resolução final controlada pelo provider após a normalização ou após uma
  falha de busca no diretório.
- `messaging.resolveOutboundSessionRoute(...)` controla a construção de rota
  de sessão específica do provider assim que um destino é resolvido.

Divisão recomendada:

- Use `inferTargetChatType` para decisões de categoria que devem acontecer antes
  da busca em pares/grupos.
- Use `looksLikeId` para verificações do tipo "trate isto como um ID de destino explícito/nativo".
- Use `resolveTarget` para fallback de normalização específico do provider, não para
  busca ampla em diretório.
- Mantenha IDs nativos do provider, como chat ids, thread ids, JIDs, handles e room
  ids, dentro de valores `target` ou parâmetros específicos do provider, não em campos genéricos do SDK.

## Diretórios com suporte de configuração

Plugins que derivam entradas de diretório a partir da configuração devem manter essa lógica no
plugin e reutilizar os helpers compartilhados de
`openclaw/plugin-sdk/directory-runtime`.

Use isso quando um canal precisar de pares/grupos com suporte de configuração, como:

- pares de mensagem direta orientados por allowlist
- mapas configurados de canais/grupos
- fallbacks estáticos de diretório com escopo de conta

Os helpers compartilhados em `directory-runtime` lidam apenas com operações genéricas:

- filtragem de consulta
- aplicação de limite
- helpers de deduplicação/normalização
- construção de `ChannelDirectoryEntry[]`

A inspeção de conta específica de canal e a normalização de IDs devem continuar na
implementação do plugin.

## Catálogos de provider

Plugins de provider podem definir catálogos de modelo para inferência com
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` retorna o mesmo formato que o OpenClaw grava em
`models.providers`:

- `{ provider }` para uma entrada de provider
- `{ providers }` para várias entradas de provider

Use `catalog` quando o plugin controlar IDs de modelo específicos do provider, padrões de URL base
ou metadados de modelo condicionados por autenticação.

`catalog.order` controla quando o catálogo de um plugin é mesclado em relação aos
providers implícitos embutidos do OpenClaw:

- `simple`: providers simples baseados em chave de API ou env
- `profile`: providers que aparecem quando existem perfis de autenticação
- `paired`: providers que sintetizam várias entradas relacionadas de provider
- `late`: última passagem, depois dos demais providers implícitos

Providers posteriores ganham em caso de colisão de chave, então plugins podem
intencionalmente substituir uma entrada embutida de provider com o mesmo ID.

Compatibilidade:

- `discovery` ainda funciona como alias legado
- se `catalog` e `discovery` forem registrados, o OpenClaw usa `catalog`

## Inspeção de canal somente leitura

Se seu plugin registra um canal, prefira implementar
`plugin.config.inspectAccount(cfg, accountId)` junto com `resolveAccount(...)`.

Por quê:

- `resolveAccount(...)` é o caminho de runtime. Ele pode assumir que as credenciais
  estão totalmente materializadas e pode falhar rapidamente quando segredos necessários estiverem ausentes.
- Caminhos de comando somente leitura, como `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e fluxos de doctor/reparo de config,
  não devem precisar materializar credenciais de runtime apenas para
  descrever a configuração.

Comportamento recomendado de `inspectAccount(...)`:

- Retorne apenas estado descritivo da conta.
- Preserve `enabled` e `configured`.
- Inclua campos de origem/status de credencial quando relevante, como:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Você não precisa retornar valores brutos de token apenas para informar disponibilidade
  somente leitura. Retornar `tokenStatus: "available"` (e o campo correspondente de origem)
  já é suficiente para comandos no estilo status.
- Use `configured_unavailable` quando uma credencial estiver configurada via SecretRef, mas
  indisponível no caminho de comando atual.

Isso permite que comandos somente leitura informem "configured but unavailable in this command
path" em vez de falhar ou informar incorretamente que a conta não está configurada.

## Package packs

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
passa a ser `name/<fileBase>`.

Se seu plugin importar dependências npm, instale-as nesse diretório para que
`node_modules` esteja disponível (`npm install` / `pnpm install`).

Proteção de segurança: toda entrada `openclaw.extensions` deve permanecer dentro do diretório do plugin
após a resolução de symlink. Entradas que escapem do diretório do pacote são
rejeitadas.

Observação de segurança: `openclaw plugins install` instala dependências de plugin com
`npm install --omit=dev --ignore-scripts` (sem scripts de ciclo de vida, sem dependências de desenvolvimento em runtime). Mantenha as árvores de dependência do plugin em "JS/TS puro" e evite pacotes que exijam builds em `postinstall`.

Opcional: `openclaw.setupEntry` pode apontar para um módulo leve apenas de setup.
Quando o OpenClaw precisa de superfícies de setup para um plugin de canal desativado, ou
quando um plugin de canal está ativado, mas ainda não configurado, ele carrega `setupEntry`
em vez da entrada completa do plugin. Isso mantém inicialização e setup mais leves
quando a entrada principal do plugin também conecta ferramentas, hooks ou outro código
apenas de runtime.

Opcional: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
pode colocar um plugin de canal no mesmo caminho de `setupEntry` durante a fase de
inicialização antes de listen do gateway, mesmo quando o canal já estiver configurado.

Use isso apenas quando `setupEntry` cobrir completamente a superfície de inicialização que precisa existir
antes que o gateway comece a escutar. Na prática, isso significa que a entrada de setup
deve registrar toda capacidade controlada pelo canal da qual a inicialização depende, como:

- o próprio registro do canal
- quaisquer rotas HTTP que precisem estar disponíveis antes que o gateway comece a escutar
- quaisquer métodos do gateway, ferramentas ou serviços que precisem existir durante essa mesma janela

Se sua entrada completa ainda controlar qualquer capacidade necessária de inicialização, não ative
essa flag. Mantenha o plugin no comportamento padrão e deixe o OpenClaw carregar a
entrada completa durante a inicialização.

Canais incluídos também podem publicar helpers de superfície de contrato apenas de setup que o core
pode consultar antes que o runtime completo do canal seja carregado. A superfície atual
de promoção de setup é:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

O core usa essa superfície quando precisa promover uma configuração legada de canal de conta única
para `channels.<id>.accounts.*` sem carregar a entrada completa do plugin.
Matrix é o exemplo incluído atual: ele move apenas chaves de autenticação/bootstrap para uma
conta promovida nomeada quando contas nomeadas já existem, e pode preservar uma
chave de conta padrão não canônica configurada em vez de sempre criar
`accounts.default`.

Esses adaptadores de patch de setup mantêm lazy a descoberta da superfície de contrato incluída. O tempo
de importação continua leve; a superfície de promoção é carregada apenas no primeiro uso, em vez de
reentrar na inicialização do canal incluído ao importar o módulo.

Quando essas superfícies de inicialização incluem métodos RPC do gateway, mantenha-os em um
prefixo específico do plugin. Namespaces administrativos do core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) continuam reservados e sempre resolvem
para `operator.admin`, mesmo que um plugin solicite um escopo mais estreito.

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
dicas de instalação via `openclaw.install`. Isso mantém o catálogo do core sem dados embutidos.

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
- `docsLabel`: substitui o texto do link para o link da documentação
- `preferOver`: IDs de plugin/canal de menor prioridade que esta entrada de catálogo deve superar
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controles de cópia da superfície de seleção
- `markdownCapable`: marca o canal como compatível com Markdown para decisões de formatação de saída
- `exposure.configured`: oculta o canal das superfícies de listagem de canais configurados quando definido como `false`
- `exposure.setup`: oculta o canal dos seletores interativos de setup/configure quando definido como `false`
- `exposure.docs`: marca o canal como interno/privado para superfícies de navegação da documentação
- `showConfigured` / `showInSetup`: aliases legados ainda aceitos por compatibilidade; prefira `exposure`
- `quickstartAllowFrom`: coloca o canal no fluxo padrão de quickstart `allowFrom`
- `forceAccountBinding`: exige binding explícito de conta mesmo quando só existe uma conta
- `preferSessionLookupForAnnounceTarget`: prioriza a busca de sessão ao resolver destinos de anúncio

O OpenClaw também pode mesclar **catálogos externos de canal** (por exemplo, uma
exportação de registro MPM). Coloque um arquivo JSON em um destes locais:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Ou aponte `OPENCLAW_PLUGIN_CATALOG_PATHS` (ou `OPENCLAW_MPM_CATALOG_PATHS`) para
um ou mais arquivos JSON (delimitados por vírgula/ponto e vírgula/`PATH`). Cada arquivo deve
conter `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. O parser também aceita `"packages"` ou `"plugins"` como aliases legados para a chave `"entries"`.

## Plugins de mecanismo de contexto

Plugins de mecanismo de contexto controlam a orquestração do contexto da sessão para ingestão, montagem
e Compaction. Registre-os a partir do seu plugin com
`api.registerContextEngine(id, factory)` e selecione o mecanismo ativo com
`plugins.slots.contextEngine`.

Use isso quando seu plugin precisar substituir ou estender o pipeline padrão de
contexto em vez de apenas adicionar pesquisa em memória ou hooks.

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

Se o seu mecanismo **não** controlar o algoritmo de Compaction, mantenha `compact()`
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

Quando um plugin precisar de um comportamento que não se encaixa na API atual, não contorne
o sistema de plugins com um acesso privado. Adicione a capacidade ausente.

Sequência recomendada:

1. defina o contrato central
   Decida qual comportamento compartilhado o core deve controlar: política, fallback, mesclagem de configuração,
   ciclo de vida, semântica voltada para canal e formato do helper de runtime.
2. adicione superfícies tipadas de registro/runtime de plugin
   Estenda `OpenClawPluginApi` e/ou `api.runtime` com a menor
   superfície tipada de capacidade que seja útil.
3. conecte consumidores do core + canal/recurso
   Canais e plugins de recurso devem consumir a nova capacidade por meio do core,
   não importando diretamente uma implementação de fornecedor.
4. registre implementações de fornecedor
   Plugins de fornecedor então registram seus backends na capacidade.
5. adicione cobertura de contrato
   Adicione testes para que o ownership e o formato de registro permaneçam explícitos ao longo do tempo.

É assim que o OpenClaw permanece opinativo sem ficar codificado de forma fixa para a
visão de mundo de um único provider. Consulte o [Capability Cookbook](/pt-BR/plugins/architecture)
para uma checklist concreta de arquivos e um exemplo completo.

### Checklist de capacidade

Ao adicionar uma nova capacidade, a implementação normalmente deve tocar estas
superfícies em conjunto:

- tipos de contrato do core em `src/<capability>/types.ts`
- helper de runner/runtime do core em `src/<capability>/runtime.ts`
- superfície de registro da API de plugin em `src/plugins/types.ts`
- integração com o registro de plugins em `src/plugins/registry.ts`
- exposição de runtime de plugin em `src/plugins/runtime/*` quando plugins de recurso/canal
  precisarem consumi-la
- helpers de captura/teste em `src/test-utils/plugin-registration.ts`
- asserções de ownership/contrato em `src/plugins/contracts/registry.ts`
- documentação para operador/plugin em `docs/`

Se uma dessas superfícies estiver ausente, isso geralmente é um sinal de que a capacidade
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

- o core controla o contrato de capacidade + a orquestração
- plugins de fornecedor controlam implementações do fornecedor
- plugins de recurso/canal consomem helpers de runtime
- testes de contrato mantêm o ownership explícito
