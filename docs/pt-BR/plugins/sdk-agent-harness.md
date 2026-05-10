---
read_when:
    - Você está alterando o ambiente de execução do agente incorporado ou o registro do mecanismo de integração
    - Você está registrando um harness de agente a partir de um Plugin incluído ou confiável
    - É necessário entender como o Plugin Codex se relaciona com os provedores de modelo
sidebarTitle: Agent Harness
summary: Superfície experimental do SDK para plugins que substituem o executor de agente embutido de baixo nível
title: Plugins de ambiente de execução de agentes
x-i18n:
    generated_at: "2026-05-10T19:44:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1685af479a8502ac743b0f520f0afae2cdc905524e48b3a84ce95ffe85c8fb49
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Um **harness de agente** é o executor de baixo nível para um turno preparado de agente OpenClaw. Ele não é um provedor de modelo, nem um canal, nem um registro de ferramentas. Para o modelo mental voltado ao usuário, consulte [Runtimes de agentes](/pt-BR/concepts/agent-runtimes).

Use esta superfície apenas para plugins nativos incluídos ou confiáveis. O contrato ainda é experimental porque os tipos de parâmetros espelham intencionalmente o executor embarcado atual.

## Quando usar um harness

Registre um harness de agente quando uma família de modelos tiver seu próprio runtime de sessão nativa e o transporte normal de provedor do OpenClaw for a abstração errada.

Exemplos:

- um servidor nativo de agente de codificação que possui threads e compaction
- uma CLI ou daemon local que precisa transmitir eventos nativos de plano/raciocínio/ferramenta
- um runtime de modelo que precisa do próprio id de retomada além da transcrição da sessão do OpenClaw

**Não** registre um harness apenas para adicionar uma nova API de LLM. Para APIs de modelo HTTP ou WebSocket normais, crie um [plugin de provedor](/pt-BR/plugins/sdk-provider-plugins).

## O que o core ainda controla

Antes de um harness ser selecionado, o OpenClaw já resolveu:

- provedor e modelo
- estado de autenticação do runtime
- nível de pensamento e orçamento de contexto
- o arquivo de transcrição/sessão do OpenClaw
- workspace, sandbox e política de ferramentas
- callbacks de resposta do canal e callbacks de streaming
- fallback de modelo e política de troca de modelo ao vivo

Essa separação é intencional. Um harness executa uma tentativa preparada; ele não escolhe provedores, substitui a entrega do canal nem troca modelos silenciosamente.

A tentativa preparada também inclui `params.runtimePlan`, um pacote de políticas controlado pelo OpenClaw para decisões de runtime que precisam continuar compartilhadas entre PI e harnesses nativos:

- `runtimePlan.tools.normalize(...)` e
  `runtimePlan.tools.logDiagnostics(...)` para política de esquema de ferramentas ciente do provedor
- `runtimePlan.transcript.resolvePolicy(...)` para sanitização de transcrição e política de reparo de chamadas de ferramenta
- `runtimePlan.delivery.isSilentPayload(...)` para supressão compartilhada de `NO_REPLY` e entrega de mídia
- `runtimePlan.outcome.classifyRunResult(...)` para classificação de fallback de modelo
- `runtimePlan.observability` para metadados resolvidos de provedor/modelo/harness

Harnesses podem usar o plano para decisões que precisam corresponder ao comportamento do PI, mas ainda devem tratá-lo como estado de tentativa pertencente ao host. Não o modifique nem o use para trocar provedores/modelos dentro de um turno.

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
3. `auto` pergunta aos harnesses registrados se eles dão suporte ao provedor/modelo resolvido.
4. Se nenhum harness registrado corresponder, o OpenClaw usa PI, a menos que o fallback para PI esteja desabilitado.

Falhas de harness de plugin aparecem como falhas de execução. No modo `auto`, o fallback para PI só é usado quando nenhum harness de plugin registrado dá suporte ao provedor/modelo resolvido. Depois que um harness de plugin reivindica uma execução, o OpenClaw não reproduz esse mesmo turno pelo PI, porque isso pode alterar a semântica de autenticação/runtime ou duplicar efeitos colaterais.

Pinos de runtime de sessão inteira e de agente inteiro são ignorados pela seleção. Isso inclui valores obsoletos de sessão `agentHarnessId`, `agents.defaults.agentRuntime`, `agents.list[].agentRuntime` e `OPENCLAW_AGENT_RUNTIME`. `/status` mostra o runtime efetivo selecionado a partir da rota de provedor/modelo.
Se o harness selecionado for surpreendente, habilite o log de depuração de `agents/harness` e inspecione o registro estruturado `agent harness selected` do gateway. Ele inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e, no modo `auto`, o resultado de suporte de cada candidato de plugin.

O plugin Codex incluído registra `codex` como seu id de harness. O core trata isso como um id comum de harness de plugin; aliases específicos do Codex pertencem ao plugin ou à configuração do operador, não ao seletor de runtime compartilhado.

## Pareamento de provedor e harness

A maioria dos harnesses também deve registrar um provedor. O provedor torna refs de modelo, status de autenticação, metadados de modelo e seleção via `/model` visíveis para o restante do OpenClaw. O harness então reivindica esse provedor em `supports(...)`.

O plugin Codex incluído segue este padrão:

- refs de modelo de usuário preferenciais: `openai/gpt-5.5`
- refs de compatibilidade: refs legadas `codex/gpt-*` continuam aceitas, mas novas configurações não devem usá-las como refs normais de provedor/modelo
- id do harness: `codex`
- autenticação: disponibilidade sintética do provedor, porque o harness Codex controla o login/sessão nativo do Codex
- solicitação ao app-server: o OpenClaw envia o id de modelo simples ao Codex e deixa o harness conversar com o protocolo nativo do app-server

O plugin Codex é aditivo. Refs de agente simples `openai/gpt-*` no provedor OpenAI oficial selecionam o harness Codex por padrão. Refs antigas `codex/gpt-*` ainda selecionam o provedor e o harness Codex por compatibilidade.

Para configuração de operador, exemplos de prefixo de modelo e configurações exclusivas do Codex, consulte [Harness Codex](/pt-BR/plugins/codex-harness).

O OpenClaw exige Codex app-server `0.125.0` ou mais recente. O plugin Codex verifica o handshake de inicialização do app-server e bloqueia servidores mais antigos ou sem versão, para que o OpenClaw execute apenas contra a superfície de protocolo com a qual foi testado. O piso `0.125.0` inclui o suporte nativo a payloads do hook MCP que chegou no Codex `0.124.0`, enquanto fixa o OpenClaw na linha estável testada mais recente.

### Middleware de resultado de ferramenta

Plugins incluídos podem anexar middleware de resultado de ferramenta neutro em relação ao runtime por meio de `api.registerAgentToolResultMiddleware(...)` quando seu manifesto declara os ids de runtime alvo em `contracts.agentToolResultMiddleware`. Esta superfície confiável é para transformações assíncronas de resultado de ferramenta que precisam rodar antes que PI ou Codex alimente a saída da ferramenta de volta ao modelo.

Plugins incluídos legados ainda podem usar `api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo do app-server Codex, mas novas transformações de resultado devem usar a API neutra em relação ao runtime.
O hook exclusivo de Pi `api.registerEmbeddedExtensionFactory(...)` foi removido; transformações de resultado de ferramenta do Pi devem usar middleware neutro em relação ao runtime.

### Classificação de resultado terminal

Harnesses nativos que controlam sua própria projeção de protocolo podem usar `classifyAgentHarnessTerminalOutcome(...)` de `openclaw/plugin-sdk/agent-harness-runtime` quando um turno concluído não produzir texto visível do assistente. O helper retorna `empty`, `reasoning-only` ou `planning-only`, para que a política de fallback do OpenClaw possa decidir se deve tentar novamente em outro modelo. Ele intencionalmente deixa sem classificação erros de prompt, turnos em andamento e respostas silenciosas intencionais, como `NO_REPLY`.

### Modo de harness Codex nativo

O harness `codex` incluído é o modo Codex nativo para turnos de agente OpenClaw embarcados. Habilite primeiro o plugin `codex` incluído e inclua `codex` em `plugins.allow` se sua configuração usar uma allowlist restritiva. Configurações de app-server nativo devem usar `openai/gpt-*`; turnos de agente OpenAI selecionam o harness Codex por padrão. Rotas legadas `openai-codex/*` devem ser reparadas com `openclaw doctor --fix`, e refs de modelo legadas `codex/*` permanecem aliases de compatibilidade para o harness nativo.

Quando este modo roda, o Codex controla o id de thread nativo, o comportamento de retomada, a compaction e a execução do app-server. O OpenClaw ainda controla o canal de chat, o espelho de transcrição visível, a política de ferramentas, aprovações, entrega de mídia e seleção de sessão. Use `agentRuntime.id: "codex"` de provedor/modelo quando precisar provar que apenas o caminho do app-server Codex pode reivindicar a execução. Runtimes explícitos de plugin falham de modo fechado; falhas de seleção do app-server Codex e falhas de runtime não são tentadas novamente pelo PI.

## Rigor do runtime

Por padrão, o OpenClaw usa a política de runtime de provedor/modelo `auto`: harnesses de plugin registrados podem reivindicar um par provedor/modelo, e o PI lida com o turno quando nenhum corresponde. Refs de agente OpenAI no provedor OpenAI oficial usam Codex por padrão. Use um runtime explícito de plugin de provedor/modelo, como `agentRuntime.id: "codex"`, quando a ausência de seleção de harness deve falhar em vez de rotear pelo PI. Falhas de harness de plugin selecionado sempre falham de forma rígida. Isso não bloqueia um `agentRuntime.id: "pi"` explícito de provedor/modelo.

Para execuções embarcadas exclusivas do Codex:

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

Se você quiser um backend de CLI para um modelo canônico, coloque o runtime nessa entrada de modelo:

```json
{
  "agents": {
    "defaults": {
      "model": "anthropic/claude-opus-4-7",
      "models": {
        "anthropic/claude-opus-4-7": {
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

Exemplos legados de runtime de agente inteiro como este são ignorados:

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

Com um runtime explícito de plugin, uma sessão falha cedo quando o harness solicitado não está registrado, não dá suporte ao provedor/modelo resolvido ou falha antes de produzir efeitos colaterais do turno. Isso é intencional para implantações exclusivas do Codex e para testes ao vivo que precisam provar que o caminho do app-server Codex está realmente em uso.

Essa configuração controla apenas o harness de agente embarcado. Ela não desabilita roteamento de modelo específico do provedor para imagem, vídeo, música, TTS, PDF ou outros.

## Sessões nativas e espelho de transcrição

Um harness pode manter um id de sessão nativa, id de thread ou token de retomada no lado do daemon. Mantenha essa associação explicitamente vinculada à sessão OpenClaw e continue espelhando a saída de assistente/ferramenta visível ao usuário na transcrição do OpenClaw.

A transcrição do OpenClaw continua sendo a camada de compatibilidade para:

- histórico de sessão visível ao canal
- busca e indexação de transcrição
- troca de volta para o harness PI integrado em um turno posterior
- comportamento genérico de `/new`, `/reset` e exclusão de sessão

Se o seu harness armazenar uma associação sidecar, implemente `reset(...)` para que o OpenClaw possa limpá-la quando a sessão OpenClaw proprietária for redefinida.

## Resultados de ferramenta e mídia

O core constrói a lista de ferramentas do OpenClaw e a passa para a tentativa preparada. Quando um harness executa uma chamada de ferramenta dinâmica, retorne o resultado da ferramenta por meio do formato de resultado do harness em vez de enviar mídia de canal diretamente.

Isso mantém saídas de texto, imagem, vídeo, música, TTS, aprovação e ferramenta de mensagens no mesmo caminho de entrega das execuções apoiadas por PI.

## Limitações atuais

- O caminho de importação público é genérico, mas alguns aliases de tipo de tentativa/resultado ainda carregam nomes `Pi` por compatibilidade.
- A instalação de harnesses de terceiros é experimental. Prefira plugins de provedor até precisar de um runtime de sessão nativa.
- A troca de harness é suportada entre turnos. Não troque harnesses no meio de um turno depois que ferramentas nativas, aprovações, texto do assistente ou envios de mensagem tiverem começado.

## Relacionados

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview)
- [Helpers de runtime](/pt-BR/plugins/sdk-runtime)
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins)
- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Provedores de modelos](/pt-BR/concepts/model-providers)
