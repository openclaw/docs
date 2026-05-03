---
read_when:
    - Você está alterando o ambiente de execução do agente incorporado ou o registro do arcabouço
    - Você está registrando uma estrutura de agente de um Plugin incluído ou confiável
    - Você precisa entender como o Plugin Codex se relaciona com os provedores de modelos
sidebarTitle: Agent Harness
summary: Interface experimental do SDK para plugins que substituem o executor de agente incorporado de baixo nível
title: Plugins da estrutura de agentes
x-i18n:
    generated_at: "2026-05-03T05:54:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed416bbb433fc502c60fd8c24d20cd0f862d45472ff2eb0e2484b256b58f1b35
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Um **harness de agente** é o executor de baixo nível para um turno preparado de agente OpenClaw. Ele não é um provedor de modelo, não é um canal e não é um registro de ferramentas. Para o modelo mental voltado ao usuário, consulte [runtimes de agente](/pt-BR/concepts/agent-runtimes).

Use esta superfície apenas para plugins nativos agrupados ou confiáveis. O contrato ainda é experimental porque os tipos de parâmetro espelham intencionalmente o executor embutido atual.

## Quando usar um harness

Registre um harness de agente quando uma família de modelos tiver seu próprio runtime de sessão nativo e o transporte normal de provedor do OpenClaw for a abstração errada.

Exemplos:

- um servidor nativo de agente de codificação que possui threads e compaction
- uma CLI local ou daemon que precisa transmitir eventos nativos de plano/raciocínio/ferramenta
- um runtime de modelo que precisa do próprio id de retomada além da transcrição da sessão do OpenClaw

Não registre um harness **apenas** para adicionar uma nova API de LLM. Para APIs de modelo normais via HTTP ou WebSocket, crie um [plugin de provedor](/pt-BR/plugins/sdk-provider-plugins).

## O que o core ainda controla

Antes de um harness ser selecionado, o OpenClaw já resolveu:

- provedor e modelo
- estado de autenticação do runtime
- nível de raciocínio e orçamento de contexto
- o arquivo de transcrição/sessão do OpenClaw
- workspace, sandbox e política de ferramentas
- callbacks de resposta do canal e callbacks de streaming
- política de fallback de modelo e troca de modelo em tempo real

Essa divisão é intencional. Um harness executa uma tentativa preparada; ele não escolhe provedores, não substitui a entrega do canal nem troca modelos silenciosamente.

A tentativa preparada também inclui `params.runtimePlan`, um pacote de políticas controlado pelo OpenClaw para decisões de runtime que devem permanecer compartilhadas entre PI e harnesses nativos:

- `runtimePlan.tools.normalize(...)` e
  `runtimePlan.tools.logDiagnostics(...)` para política de esquema de ferramentas ciente do provedor
- `runtimePlan.transcript.resolvePolicy(...)` para sanitização de transcrição e política de reparo de chamadas de ferramenta
- `runtimePlan.delivery.isSilentPayload(...)` para supressão compartilhada de `NO_REPLY` e entrega de mídia
- `runtimePlan.outcome.classifyRunResult(...)` para classificação de fallback de modelo
- `runtimePlan.observability` para metadados resolvidos de provedor/modelo/harness

Harnesses podem usar o plano para decisões que precisam corresponder ao comportamento do PI, mas ainda devem tratá-lo como estado de tentativa controlado pelo host. Não o modifique nem o use para trocar provedores/modelos dentro de um turno.

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

1. O id de harness registrado de uma sessão existente vence, então alterações de config/env não fazem hot-switch dessa transcrição para outro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` força um harness registrado com esse id para sessões que ainda não estão fixadas.
3. `OPENCLAW_AGENT_RUNTIME=pi` força o harness PI embutido.
4. `OPENCLAW_AGENT_RUNTIME=auto` pergunta aos harnesses registrados se eles dão suporte ao provedor/modelo resolvido.
5. Se nenhum harness registrado corresponder, o OpenClaw usa PI, a menos que o fallback para PI esteja desativado.

Falhas de harness de plugin aparecem como falhas de execução. No modo `auto`, o fallback para PI é usado apenas quando nenhum harness de plugin registrado dá suporte ao provedor/modelo resolvido. Depois que um harness de plugin reivindica uma execução, o OpenClaw não reproduz esse mesmo turno pelo PI porque isso pode alterar semânticas de autenticação/runtime ou duplicar efeitos colaterais.

O id do harness selecionado é persistido com o id da sessão após uma execução embutida. Sessões legadas criadas antes das fixações de harness são tratadas como fixadas ao PI depois que têm histórico de transcrição. Use uma sessão nova/redefinida ao alternar entre PI e um harness de plugin nativo. `/status` mostra ids de harness não padrão, como `codex`, ao lado de `Fast`; PI permanece oculto porque é o caminho de compatibilidade padrão. Se o harness selecionado for surpreendente, habilite o log de depuração `agents/harness` e inspecione o registro estruturado `agent harness selected` do gateway. Ele inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e, no modo `auto`, o resultado de suporte de cada candidato de plugin.

O plugin Codex agrupado registra `codex` como seu id de harness. O core trata isso como um id comum de harness de plugin; aliases específicos do Codex pertencem ao plugin ou à configuração do operador, não ao seletor de runtime compartilhado.

## Pareamento de provedor e harness

A maioria dos harnesses também deve registrar um provedor. O provedor torna refs de modelo, status de autenticação, metadados de modelo e seleção de `/model` visíveis para o restante do OpenClaw. O harness então reivindica esse provedor em `supports(...)`.

O plugin Codex agrupado segue este padrão:

- refs de modelo de usuário preferenciais: `openai/gpt-5.5` mais
  `agentRuntime.id: "codex"`
- refs de compatibilidade: refs legadas `codex/gpt-*` continuam aceitas, mas novas configurações não devem usá-las como refs normais de provedor/modelo
- id de harness: `codex`
- autenticação: disponibilidade sintética de provedor, porque o harness Codex controla o login/sessão nativo do Codex
- solicitação ao servidor de aplicativo: o OpenClaw envia o id de modelo simples para o Codex e deixa o harness falar com o protocolo nativo do servidor de aplicativo

O plugin Codex é aditivo. Refs simples `openai/gpt-*` continuam usando o caminho normal de provedor do OpenClaw, a menos que você force o harness Codex com `agentRuntime.id: "codex"`. Refs antigas `codex/gpt-*` ainda selecionam o provedor e o harness Codex por compatibilidade.

Para configuração de operador, exemplos de prefixo de modelo e configurações apenas do Codex, consulte [Harness Codex](/pt-BR/plugins/codex-harness).

O OpenClaw exige o servidor de aplicativo Codex `0.125.0` ou mais recente. O plugin Codex verifica o handshake de inicialização do servidor de aplicativo e bloqueia servidores mais antigos ou sem versão para que o OpenClaw execute apenas contra a superfície de protocolo com a qual foi testado. O piso `0.125.0` inclui o suporte nativo a payloads de hook MCP que chegou no Codex `0.124.0`, enquanto fixa o OpenClaw à linha estável testada mais recente.

### Middleware de resultado de ferramenta

Plugins agrupados podem anexar middleware de resultado de ferramenta neutro em relação ao runtime por meio de `api.registerAgentToolResultMiddleware(...)` quando o manifesto declara os ids de runtime alvo em `contracts.agentToolResultMiddleware`. Esta seam confiável é para transformações assíncronas de resultado de ferramenta que precisam ser executadas antes que PI ou Codex alimente a saída da ferramenta de volta no modelo.

Plugins agrupados legados ainda podem usar `api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo do servidor de aplicativo Codex, mas novas transformações de resultado devem usar a API neutra em relação ao runtime. O hook somente para Pi `api.registerEmbeddedExtensionFactory(...)` foi removido; transformações de resultado de ferramenta do Pi devem usar middleware neutro em relação ao runtime.

### Classificação de resultado terminal

Harnesses nativos que controlam a própria projeção de protocolo podem usar `classifyAgentHarnessTerminalOutcome(...)` de `openclaw/plugin-sdk/agent-harness-runtime` quando um turno concluído não produziu texto visível de assistente. O helper retorna `empty`, `reasoning-only` ou `planning-only` para que a política de fallback do OpenClaw possa decidir se deve tentar novamente em um modelo diferente. Ele intencionalmente deixa sem classificação erros de prompt, turnos em andamento e respostas silenciosas intencionais, como `NO_REPLY`.

### Modo de harness Codex nativo

O harness `codex` agrupado é o modo Codex nativo para turnos embutidos de agente do OpenClaw. Primeiro habilite o plugin `codex` agrupado e inclua `codex` em `plugins.allow` se sua configuração usar uma allowlist restritiva. Configurações nativas de servidor de aplicativo devem usar `openai/gpt-*` com `agentRuntime.id: "codex"`. Use `openai-codex/*` para OAuth do Codex via PI. Refs de modelo legadas `codex/*` continuam sendo aliases de compatibilidade para o harness nativo.

Quando este modo executa, o Codex controla o id de thread nativo, o comportamento de retomada, a compaction e a execução do servidor de aplicativo. O OpenClaw ainda controla o canal de chat, o espelho de transcrição visível, a política de ferramentas, aprovações, entrega de mídia e seleção de sessão. Use `agentRuntime.id: "codex"` quando precisar provar que apenas o caminho do servidor de aplicativo Codex pode reivindicar a execução. Runtimes explícitos de plugin falham de forma fechada; falhas de seleção do servidor de aplicativo Codex e falhas de runtime não são tentadas novamente pelo PI.

## Rigidez de runtime

Por padrão, o OpenClaw executa agentes embutidos com OpenClaw Pi. No modo `auto`, harnesses de plugin registrados podem reivindicar um par provedor/modelo, e PI lida com o turno quando nenhum corresponder. Use um runtime explícito de plugin, como `agentRuntime.id: "codex"`, quando a ausência de seleção de harness deve falhar em vez de rotear pelo PI. Falhas de harness de plugin selecionado sempre falham de forma rígida. Isso não bloqueia um `agentRuntime.id: "pi"` explícito nem `OPENCLAW_AGENT_RUNTIME=pi`.

Para execuções embutidas apenas do Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

Se quiser que qualquer harness de plugin registrado reivindique modelos correspondentes e, caso contrário, use PI, defina `id: "auto"`:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto"
      }
    }
  }
}
```

Substituições por agente usam o mesmo formato:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": { "id": "auto" }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": { "id": "codex" }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` ainda substitui o runtime configurado.

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Com um runtime explícito de plugin, uma sessão falha cedo quando o harness solicitado não está registrado, não dá suporte ao provedor/modelo resolvido ou falha antes de produzir efeitos colaterais do turno. Isso é intencional para implantações apenas do Codex e para testes em tempo real que precisam provar que o caminho do servidor de aplicativo Codex está realmente em uso.

Esta configuração controla apenas o harness de agente embutido. Ela não desativa roteamento de modelo específico de provedor para imagem, vídeo, música, TTS, PDF ou outros.

## Sessões nativas e espelho de transcrição

Um harness pode manter um id de sessão nativo, id de thread ou token de retomada no lado do daemon. Mantenha esse vínculo explicitamente associado à sessão OpenClaw e continue espelhando a saída de assistente/ferramenta visível ao usuário na transcrição do OpenClaw.

A transcrição do OpenClaw continua sendo a camada de compatibilidade para:

- histórico de sessão visível no canal
- busca e indexação de transcrição
- alternar de volta para o harness PI embutido em um turno posterior
- comportamento genérico de `/new`, `/reset` e exclusão de sessão

Se o seu harness armazenar um vínculo sidecar, implemente `reset(...)` para que o OpenClaw possa limpá-lo quando a sessão OpenClaw proprietária for redefinida.

## Resultados de ferramenta e mídia

O core constrói a lista de ferramentas do OpenClaw e a passa para a tentativa preparada. Quando um harness executa uma chamada de ferramenta dinâmica, retorne o resultado da ferramenta pelo formato de resultado do harness em vez de enviar mídia ao canal por conta própria.

Isso mantém saídas de texto, imagem, vídeo, música, TTS, aprovação e ferramenta de mensagens no mesmo caminho de entrega que execuções apoiadas por PI.

## Limitações atuais

- O caminho público de importação é genérico, mas alguns aliases de tipo de tentativa/resultado ainda
  carregam nomes `Pi` por compatibilidade.
- A instalação de harnesses de terceiros é experimental. Prefira plugins de provedores
  até precisar de um runtime de sessão nativo.
- A troca de harness é compatível entre turnos. Não troque de harnesses no
  meio de um turno depois que ferramentas nativas, aprovações, texto do assistente ou envios
  de mensagens tiverem começado.

## Relacionados

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview)
- [Helpers de runtime](/pt-BR/plugins/sdk-runtime)
- [Plugins de provedores](/pt-BR/plugins/sdk-provider-plugins)
- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
