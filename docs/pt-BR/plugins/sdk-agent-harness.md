---
read_when:
    - Você está alterando o runtime do agente incorporado ou o registro do harness
    - Você está registrando uma estrutura de agente a partir de um plugin integrado ou confiável
    - É necessário entender como o plugin Codex se relaciona com os provedores de modelos
sidebarTitle: Agent Harness
summary: Superfície experimental do SDK para plugins que substituem o executor de agente incorporado de baixo nível
title: Plugins de harness de agentes
x-i18n:
    generated_at: "2026-07-16T12:49:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 862d53022e48b93c98e98162f76460433b76005cba3188342d0977b951044106
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Um **harness de agente** é o executor de baixo nível de um turno preparado de
agente do OpenClaw. Não é um provedor de modelo, nem um canal, nem um registro
de ferramentas. Para o modelo mental voltado ao usuário, consulte
[Runtimes de agente](/pt-BR/concepts/agent-runtimes).

Use esta superfície somente para plugins nativos integrados ou confiáveis. O
contrato ainda é experimental porque os tipos de parâmetros refletem
intencionalmente o executor embarcado atual.

## Quando usar um harness

Registre um harness de agente quando uma família de modelos tiver seu próprio
runtime de sessão nativo e o transporte normal de provedores do OpenClaw for a
abstração errada:

- um servidor nativo de agente de programação que gerencia threads e Compaction
- uma CLI ou um daemon local que precisa transmitir eventos nativos de plano/raciocínio/ferramenta
- um runtime de modelo que precisa de seu próprio ID de retomada além da
  transcrição da sessão do OpenClaw

**Não** registre um harness apenas para adicionar uma nova API de LLM. Para APIs
de modelo HTTP ou WebSocket normais, crie um
[plugin de provedor](/pt-BR/plugins/sdk-provider-plugins).

## O que o núcleo ainda gerencia

Antes de um harness ser selecionado, o OpenClaw já resolveu:

- provedor e modelo
- estado de autenticação do runtime, a menos que o harness declare que gerencia a inicialização da autenticação
- nível de raciocínio e orçamento de contexto
- arquivo de transcrição/sessão do OpenClaw
- espaço de trabalho, sandbox e política de ferramentas
- callbacks de resposta do canal e callbacks de streaming
- política de fallback de modelo e troca de modelo em tempo real

Um harness executa uma tentativa preparada; ele não escolhe provedores,
substitui a entrega do canal nem troca modelos silenciosamente.

### Inicialização de autenticação gerenciada pelo harness

Por padrão, o núcleo resolve as credenciais do provedor antes de chamar um
harness. Um harness confiável que possa autenticar por meio de seu próprio
runtime nativo pode definir `authBootstrap: "harness"` em seu registro estático
`AgentHarness`. Nesse caso, o núcleo ignora a inicialização genérica das
credenciais do provedor e a falha por credenciais ausentes em todas as
tentativas assumidas por esse harness.

O núcleo ainda encaminha um perfil de autenticação do OpenClaw compatível,
explicitamente selecionado ou ordenado, e seu armazenamento com escopo quando
houver um. O harness deve resolver esse perfil ou suas credenciais nativas
antes de emitir solicitações de modelo, manter os segredos restritos à
tentativa e apresentar falhas de autenticação que indiquem como agir. Não
defina esse recurso em um harness que gerencia a autenticação apenas algumas
vezes.

### Artefatos verificados do runtime de configuração

Um harness local capaz de fornecer inferência para a configuração da primeira
execução deve atestar a implementação que concluiu a sondagem. Quando
`params.captureRuntimeArtifact` for verdadeiro, retorne um
`result.runtimeArtifact` opaco com um ID estável e uma impressão digital do conteúdo.
Registre um recurso `runtimeArtifact.validate(...)` correspondente que verifique novamente
essa associação sem carregar outro harness nem examinar plugins não
relacionados.

As continuações verificadas do OpenClaw também passam
`params.expectedRuntimeArtifact`. O harness deve compará-lo com o processo nativo exato que
adquiriu e falhar antes de iniciar ou retomar uma thread nativa se forem
diferentes. Turnos comuns de agente omitem ambos os campos, portanto o cálculo
de hash do conteúdo permanece fora do caminho crítico normal da solicitação.
Harnesses remotos/WebSocket precisam de um contrato de atestação do servidor
antes de poderem participar; uma string de versão, por si só, não é uma
identidade de artefato.

A tentativa preparada também inclui `params.runtimePlan`, um pacote de políticas
gerenciado pelo OpenClaw para decisões de runtime que devem permanecer
compartilhadas entre o OpenClaw e os harnesses nativos:

- `runtimePlan.tools.normalize(...)` e `runtimePlan.tools.logDiagnostics(...)`
  para a política de esquema de ferramentas com reconhecimento de provedor
- `runtimePlan.transcript.resolvePolicy(...)` para a sanitização da transcrição e
  a política de reparo de chamadas de ferramentas
- `runtimePlan.delivery.isSilentPayload(...)` para `NO_REPLY` compartilhado e
  supressão da entrega de mídia
- `runtimePlan.outcome.classifyRunResult(...)` para a classificação do fallback
  de modelo
- `runtimePlan.observability` para metadados resolvidos de provedor/modelo/harness

Os harnesses podem usar o plano para decisões que precisem corresponder ao
comportamento do OpenClaw, mas devem tratá-lo como estado da tentativa
gerenciado pelo host: não o modifique nem o use para trocar provedores/modelos
dentro de um turno.

### Contrato de transporte de solicitações

`supports(ctx)` recebe o transporte de modelo resolvido em
`ctx.modelProvider`. Dois fatos sem segredos e gerenciados pelo provedor
descrevem a rota selecionada:

- `runtimePolicy.compatibleIds` lista os IDs de runtime que o provedor declara
  compatíveis com essa rota concreta. A ausência de uma política significa que
  o provedor não declarou compatibilidade no nível da rota; não é permissão
  para presumir suporte.
- `requestTransportOverrides: "none"` significa que nenhuma substituição de
  solicitação de provedor/modelo definida pelo autor precisa ser reproduzida.
  `"present"` significa que existem cabeçalhos definidos pelo autor,
  transporte de autenticação, proxy, TLS, comportamento de serviço local ou
  rede privada, ou parâmetros de solicitação. O fato não expõe esses valores.

Retorne `{ supported: false, reason }` quando o harness não puder reproduzir o transporte
preparado. Não infira suporte lendo a configuração bruta após a seleção.
Quando a preparação da autenticação produzir várias rotas de repetição, um
único harness deverá oferecer suporte a todas elas antes do despacho. A
seleção implícita usa o OpenClaw se nenhum plugin puder gerenciar o conjunto
completo; uma seleção explícita ou persistida de plugin falha de modo fechado.

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
    // params.onAgentEvent e os outros campos da tentativa preparada.
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

`authBootstrap` está intencionalmente ausente deste exemplo genérico.
Adicione `authBootstrap: "harness"` somente quando o harness atender ao contrato acima.

### Execução delegada

O proprietário de um harness pode definir `delegatedExecutionPluginIds` como os IDs de
plugins confiáveis que precisem executar uma sessão existente vinculada a um
modelo, como um transporte de voz que dá continuidade a uma conversa apoiada
pelo Codex. Esse é o consentimento estático do proprietário, não uma lista de
permissões do núcleo. Mantenha-o restrito.

Os delegados recebem apenas admissão de trabalho e execução embarcada. O
OpenClaw exige a chave de sessão armazenada exata, o caminho do armazenamento e
o ID da sessão; `modelSelectionLocked:
true`; e valores correspondentes de
`agentHarnessId` e `agentHarnessRuntimeOverride`. A execução passa então a ter seu
escopo definido pelo proprietário do harness. A criação, modificação,
redefinição, exclusão e arquivamento de sessões, além de alterações no Gateway,
permanecem exclusivas do proprietário.

## Política de seleção

O OpenClaw escolhe um harness após a resolução de provedor/modelo:

1. A política de runtime com escopo de modelo tem prioridade.
2. A política de runtime com escopo de provedor vem em seguida.
3. `auto` pergunta aos harnesses registrados se eles oferecem suporte à rota efetiva
   resolvida. Prefixos de provedor/modelo, por si só, nunca selecionam um harness.
4. Se nenhum harness registrado corresponder, o OpenClaw usará seu runtime embarcado.

As falhas dos harnesses de plugins são apresentadas como falhas de execução. No
modo `auto`, o fallback embarcado se aplica somente quando nenhum
harness de plugin registrado oferece suporte ao provedor/modelo resolvido.
Depois que um harness de plugin assume uma execução, o OpenClaw não repete esse
mesmo turno em outro runtime, pois isso pode alterar a semântica de
autenticação/runtime ou duplicar efeitos colaterais.

A política de runtime configurada continua sendo a autoridade sobre o runtime
desejado. Um `agentHarnessId` de sessão persistido mantém a propriedade de
sua transcrição nativa enquanto a preparação da rota/autenticação ainda está
pendente. Nenhum dos dois torna compatível uma rota incompatível: quando os
fatos preparados estiverem disponíveis, o harness selecionado ou fixado deverá
oferecer suporte a eles, ou a execução falhará de modo fechado.
`/status` mostra o runtime efetivo selecionado com base na política,
na propriedade persistida e no suporte à rota. O status preparado é explícito:
a ausência de `runtimePolicy` continua não declarada, em vez de ser inferida
a partir de quaisquer campos de transporte que estejam presentes.
Quando a autenticação gerenciada pelo harness deixa várias rotas físicas sem
resolução, o fato de suporte preparado é a interseção de seus IDs de runtime
compatíveis e informa substituições de solicitação se algum candidato as
tiver. Portanto, um único candidato não declarado torna a compatibilidade
nativa vazia; `preparedAuth.source: "harness"` é um proprietário da autenticação, não uma
permissão para inferir suporte à rota.

Se o harness selecionado for inesperado, ative o registro de depuração
`agents/harness` e inspecione o registro estruturado
`agent harness selected` do Gateway: ele inclui o ID do harness selecionado, o motivo
da seleção, a política de runtime/fallback e, no modo
`auto`, o resultado do suporte de cada plugin candidato.

O plugin integrado do Codex registra `codex` como seu ID de harness.
O núcleo o trata como um ID comum de harness de plugin; aliases específicos do
Codex pertencem ao plugin ou à configuração do operador, não ao seletor de
runtime compartilhado.

## Pareamento de provedor e harness

A maioria dos harnesses também deve registrar um provedor. O provedor torna as
referências de modelo, o status de autenticação, os metadados do modelo e a
seleção de `/model` visíveis para o restante do OpenClaw. Em seguida,
o harness assume esse provedor em `supports(...)`.

O plugin integrado do Codex segue este padrão:

- referências de modelo preferenciais do usuário: `openai/gpt-5.6-sol`
- referências de compatibilidade: referências legadas `codex/gpt-*` continuam sendo aceitas, mas novas
  configurações não devem usá-las como referências normais de provedor/modelo
- ID do harness: `codex`
- autenticação: disponibilidade sintética do provedor, porque o harness do Codex gerencia o
  login e a sessão nativos do Codex
- solicitação ao servidor do aplicativo: o OpenClaw envia o ID simples do modelo ao Codex e permite que o
  harness se comunique com o protocolo nativo do servidor do aplicativo

O plugin do Codex é aditivo. Com a política de runtime não definida ou
`auto`, a OpenAI pode selecionar o Codex somente quando seu contrato
de rota gerenciado pelo provedor declarar `codex` como compatível:
uma rota oficial exata HTTPS de Platform Responses ou ChatGPT Responses sem
substituição de solicitação definida pelo autor. O prefixo
`openai/*`, por si só, nunca seleciona o Codex. Endpoints
personalizados, adaptadores de Completions e comportamentos de solicitação
definidos pelo autor permanecem no OpenClaw. Endpoints HTTP oficiais em texto
simples são rejeitados. Referências `codex/gpt-*` mais antigas continuam
sendo entradas de compatibilidade. Consulte
[Runtime de agente implícito da OpenAI](/pt-BR/providers/openai#implicit-agent-runtime).

Para configuração pelo operador, exemplos de prefixo de modelo e configurações
exclusivas do Codex, consulte [Harness do Codex](/pt-BR/plugins/codex-harness).

O plugin do Codex impõe a versão mínima do servidor do aplicativo documentada
em [Harness do Codex](/pt-BR/plugins/codex-harness). Ele verifica o handshake de
inicialização e bloqueia servidores antigos ou sem versão, para que o OpenClaw
seja executado somente com a superfície de protocolo que testou.

### Middleware de resultados de ferramentas

Plugins integrados e plugins instalados explicitamente habilitados com
contratos de manifesto correspondentes podem anexar middleware de resultados
de ferramentas independente de runtime por meio de `api.registerAgentToolResultMiddleware(...)` quando
seu manifesto declara os IDs de runtime de destino em
`contracts.agentToolResultMiddleware`. Essa interface confiável destina-se a transformações
assíncronas de resultados de ferramentas que precisam ser executadas antes que
o OpenClaw ou o Codex forneça a saída da ferramenta de volta ao modelo.

Plugins legados incluídos ainda podem usar
`api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo do app-server do Codex,
mas novas transformações de resultados devem usar a API independente de runtime. O
hook `api.registerEmbeddedExtensionFactory(...)`, exclusivo do executor incorporado, foi
removido; transformações incorporadas de resultados de ferramentas devem usar middleware independente de runtime.

### Classificação do resultado terminal

Harnesses nativos que controlam sua própria projeção de protocolo podem usar
`classifyAgentHarnessTerminalOutcome(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` quando um turno concluído não produziu
texto visível do assistente. O auxiliar retorna `empty`, `reasoning-only` ou
`planning-only` para que a política de fallback do OpenClaw possa decidir se deve tentar novamente com um
modelo diferente. `planning-only` exige o campo explícito `planText`
do harness; o OpenClaw não o infere da prosa do assistente. O auxiliar
intencionalmente deixa sem classificação erros de prompt, turnos em andamento e
respostas silenciosas intencionais, como `NO_REPLY`.

### Efeitos colaterais ao fim do agente

Harnesses nativos devem chamar `runAgentEndSideEffects(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` após finalizarem uma tentativa. Ele
dispara o hook portátil `agent_end` e a captura de pesquisa do OpenClaw
sem atrasar respostas interativas. Use `awaitAgentEndSideEffects(...)` para
execuções locais não interativas nas quais a tentativa não deve ser resolvida até que esses
efeitos colaterais terminem. Ambos os auxiliares aceitam o mesmo payload `{ event, ctx }` que
`runAgentHarnessAgentEndHook(...)`; suas falhas não alteram o resultado da
tentativa concluída.

### Superfícies de entrada do usuário e ferramentas

Harnesses nativos que expõem uma solicitação de entrada do usuário no nível do runtime devem usar os
auxiliares de entrada do usuário de `openclaw/plugin-sdk/agent-harness-runtime` para formatar
o prompt, entregá-lo pelo caminho de resposta bloqueante do OpenClaw e normalizar
respostas de escolha ou formato livre de volta ao formato de resposta nativo do runtime. O
auxiliar mantém consistente a apresentação no canal/TUI, enquanto cada harness mantém sua
própria análise de protocolo e seu ciclo de vida de solicitações pendentes.

Harnesses nativos que precisam de roteamento compacto de ferramentas semelhante ao PI devem usar
`createAgentHarnessToolSurfaceRuntime(...)` de
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Ele controla
a seleção de controles de busca de ferramentas/modo de código, padrões enxutos para modelos locais,
filtragem de esquema compatível com o runtime, execução de catálogo oculto, hidratação de
diretórios e limpeza de catálogo. Os harnesses ainda controlam sua conversão de ferramentas
específica do SDK e o callback de execução nativa.

### Modo de harness nativo do Codex

O harness incluído `codex` é o modo nativo do Codex para turnos incorporados do agente
OpenClaw. Primeiro, habilite o Plugin incluído `codex` e inclua `codex` em
`plugins.allow` se a configuração usar uma lista de permissões restritiva. Configurações nativas do app-server
devem usar `openai/gpt-*`; turnos de agente da OpenAI selecionam o harness do Codex
somente quando a rota efetiva declara compatibilidade com o Codex. Referências legadas de modelos do Codex
devem ser corrigidas com `openclaw doctor --fix`, e referências legadas de modelos `codex/*`
permanecem como aliases de compatibilidade para o harness nativo.

Quando esse modo é executado, o Codex controla o ID nativo da thread, o comportamento de retomada,
a Compaction e a execução do app-server. O OpenClaw ainda controla o canal de chat,
o espelho visível da transcrição, a política de ferramentas, as aprovações, a entrega de mídia e a seleção
de sessão. Use o provedor/modelo `agentRuntime.id: "codex"` quando for necessário
comprovar que somente o caminho do app-server do Codex pode assumir a execução. Runtimes explícitos de
Plugin falham de forma fechada; falhas na seleção do app-server do Codex e falhas de runtime
não são tentadas novamente por meio de outro runtime.

## Rigor do runtime

Por padrão, o OpenClaw usa a política de runtime de provedor/modelo `auto`: harnesses de
Plugin registrados podem assumir rotas efetivas compatíveis, e o runtime
incorporado processa o turno quando nenhum corresponde. Um prefixo de provedor/modelo, por si só, nunca
seleciona um harness. Use um runtime explícito de Plugin de provedor/modelo, como
`agentRuntime.id: "codex"`, quando a ausência da seleção de harness deve causar falha em vez
de rotear pelo runtime incorporado. A seleção explícita não torna compatível uma
rota incompatível. Falhas do harness de Plugin selecionado sempre causam
falha definitiva. Isso não bloqueia um
`agentRuntime.id: "openclaw"` explícito de provedor/modelo.

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

Se desejar um backend de CLI para um modelo canônico, coloque o runtime nessa
entrada de modelo:

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

Com um runtime explícito de Plugin, uma sessão falha antecipadamente quando o
harness solicitado não está registrado, não oferece suporte ao provedor/modelo resolvido ou
falha antes de produzir efeitos colaterais do turno. Isso é intencional para implantações
exclusivas do Codex e para testes ao vivo que devem comprovar que o caminho do app-server do Codex
está realmente em uso.

Essa configuração controla apenas o harness incorporado do agente. Ela não desabilita
o roteamento de modelos específico do provedor para imagens, vídeos, músicas, TTS, PDF ou outros recursos.

## Sessões nativas e espelho da transcrição

Um harness pode manter um ID de sessão nativo, ID de thread ou token de retomada
do lado do daemon. Mantenha essa associação explicitamente vinculada à sessão do OpenClaw e
continue espelhando a saída do assistente/das ferramentas visível ao usuário na
transcrição do OpenClaw.

A transcrição do OpenClaw continua sendo a camada de compatibilidade para:

- histórico de sessão visível no canal
- busca e indexação de transcrições
- retorno ao harness integrado do OpenClaw em um turno posterior
- comportamento genérico de `/new`, `/reset` e exclusão de sessão

Se o harness armazenar uma associação auxiliar, implemente `reset(...)` para que o OpenClaw
possa removê-la quando a sessão proprietária do OpenClaw for redefinida.

## Resultados de ferramentas e mídia

O núcleo cria a lista de ferramentas do OpenClaw e a transmite para a tentativa
preparada. Quando um harness executa uma chamada dinâmica de ferramenta, retorne o resultado da ferramenta
pelo formato de resultado do harness, em vez de enviar a mídia do canal
diretamente.

Isso mantém as saídas de texto, imagem, vídeo, música, TTS, aprovação e ferramentas de mensagens
no mesmo caminho de entrega das execuções apoiadas pelo OpenClaw.

### Resultados terminais de ferramentas

`AgentHarnessAttemptParams.observeToolTerminal` é o acumulador de resultados terminais
controlado pelo host. Um harness que executa ferramentas dinâmicas do OpenClaw ou ferramentas nativas
deve chamá-lo quando cada ferramenta atingir um resultado terminal, antes que o
resultado da tentativa seja finalizado. Harnesses que não executam ferramentas não precisam
chamá-lo.

Relate os fatos a partir do limite de execução:

- Passe o ID da chamada do protocolo quando houver um, o nome canônico da ferramenta e os
  argumentos que realmente chegaram à ferramenta após a preparação ou reescritas por hooks.
- Defina `executionStarted: false` quando a validação, a aprovação ou outra proteção
  interromper a chamada antes que a implementação da ferramenta seja iniciada. Quando o despacho
  puder ter ocorrido, relate `true` de forma conservadora.
- Relate `outcome: "success"` ou `outcome: "failure"`. Inclua os campos estruturados
  de falha disponíveis no runtime, em vez de inferir a falha pelo
  texto exibido.
- Use `nativeMutation` somente para ferramentas nativas que não usam uma definição de ferramenta
  do OpenClaw. Forneça nesse campo os fatos de mutação e repetição controlados pelo protocolo; não
  copie o classificador de mutações do OpenClaw para o harness.

O callback retorna a resolução canônica dessa chamada. Transfira seu
`lastToolError` para `AgentHarnessAttemptResult` e use seus fatos de execução,
argumentos e efeitos colaterais na projeção do harness, em vez de derivar um
estado paralelo. O host mantém uma falha de mutação não resolvida durante ferramentas
bem-sucedidas não relacionadas e a remove somente depois que a ação correspondente é concluída com sucesso.

O callback permanece opcional para manter a compatibilidade do código-fonte com harnesses experimentais
mais antigos. Opcional não significa dispensável para um harness que executa ferramentas:
sem relatórios terminais, o OpenClaw não consegue preservar a veracidade da falha de ferramentas de mutação
entre chamadas posteriores de ferramentas, inclusive na conclusão silenciosa do Heartbeat.

## Limitações atuais

- O caminho público de importação é genérico, mas alguns aliases de tipos de tentativa/resultado
  ainda mantêm nomes legados para compatibilidade.
- A instalação de harnesses de terceiros é experimental. Prefira Plugins de provedor
  até precisar de um runtime de sessão nativo.
- A troca de harness é compatível entre turnos. Não troque de harness no
  meio de um turno depois que ferramentas nativas, aprovações, texto do assistente ou envios de
  mensagens tiverem sido iniciados.

## Relacionados

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview)
- [Auxiliares de runtime](/pt-BR/plugins/sdk-runtime)
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins)
- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Provedores de modelos](/pt-BR/concepts/model-providers)
