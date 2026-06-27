---
read_when:
    - Você está alterando o runtime do agente incorporado ou o registro de harness
    - Você está registrando um harness de agente a partir de um Plugin incluído ou confiável
    - Você precisa entender como o plugin Codex se relaciona com os provedores de modelo
sidebarTitle: Agent Harness
summary: Interface experimental do SDK para plugins que substituem o executor de agente integrado de baixo nível
title: Plugins de harness de agente
x-i18n:
    generated_at: "2026-06-27T17:57:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a368ae480c31c86c30786f91e5cf451c3489c681be8ee3955c1c2bd55e4b49e9
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Um **harness de agente** é o executor de baixo nível para uma única rodada preparada de agente do OpenClaw. Ele não é um provedor de modelo, não é um canal e não é um registro de ferramentas.
Para o modelo mental voltado ao usuário, consulte [Runtimes de agente](/pt-BR/concepts/agent-runtimes).

Use esta superfície apenas para Plugins nativos integrados ou confiáveis. O contrato
ainda é experimental porque os tipos de parâmetro espelham intencionalmente o executor
embarcado atual.

## Quando usar um harness

Registre um harness de agente quando uma família de modelos tiver seu próprio runtime
de sessão nativo e o transporte normal de provedor do OpenClaw for a abstração errada.

Exemplos:

- um servidor de agente de codificação nativo que possui threads e Compaction
- uma CLI ou daemon local que precisa transmitir eventos nativos de plano/raciocínio/ferramenta
- um runtime de modelo que precisa do seu próprio ID de retomada além da transcrição
  de sessão do OpenClaw

**Não** registre um harness apenas para adicionar uma nova API de LLM. Para APIs de modelo
HTTP ou WebSocket normais, crie um [Plugin de provedor](/pt-BR/plugins/sdk-provider-plugins).

## O que o núcleo ainda controla

Antes de um harness ser selecionado, o OpenClaw já resolveu:

- provedor e modelo
- estado de autenticação do runtime
- nível de pensamento e orçamento de contexto
- o arquivo de transcrição/sessão do OpenClaw
- workspace, sandbox e política de ferramentas
- callbacks de resposta do canal e callbacks de streaming
- fallback de modelo e política de troca de modelo ao vivo

Essa divisão é intencional. Um harness executa uma tentativa preparada; ele não escolhe
provedores, substitui a entrega do canal nem troca modelos silenciosamente.

A tentativa preparada também inclui `params.runtimePlan`, um pacote de políticas controlado pelo OpenClaw
para decisões de runtime que devem permanecer compartilhadas entre o OpenClaw e harnesses nativos:

- `runtimePlan.tools.normalize(...)` e
  `runtimePlan.tools.logDiagnostics(...)` para política de esquema de ferramentas ciente do provedor
- `runtimePlan.transcript.resolvePolicy(...)` para sanitização de transcrição e
  política de reparo de chamadas de ferramenta
- `runtimePlan.delivery.isSilentPayload(...)` para supressão compartilhada de entrega de mídia
  e `NO_REPLY`
- `runtimePlan.outcome.classifyRunResult(...)` para classificação de fallback de modelo
- `runtimePlan.observability` para metadados resolvidos de provedor/modelo/harness

Harnesses podem usar o plano para decisões que precisam corresponder ao comportamento do OpenClaw, mas
ainda devem tratá-lo como estado de tentativa controlado pelo host. Não o modifique nem o use para
trocar provedores/modelos dentro de uma rodada.

## Registrar um harness

**Importação:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Start or resume your native thread.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent, and the other prepared attempt fields.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Política de seleção

O OpenClaw escolhe um harness após a resolução de provedor/modelo:

1. A política de runtime com escopo de modelo vence.
2. A política de runtime com escopo de provedor vem em seguida.
3. `auto` pergunta aos harnesses registrados se eles oferecem suporte ao
   provedor/modelo resolvido.
4. Se nenhum harness registrado corresponder, o OpenClaw usa seu runtime embarcado.

Falhas de harness de Plugin aparecem como falhas de execução. No modo `auto`, o fallback embarcado é
usado apenas quando nenhum harness de Plugin registrado oferece suporte ao
provedor/modelo resolvido. Depois que um harness de Plugin reivindica uma execução, o OpenClaw não
repete essa mesma rodada por outro runtime porque isso pode alterar
semânticas de autenticação/runtime ou duplicar efeitos colaterais.

Pins de runtime para a sessão inteira e para o agente inteiro são ignorados pela seleção. Isso
inclui valores obsoletos de sessão `agentHarnessId`, `agents.defaults.agentRuntime`,
`agents.list[].agentRuntime` e `OPENCLAW_AGENT_RUNTIME`. `/status` mostra o
runtime efetivo selecionado a partir da rota de provedor/modelo.
Se o harness selecionado for inesperado, habilite o log de depuração `agents/harness` e
inspecione o registro estruturado `agent harness selected` do Gateway. Ele inclui
o ID do harness selecionado, o motivo da seleção, a política de runtime/fallback e, no
modo `auto`, o resultado de suporte de cada candidato de Plugin.

O Plugin Codex integrado registra `codex` como seu ID de harness. O núcleo trata isso
como um ID comum de harness de Plugin; aliases específicos do Codex pertencem ao Plugin
ou à configuração do operador, não ao seletor de runtime compartilhado.

## Pareamento de provedor e harness

A maioria dos harnesses também deve registrar um provedor. O provedor torna referências de modelo,
estado de autenticação, metadados de modelo e seleção `/model` visíveis para o restante do
OpenClaw. O harness então reivindica esse provedor em `supports(...)`.

O Plugin Codex integrado segue este padrão:

- refs de modelo de usuário preferenciais: `openai/gpt-5.5`
- refs de compatibilidade: refs legadas `codex/gpt-*` continuam aceitas, mas novas
  configurações não devem usá-las como refs normais de provedor/modelo
- ID de harness: `codex`
- autenticação: disponibilidade sintética de provedor, porque o harness Codex controla o
  login/sessão nativo do Codex
- solicitação ao servidor de aplicativo: o OpenClaw envia o ID simples do modelo ao Codex e deixa o
  harness falar com o protocolo nativo do servidor de aplicativo

O Plugin Codex é aditivo. Refs de agente `openai/gpt-*` simples no provedor oficial
OpenAI selecionam o harness Codex por padrão. Refs antigas `codex/gpt-*`
ainda selecionam o provedor e o harness Codex por compatibilidade.

Para configuração de operador, exemplos de prefixo de modelo e configurações somente do Codex, consulte
[Harness Codex](/pt-BR/plugins/codex-harness).

O OpenClaw exige Codex app-server `0.125.0` ou mais recente. O Plugin Codex verifica
o handshake de inicialização do app-server e bloqueia servidores mais antigos ou sem versão para que
o OpenClaw execute apenas contra a superfície de protocolo com a qual foi testado. O
piso `0.125.0` inclui o suporte nativo a payload de hook MCP que chegou no
Codex `0.124.0`, enquanto fixa o OpenClaw na linha estável testada mais recente.

### Middleware de resultado de ferramenta

Plugins integrados e Plugins instalados explicitamente habilitados com contratos de manifesto
correspondentes podem anexar middleware de resultado de ferramenta neutro em relação ao runtime por meio de
`api.registerAgentToolResultMiddleware(...)` quando o manifesto declarar os
IDs de runtime alvo em `contracts.agentToolResultMiddleware`. Esta interface confiável
serve para transformações assíncronas de resultado de ferramenta que devem ser executadas antes que o OpenClaw ou o Codex
alimente a saída da ferramenta de volta ao modelo.

Plugins integrados legados ainda podem usar
`api.registerCodexAppServerExtensionFactory(...)` para middleware somente de app-server do Codex,
mas novas transformações de resultado devem usar a API neutra em relação ao runtime.
O hook `api.registerEmbeddedExtensionFactory(...)`, exclusivo do executor embarcado, foi removido;
transformações de resultado de ferramenta embarcadas devem usar middleware neutro em relação ao runtime.

### Classificação de resultado terminal

Harnesses nativos que controlam sua própria projeção de protocolo podem usar
`classifyAgentHarnessTerminalOutcome(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` quando uma rodada concluída não produzir
texto de assistente visível. O helper retorna `empty`, `reasoning-only` ou
`planning-only` para que a política de fallback do OpenClaw possa decidir se deve tentar novamente em um
modelo diferente. `planning-only` exige o campo explícito `planText` do harness;
o OpenClaw não o infere a partir da prosa do assistente. O helper intencionalmente
deixa erros de prompt, rodadas em andamento e respostas silenciosas intencionais, como
`NO_REPLY`, sem classificação.

### Efeitos colaterais de fim do agente

Harnesses nativos devem chamar `runAgentEndSideEffects(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` depois de finalizar uma tentativa. Ele
dispara o hook portátil `agent_end` e a captura de pesquisa do OpenClaw sem
atrasar respostas interativas. Use `awaitAgentEndSideEffects(...)` para execuções locais,
não interativas, nas quais a tentativa não deve ser resolvida até que esses efeitos colaterais
terminem. Ambos os helpers aceitam o mesmo payload `{ event, ctx }` que
`runAgentHarnessAgentEndHook(...)`; suas falhas não alteram o resultado da tentativa
concluída.

### Entrada do usuário e superfícies de ferramenta

Harnesses nativos que expõem uma solicitação de entrada do usuário no nível de runtime devem usar os
helpers de entrada do usuário de `openclaw/plugin-sdk/agent-harness-runtime` para formatar
o prompt, entregá-lo pelo caminho de resposta bloqueante do OpenClaw e normalizar
respostas de escolha/texto livre de volta para o formato de resposta nativo do runtime. O
helper mantém a apresentação de canal/TUI consistente enquanto cada harness mantém seu
próprio parsing de protocolo e ciclo de vida de solicitações pendentes.

Harnesses nativos que precisam de roteamento compacto de ferramentas semelhante ao PI devem usar
`createAgentHarnessToolSurfaceRuntime(...)` de
`openclaw/plugin-sdk/agent-harness-tool-runtime`. Ele controla
seleção de controle de busca de ferramentas/modo de código, padrões enxutos de modelo local,
filtragem de esquema compatível com runtime, execução de catálogo oculto, hidratação de diretório
e limpeza de catálogo. Harnesses ainda controlam sua conversão de ferramentas específica do SDK
e o callback de execução nativa.

### Modo de harness Codex nativo

O harness `codex` integrado é o modo Codex nativo para rodadas de agente OpenClaw
embarcadas. Primeiro habilite o Plugin `codex` integrado e inclua `codex` em
`plugins.allow` se sua configuração usar uma allowlist restritiva. Configurações de app-server
nativo devem usar `openai/gpt-*`; rodadas de agente OpenAI selecionam o harness Codex
por padrão. Rotas legadas de refs de modelo Codex devem ser reparadas com
`openclaw doctor --fix`, e refs de modelo legadas `codex/*` permanecem aliases de
compatibilidade para o harness nativo.

Quando este modo executa, o Codex controla o ID de thread nativo, comportamento de retomada,
Compaction e execução do app-server. O OpenClaw ainda controla o canal de chat,
espelho de transcrição visível, política de ferramentas, aprovações, entrega de mídia e seleção
de sessão. Use `agentRuntime.id: "codex"` de provedor/modelo quando precisar provar
que apenas o caminho do app-server Codex pode reivindicar a execução. Runtimes de Plugin explícitos
falham de forma fechada; falhas de seleção do app-server Codex e falhas de runtime não são
tentadas novamente por outro runtime.

## Rigidez de runtime

Por padrão, o OpenClaw usa a política de runtime de provedor/modelo `auto`: harnesses de
Plugin registrados podem reivindicar um par provedor/modelo, e o runtime embarcado
lida com a rodada quando nenhum corresponde. Refs de agente OpenAI no provedor oficial OpenAI usam Codex por padrão.
Use um runtime de Plugin explícito de provedor/modelo, como
`agentRuntime.id: "codex"`, quando a ausência de seleção de harness deve falhar em vez
de rotear pelo runtime embarcado. Falhas de harness de Plugin selecionado sempre
falham de forma rígida. Isso não bloqueia um `agentRuntime.id: "openclaw"` explícito de provedor/modelo.

Para execuções embarcadas somente do Codex:

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
      "model": "openai/gpt-5.5"
    }
  }
}
```

Se você quiser um backend de CLI para um modelo canônico, coloque o runtime nessa
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
        "model": "openai/gpt-5.5",
        "models": {
          "openai/gpt-5.5": {
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

Com um runtime de Plugin explícito, uma sessão falha cedo quando o harness solicitado não está registrado, não oferece suporte ao provedor/modelo resolvido ou falha antes de produzir efeitos colaterais do turno. Isso é intencional para implantações somente Codex e para testes ao vivo que precisam provar que o caminho do app-server do Codex está realmente em uso.

Esta configuração controla apenas o harness de agente embutido. Ela não desativa o roteamento de modelos específico de provedor para imagem, vídeo, música, TTS, PDF ou outros recursos.

## Sessões nativas e espelho de transcrição

Um harness pode manter um ID de sessão nativa, ID de thread ou token de retomada do lado do daemon. Mantenha esse vínculo explicitamente associado à sessão do OpenClaw e continue espelhando a saída de assistente/ferramenta visível ao usuário na transcrição do OpenClaw.

A transcrição do OpenClaw continua sendo a camada de compatibilidade para:

- histórico de sessão visível no canal
- busca e indexação de transcrições
- alternância de volta para o harness embutido do OpenClaw em um turno posterior
- comportamento genérico de `/new`, `/reset` e exclusão de sessão

Se o seu harness armazenar um vínculo auxiliar, implemente `reset(...)` para que o OpenClaw possa limpá-lo quando a sessão proprietária do OpenClaw for redefinida.

## Resultados de ferramentas e mídia

O núcleo constrói a lista de ferramentas do OpenClaw e a passa para a tentativa preparada. Quando um harness executa uma chamada de ferramenta dinâmica, retorne o resultado da ferramenta por meio do formato de resultado do harness em vez de enviar mídia pelo canal você mesmo.

Isso mantém saídas de texto, imagem, vídeo, música, TTS, aprovação e ferramentas de mensagens no mesmo caminho de entrega das execuções apoiadas pelo OpenClaw.

## Limitações atuais

- O caminho de importação público é genérico, mas alguns aliases de tipo de tentativa/resultado ainda carregam nomes legados para compatibilidade.
- A instalação de harnesses de terceiros é experimental. Prefira Plugins de provedores até precisar de um runtime de sessão nativa.
- Há suporte para alternância de harness entre turnos. Não alterne harnesses no meio de um turno depois que ferramentas nativas, aprovações, texto do assistente ou envios de mensagem tiverem começado.

## Relacionado

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview)
- [Auxiliares de runtime](/pt-BR/plugins/sdk-runtime)
- [Plugins de provedores](/pt-BR/plugins/sdk-provider-plugins)
- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
