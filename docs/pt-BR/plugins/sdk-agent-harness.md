---
read_when:
    - Você está alterando o runtime do agente incorporado ou o registro do harness
    - Você está registrando uma infraestrutura de agente a partir de um plugin incluído ou confiável
    - Você precisa entender como o plugin Codex se relaciona com os provedores de modelos
sidebarTitle: Agent Harness
summary: Superfície experimental do SDK para plugins que substituem o executor de agente integrado de baixo nível
title: Plugins do ambiente de execução do agente
x-i18n:
    generated_at: "2026-07-12T15:33:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: be2717d9986c30e931d3443dc6b70542ab20badb4ad0921e797fbad280513d1e
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Um **harness de agente** é o executor de baixo nível de um turno preparado de
agente do OpenClaw. Ele não é um provedor de modelos, nem um canal, nem um
registro de ferramentas. Para o modelo mental voltado ao usuário, consulte
[Runtimes de agentes](/pt-BR/concepts/agent-runtimes).

Use esta superfície somente para plugins nativos incluídos ou confiáveis. O
contrato ainda é experimental porque os tipos de parâmetros espelham
intencionalmente o executor incorporado atual.

## Quando usar um harness

Registre um harness de agente quando uma família de modelos tiver seu próprio
runtime de sessão nativo e o transporte normal de provedores do OpenClaw for a
abstração inadequada:

- um servidor nativo de agente de programação que gerencia threads e Compaction
- uma CLI ou um daemon local que precisa transmitir eventos nativos de
  plano/raciocínio/ferramentas
- um runtime de modelo que precisa de seu próprio ID de retomada além da
  transcrição da sessão do OpenClaw

**Não** registre um harness apenas para adicionar uma nova API de LLM. Para APIs
de modelo HTTP ou WebSocket normais, crie um
[plugin de provedor](/pt-BR/plugins/sdk-provider-plugins).

## O que o núcleo ainda gerencia

Antes que um harness seja selecionado, o OpenClaw já terá resolvido:

- provedor e modelo
- estado de autenticação do runtime, a menos que o harness declare que gerencia
  a inicialização da autenticação
- nível de raciocínio e orçamento de contexto
- o arquivo de transcrição/sessão do OpenClaw
- espaço de trabalho, sandbox e política de ferramentas
- callbacks de resposta do canal e callbacks de streaming
- política de fallback e troca de modelo em tempo real

Um harness executa uma tentativa preparada; ele não escolhe provedores,
substitui a entrega do canal nem troca modelos silenciosamente.

### Inicialização de autenticação gerenciada pelo harness

Por padrão, o núcleo resolve as credenciais do provedor antes de chamar um
harness. Um harness confiável que possa se autenticar por meio de seu próprio
runtime nativo pode definir `authBootstrap: "harness"` em seu registro estático
de `AgentHarness`. Nesse caso, o núcleo ignora sua inicialização genérica das
credenciais do provedor e a falha por credenciais ausentes em todas as
tentativas assumidas por esse harness.

O núcleo ainda encaminha um perfil de autenticação compatível, explicitamente
selecionado ou ordenado, do OpenClaw e seu armazenamento com escopo quando
existirem. O harness deve resolver esse perfil ou suas credenciais nativas
antes de emitir solicitações ao modelo, manter os segredos restritos à
tentativa e apresentar falhas de autenticação que indiquem ações corretivas.
Não defina esse recurso em um harness que gerencia a autenticação apenas em
alguns casos.

### Artefatos verificados do runtime de configuração

Um harness local que possa fornecer inferência para a configuração da primeira
execução deve atestar a implementação que concluiu a sondagem. Quando
`params.captureRuntimeArtifact` for true, retorne um
`result.runtimeArtifact` opaco com um ID estável e uma impressão digital do
conteúdo. Registre um recurso `runtimeArtifact.validate(...)` correspondente
que verifique novamente esse vínculo sem carregar outro harness nem examinar
plugins não relacionados.

As continuações verificadas do Crestodian também passam
`params.expectedRuntimeArtifact`. O harness deve compará-lo com o processo
nativo exato que adquiriu e falhar antes de iniciar ou retomar uma thread
nativa se forem diferentes. Turnos comuns de agentes omitem ambos os campos,
portanto o hashing de conteúdo fica fora do caminho crítico normal das
solicitações. Harnesses remotos/WebSocket precisam de um contrato de atestação
do servidor antes de poderem participar; uma string de versão, por si só, não
é uma identidade de artefato.

A tentativa preparada também inclui `params.runtimePlan`, um pacote de
políticas gerenciado pelo OpenClaw para decisões de runtime que devem
permanecer compartilhadas entre o OpenClaw e harnesses nativos:

- `runtimePlan.tools.normalize(...)` e `runtimePlan.tools.logDiagnostics(...)`
  para a política de esquema de ferramentas ciente do provedor
- `runtimePlan.transcript.resolvePolicy(...)` para a política de sanitização da
  transcrição e reparo de chamadas de ferramentas
- `runtimePlan.delivery.isSilentPayload(...)` para a supressão compartilhada de
  entrega de `NO_REPLY` e mídia
- `runtimePlan.outcome.classifyRunResult(...)` para a classificação do fallback
  de modelo
- `runtimePlan.observability` para metadados resolvidos de
  provedor/modelo/harness

Os harnesses podem usar o plano para decisões que precisem corresponder ao
comportamento do OpenClaw, mas devem tratá-lo como estado da tentativa
gerenciado pelo host: não o modifique nem o use para trocar provedores/modelos
dentro de um turno.

### Contrato de transporte de solicitações

`supports(ctx)` recebe o transporte de modelo resolvido em
`ctx.modelProvider`. Dois fatos sem segredos e gerenciados pelo provedor
descrevem a rota selecionada:

- `runtimePolicy.compatibleIds` lista os IDs de runtime que o provedor declara
  como compatíveis com essa rota específica. A ausência de uma política
  significa que o provedor não declarou compatibilidade no nível da rota; isso
  não é permissão para presumir suporte.
- `requestTransportOverrides: "none"` significa que nenhuma substituição de
  solicitação criada pelo autor para o provedor/modelo precisa ser reproduzida.
  `"present"` significa que existem cabeçalhos, transporte de autenticação,
  proxy, TLS, comportamento de serviço local ou rede privada, ou parâmetros de
  solicitação definidos pelo autor. O fato não expõe esses valores.

Retorne `{ supported: false, reason }` quando o harness não puder reproduzir o
transporte preparado. Não deduza o suporte lendo a configuração bruta após a
seleção. Quando a preparação da autenticação produzir várias rotas de nova
tentativa, um único harness deverá oferecer suporte a todas elas antes do
despacho. A seleção implícita usa o OpenClaw se nenhum plugin puder gerenciar o
conjunto completo; uma seleção de plugin explícita ou persistida falha de
maneira fechada.

## Registrar um harness

**Importação:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Meu harness de agente nativo",

  supports(ctx) {
    const routeSupportsHarness =
      ctx.modelProvider?.runtimePolicy?.compatibleIds.includes("my-harness") === true;
    const canReproduceRequest = ctx.modelProvider?.requestTransportOverrides !== "present";
    return ctx.provider === "my-provider" && routeSupportsHarness && canReproduceRequest
      ? { supported: true, priority: 100 }
      : { supported: false, reason: "a rota efetiva não é compatível com o harness" };
  },

  async runAttempt(params) {
    // Inicie ou retome sua thread nativa.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent e os outros campos preparados da tentativa.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Meu agente nativo",
  description: "Executa modelos selecionados por meio de um daemon de agente nativo.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

`authBootstrap` está intencionalmente ausente deste exemplo genérico. Adicione
`authBootstrap: "harness"` somente quando o harness atender ao contrato acima.

### Execução delegada

O proprietário de um harness pode definir `delegatedExecutionPluginIds` como os ids de plugins
confiáveis que precisam executar uma sessão existente com modelo bloqueado, como um transporte
de voz que continua uma conversa apoiada pelo Codex. Isso é um consentimento estático do proprietário,
não uma lista de permissões do núcleo. Mantenha o escopo restrito.

Os delegados recebem apenas admissão de trabalho e execução incorporada. O OpenClaw exige
a chave de sessão armazenada, o caminho do armazenamento e o id da sessão exatos; `modelSelectionLocked:
true`; e valores correspondentes de `agentHarnessId` e `agentHarnessRuntimeOverride`.
A execução é então delimitada pelo proprietário do harness. Criação, aplicação de patches,
redefinição, exclusão e arquivamento de sessões, bem como mutações no Gateway, continuam restritos ao proprietário.

## Política de seleção

O OpenClaw escolhe um harness após a resolução de provedor/modelo:

1. A política de runtime no escopo do modelo tem precedência.
2. A política de runtime no escopo do provedor vem em seguida.
3. `auto` consulta os harnesses registrados para saber se eles oferecem suporte à rota
   efetiva resolvida. Prefixos de provedor/modelo, por si só, nunca selecionam um harness.
4. Se nenhum harness registrado corresponder, o OpenClaw usará seu runtime incorporado.

Falhas de harnesses de plugins são apresentadas como falhas de execução. No modo `auto`, o fallback
incorporado só se aplica quando nenhum harness de plugin registrado oferece suporte ao
provedor/modelo resolvido. Depois que um harness de plugin reivindica uma execução, o OpenClaw não
repete a mesma interação em outro runtime, pois isso pode alterar
a semântica de autenticação/runtime ou duplicar efeitos colaterais.

A política de runtime configurada continua sendo a autoridade quanto ao runtime desejado. Um
`agentHarnessId` de sessão persistido mantém a propriedade de sua transcrição nativa
enquanto a preparação de rota/autenticação ainda está pendente. Nenhum dos dois torna compatível uma
rota incompatível: assim que os fatos preparados existirem, o harness selecionado ou fixado
deverá oferecer suporte a eles, ou a execução falhará de forma fechada. `/status` mostra o runtime efetivo
selecionado com base na política, na propriedade persistida e no suporte à rota.
O status preparado é explícito: a ausência de `runtimePolicy` permanece não declarada, em vez
de ser inferida a partir de quaisquer campos de transporte que estejam presentes.
Quando a autenticação de propriedade do harness deixa várias rotas físicas sem resolução, o
fato de suporte preparado é a interseção dos ids de runtime compatíveis delas e
informa substituições de solicitação se algum candidato as tiver. Portanto, um candidato não declarado
torna vazia a compatibilidade nativa; `preparedAuth.source: "harness"`
indica um proprietário da autenticação, não permissão para inferir suporte à rota.

Se o harness selecionado for inesperado, habilite o registro de depuração `agents/harness`
e inspecione o registro estruturado `agent harness selected` do gateway: ele
inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback
e, no modo `auto`, o resultado de suporte de cada candidato de plugin.

O plugin Codex incluído registra `codex` como seu id de harness. O núcleo trata esse
valor como um id comum de harness de plugin; aliases específicos do Codex devem ficar no plugin
ou na configuração do operador, não no seletor de runtime compartilhado.

## Pareamento de provedor e harness

A maioria dos harnesses também deve registrar um provedor. O provedor torna as referências de modelo,
o status de autenticação, os metadados do modelo e a seleção de `/model` visíveis para o restante do
OpenClaw. O harness então reivindica esse provedor em `supports(...)`.

O plugin Codex incluído segue este padrão:

- referências de modelo preferenciais para o usuário: `openai/gpt-5.6-sol`
- referências de compatibilidade: referências legadas `codex/gpt-*` continuam aceitas, mas novas
  configurações não devem usá-las como referências normais de provedor/modelo
- id do harness: `codex`
- autenticação: disponibilidade sintética do provedor, pois o harness Codex é responsável pelo
  login/sessão nativos do Codex
- solicitação ao servidor do aplicativo: o OpenClaw envia somente o id do modelo ao Codex e permite que o
  harness se comunique com o protocolo nativo do servidor do aplicativo

O plugin Codex é aditivo. Com a política de runtime não definida ou como `auto`, a OpenAI pode
selecionar o Codex somente quando o contrato de rota pertencente ao provedor declarar compatibilidade com
`codex`: uma rota oficial exata de HTTPS para Platform Responses ou ChatGPT Responses,
sem substituição de solicitação criada pelo autor. O prefixo `openai/*`, por si só, nunca
seleciona o Codex. Endpoints personalizados, adaptadores de Completions e comportamentos de solicitação
criados pelo autor permanecem no OpenClaw. Endpoints HTTP oficiais sem criptografia são rejeitados. Referências `codex/gpt-*`
mais antigas continuam sendo entradas de compatibilidade. Consulte
[runtime implícito de agente da OpenAI](/pt-BR/providers/openai#implicit-agent-runtime).

Para configuração pelo operador, exemplos de prefixos de modelo e configurações exclusivas do Codex, consulte
[Harness do Codex](/pt-BR/plugins/codex-harness).

O plugin Codex exige a versão mínima do servidor do aplicativo documentada em
[Harness do Codex](/pt-BR/plugins/codex-harness). Ele verifica o handshake de inicialização e
bloqueia servidores mais antigos ou sem versão, de modo que o OpenClaw seja executado somente na superfície
do protocolo que foi testada.

### Middleware de resultados de ferramentas

Plugins incluídos e plugins instalados explicitamente habilitados com contratos
de manifesto correspondentes podem anexar middleware de resultados de ferramentas independente de runtime por meio de
`api.registerAgentToolResultMiddleware(...)` quando seu manifesto declarar os
ids de runtime de destino em `contracts.agentToolResultMiddleware`. Esse ponto de integração confiável
destina-se a transformações assíncronas de resultados de ferramentas que precisam ser executadas antes que o OpenClaw ou
o Codex forneçam novamente a saída da ferramenta ao modelo.

Plugins incluídos legados ainda podem usar
`api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo
do servidor do aplicativo Codex, mas novas transformações de resultados devem usar a API independente de runtime. O
hook `api.registerEmbeddedExtensionFactory(...)`, exclusivo do executor incorporado, foi
removido; transformações incorporadas de resultados de ferramentas devem usar middleware independente de runtime.

### Classificação do resultado do terminal

Harnesses nativos que controlam sua própria projeção de protocolo podem usar
`classifyAgentHarnessTerminalOutcome(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` quando um turno concluído não
produzir texto visível do assistente. O helper retorna `empty`, `reasoning-only`
ou `planning-only` para que a política de fallback do OpenClaw possa decidir se
deve tentar novamente com um modelo diferente. `planning-only` exige o campo
`planText` explícito do harness; o OpenClaw não o infere a partir da prosa do
assistente. O helper deixa intencionalmente sem classificação erros de prompt,
turnos em andamento e respostas intencionalmente silenciosas, como `NO_REPLY`.

### Efeitos colaterais ao final do agente

Harnesses nativos devem chamar `runAgentEndSideEffects(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` depois de finalizarem uma tentativa.
Ele despacha o hook portátil `agent_end` e a captura de pesquisa do OpenClaw sem
atrasar respostas interativas. Use `awaitAgentEndSideEffects(...)` para
execuções locais e não interativas nas quais a tentativa não deve ser resolvida
até que esses efeitos colaterais terminem. Ambos os helpers aceitam o mesmo
payload `{ event, ctx }` que `runAgentHarnessAgentEndHook(...)`; suas falhas não
alteram o resultado da tentativa concluída.

### Entrada do usuário e superfícies de ferramentas

Harnesses nativos que expõem uma solicitação de entrada do usuário no nível do
runtime devem usar os helpers de entrada do usuário de
`openclaw/plugin-sdk/agent-harness-runtime` para formatar o prompt, entregá-lo
pelo caminho de resposta bloqueante do OpenClaw e normalizar respostas de
escolha ou em formato livre de volta para o formato de resposta nativo do
runtime. O helper mantém a apresentação no canal/TUI consistente, enquanto
cada harness mantém sua própria análise de protocolo e seu ciclo de vida de
solicitações pendentes.

Harnesses nativos que precisam de roteamento compacto de ferramentas semelhante
ao PI devem usar `createAgentHarnessToolSurfaceRuntime(...)` de
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Ele controla a seleção de
controle de pesquisa de ferramentas/modo de código, padrões enxutos para
modelos locais, filtragem de esquemas compatível com o runtime, execução de
catálogo oculto, hidratação de diretórios e limpeza de catálogo. Os harnesses
continuam controlando sua conversão de ferramentas específica do SDK e o
callback de execução nativo.

### Modo de harness nativo do Codex

O harness `codex` incluído é o modo nativo do Codex para turnos de agente
incorporados do OpenClaw. Primeiro, habilite o plugin `codex` incluído e
adicione `codex` a `plugins.allow` se sua configuração usar uma lista de
permissões restritiva. Configurações nativas do app-server devem usar
`openai/gpt-*`; turnos de agente da OpenAI selecionam o harness do Codex somente
quando a rota efetiva declara compatibilidade com o Codex. Referências legadas
de modelos do Codex devem ser reparadas com `openclaw doctor --fix`, e
referências legadas de modelos `codex/*` permanecem como aliases de
compatibilidade para o harness nativo.

Quando esse modo é executado, o Codex controla o ID nativo da thread, o
comportamento de retomada, a Compaction e a execução do app-server. O OpenClaw
continua controlando o canal de chat, o espelho visível da transcrição, a
política de ferramentas, as aprovações, a entrega de mídia e a seleção de
sessão. Use `agentRuntime.id: "codex"` no provedor/modelo quando precisar
comprovar que somente o caminho do app-server do Codex pode assumir a execução.
Runtimes de plugins explícitos falham de forma fechada; falhas de seleção do
app-server do Codex e falhas de runtime não são repetidas por meio de outro
runtime.

## Rigor do runtime

Por padrão, o OpenClaw usa a política de runtime `auto` para provedor/modelo:
harnesses de plugins registrados podem assumir rotas efetivas compatíveis, e o
runtime incorporado processa o turno quando nenhum corresponde. Um prefixo de
provedor/modelo por si só nunca seleciona um harness. Use um runtime de plugin
explícito de provedor/modelo, como `agentRuntime.id: "codex"`, quando a ausência
da seleção de harness deva causar falha em vez de rotear pelo runtime
incorporado. A seleção explícita não torna compatível uma rota incompatível.
Falhas de harnesses de plugins selecionados sempre causam uma falha definitiva.
Isso não bloqueia um `agentRuntime.id: "openclaw"` explícito no provedor/modelo.

Para execuções incorporadas exclusivas do Codex:

```json
{
  "models": {
    "providers": {
      "openai": {
        "agentRuntime": {
          "id": "codex"
        }
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.6-sol"
    }
  }
}
```

Se quiser um backend de CLI para um único modelo canônico, coloque o runtime na
entrada desse modelo:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-8",
      "models": {
        "anthropic/claude-opus-4-8": {
          "agentRuntime": {
            "id": "claude-cli"
          }
        }
      }
    }
  }
}
```

Substituições por agente usam o mesmo formato com escopo de modelo:

```json
{
  "agents": {
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.6-sol",
        "models": {
          "openai/gpt-5.6-sol": {
            "agentRuntime": { "id": "codex" }
          }
        }
      }
    ]
  }
}
```

Exemplos legados de runtime para o agente inteiro, como este, são ignorados:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Com um runtime de plugin explícito, uma sessão falha antecipadamente quando o
harness solicitado não está registrado, não oferece suporte ao provedor/modelo
resolvido ou falha antes de produzir efeitos colaterais do turno. Isso é
intencional para implantações exclusivas do Codex e para testes ao vivo que
precisam comprovar que o caminho do app-server do Codex está realmente em uso.

Essa configuração controla apenas o harness de agente incorporado. Ela não
desabilita o roteamento de modelos específicos do provedor para imagem, vídeo,
música, TTS, PDF ou outros tipos.

## Sessões nativas e espelho da transcrição

Um harness pode manter um ID de sessão nativo, ID de thread ou token de retomada
no lado do daemon. Mantenha essa vinculação explicitamente associada à sessão
do OpenClaw e continue espelhando a saída do assistente e das ferramentas
visível ao usuário na transcrição do OpenClaw.

A transcrição do OpenClaw continua sendo a camada de compatibilidade para:

- histórico da sessão visível no canal
- pesquisa e indexação da transcrição
- retorno ao harness integrado do OpenClaw em um turno posterior
- comportamento genérico de `/new`, `/reset` e exclusão de sessão

Se seu harness armazenar uma vinculação auxiliar, implemente `reset(...)` para
que o OpenClaw possa apagá-la quando a sessão correspondente do OpenClaw for
redefinida.

## Resultados de ferramentas e mídia

O núcleo cria a lista de ferramentas do OpenClaw e a repassa à tentativa
preparada. Quando um harness executar uma chamada dinâmica de ferramenta,
retorne o resultado da ferramenta pelo formato de resultado do harness, em vez
de enviar você mesmo a mídia ao canal.

Isso mantém as saídas de texto, imagem, vídeo, música, TTS, aprovação e
ferramentas de mensagens no mesmo caminho de entrega das execuções processadas
pelo OpenClaw.

## Limitações atuais

- O caminho público de importação é genérico, mas alguns aliases de tipos de
  tentativa/resultado ainda mantêm nomes legados por compatibilidade.
- A instalação de harnesses de terceiros é experimental. Prefira plugins de
  provedores até precisar de um runtime de sessão nativo.
- A troca de harness é compatível entre turnos. Não troque de harness no meio
  de um turno depois que ferramentas nativas, aprovações, texto do assistente
  ou envios de mensagens tiverem começado.

## Relacionados

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview)
- [Helpers de runtime](/pt-BR/plugins/sdk-runtime)
- [Plugins de provedores](/pt-BR/plugins/sdk-provider-plugins)
- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Provedores de modelos](/pt-BR/concepts/model-providers)
