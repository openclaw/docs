---
read_when:
    - Você está alterando o ambiente de execução do agente incorporado ou o registro da estrutura de testes
    - Você está registrando uma estrutura de agente a partir de um Plugin incluído ou confiável
    - Você precisa entender como o Plugin do Codex se relaciona com os provedores de modelo
sidebarTitle: Agent Harness
summary: Superfície experimental do SDK para plugins que substituem o executor de agente incorporado de baixo nível
title: Plugins do ambiente de execução de agentes
x-i18n:
    generated_at: "2026-05-02T05:53:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b6e55d2df09c3965e1397be72f19dec2a6ed941ac8b7b01be8eee0f9713400dc
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Um **harness de agente** é o executor de baixo nível para um turno preparado de agente do OpenClaw. Ele não é um provedor de modelo, não é um canal e não é um registro de ferramentas. Para o modelo mental voltado ao usuário, consulte [Runtimes de agente](/pt-BR/concepts/agent-runtimes).

Use esta superfície somente para plugins nativos integrados ou confiáveis. O contrato ainda é experimental porque os tipos de parâmetros espelham intencionalmente o executor incorporado atual.

## Quando usar um harness

Registre um harness de agente quando uma família de modelos tiver seu próprio runtime de sessão nativo e o transporte normal de provedor do OpenClaw for a abstração errada.

Exemplos:

- um servidor nativo de agente de codificação que controla threads e compaction
- uma CLI local ou daemon que precisa transmitir eventos nativos de plano/raciocínio/ferramenta
- um runtime de modelo que precisa de seu próprio id de retomada além da transcrição da sessão do OpenClaw

**Não** registre um harness apenas para adicionar uma nova API de LLM. Para APIs de modelo HTTP ou WebSocket normais, crie um [plugin de provedor](/pt-BR/plugins/sdk-provider-plugins).

## O que o core ainda controla

Antes de um harness ser selecionado, o OpenClaw já resolveu:

- provedor e modelo
- estado de autenticação do runtime
- nível de thinking e orçamento de contexto
- o arquivo de transcrição/sessão do OpenClaw
- workspace, sandbox e política de ferramentas
- callbacks de resposta do canal e callbacks de streaming
- política de fallback de modelo e troca de modelo ao vivo

Essa divisão é intencional. Um harness executa uma tentativa preparada; ele não escolhe provedores, não substitui a entrega do canal nem troca modelos silenciosamente.

A tentativa preparada também inclui `params.runtimePlan`, um pacote de política controlado pelo OpenClaw para decisões de runtime que precisam permanecer compartilhadas entre PI e harnesses nativos:

- `runtimePlan.tools.normalize(...)` e `runtimePlan.tools.logDiagnostics(...)` para política de esquema de ferramentas ciente do provedor
- `runtimePlan.transcript.resolvePolicy(...)` para sanitização de transcrição e política de reparo de chamadas de ferramenta
- `runtimePlan.delivery.isSilentPayload(...)` para supressão compartilhada de entrega de mídia e `NO_REPLY`
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

1. O id de harness registrado em uma sessão existente prevalece, para que mudanças de config/env não troquem a transcrição para outro runtime em tempo real.
2. `OPENCLAW_AGENT_RUNTIME=<id>` força um harness registrado com esse id para sessões que ainda não estão fixadas.
3. `OPENCLAW_AGENT_RUNTIME=pi` força o harness PI integrado.
4. `OPENCLAW_AGENT_RUNTIME=auto` pergunta aos harnesses registrados se eles oferecem suporte ao provedor/modelo resolvido.
5. Se nenhum harness registrado corresponder, o OpenClaw usa PI, a menos que o fallback para PI esteja desativado.

Falhas de harness de plugin aparecem como falhas de execução. No modo `auto`, o fallback para PI só é usado quando nenhum harness de plugin registrado oferece suporte ao provedor/modelo resolvido. Depois que um harness de plugin reivindica uma execução, o OpenClaw não reproduz esse mesmo turno pelo PI, porque isso pode alterar a semântica de autenticação/runtime ou duplicar efeitos colaterais.

O id do harness selecionado é persistido com o id da sessão após uma execução incorporada. Sessões legadas criadas antes de pins de harness são tratadas como fixadas no PI depois que têm histórico de transcrição. Use uma sessão nova/redefinida ao alternar entre PI e um harness de plugin nativo. `/status` mostra ids de harness não padrão, como `codex`, ao lado de `Fast`; PI permanece oculto porque é o caminho de compatibilidade padrão. Se o harness selecionado for surpreendente, ative o log de depuração `agents/harness` e inspecione o registro estruturado `agent harness selected` do Gateway. Ele inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e, no modo `auto`, o resultado de suporte de cada candidato de plugin.

O plugin Codex integrado registra `codex` como seu id de harness. O core trata isso como um id comum de harness de plugin; aliases específicos do Codex pertencem ao plugin ou à configuração do operador, não ao seletor de runtime compartilhado.

## Pareamento de provedor e harness

A maioria dos harnesses também deve registrar um provedor. O provedor torna refs de modelo, status de autenticação, metadados de modelo e seleção `/model` visíveis para o restante do OpenClaw. O harness então reivindica esse provedor em `supports(...)`.

O plugin Codex integrado segue este padrão:

- refs de modelo de usuário preferenciais: `openai/gpt-5.5` mais `agentRuntime.id: "codex"`
- refs de compatibilidade: refs legadas `codex/gpt-*` continuam aceitas, mas novas configs não devem usá-las como refs normais de provedor/modelo
- id do harness: `codex`
- autenticação: disponibilidade sintética de provedor, porque o harness Codex controla o login/sessão nativo do Codex
- solicitação ao app-server: o OpenClaw envia o id de modelo simples ao Codex e deixa o harness falar com o protocolo nativo do app-server

O plugin Codex é aditivo. Refs simples `openai/gpt-*` continuam usando o caminho normal de provedor do OpenClaw, a menos que você force o harness Codex com `agentRuntime.id: "codex"`. Refs antigas `codex/gpt-*` ainda selecionam o provedor e o harness Codex por compatibilidade.

Para configuração do operador, exemplos de prefixo de modelo e configs somente Codex, consulte [Harness Codex](/pt-BR/plugins/codex-harness).

O OpenClaw exige Codex app-server `0.125.0` ou mais recente. O plugin Codex verifica o handshake de inicialização do app-server e bloqueia servidores mais antigos ou sem versão para que o OpenClaw execute somente contra a superfície de protocolo com a qual foi testado. O piso `0.125.0` inclui o suporte nativo a payloads de hook MCP que chegou no Codex `0.124.0`, enquanto fixa o OpenClaw à linha estável testada mais recente.

### Middleware de resultado de ferramenta

Plugins integrados podem anexar middleware de resultado de ferramenta neutro em relação ao runtime por meio de `api.registerAgentToolResultMiddleware(...)` quando o manifesto declara os ids de runtime direcionados em `contracts.agentToolResultMiddleware`. Esta seam confiável é para transformações assíncronas de resultado de ferramenta que precisam rodar antes que PI ou Codex alimentem a saída da ferramenta de volta ao modelo.

Plugins integrados legados ainda podem usar `api.registerCodexAppServerExtensionFactory(...)` para middleware somente de app-server Codex, mas novas transformações de resultado devem usar a API neutra em relação ao runtime. O hook somente de Pi `api.registerEmbeddedExtensionFactory(...)` foi removido; transformações de resultado de ferramenta do Pi devem usar middleware neutro em relação ao runtime.

### Classificação de resultado terminal

Harnesses nativos que controlam sua própria projeção de protocolo podem usar `classifyAgentHarnessTerminalOutcome(...)` de `openclaw/plugin-sdk/agent-harness-runtime` quando um turno concluído não produziu texto visível do assistente. O helper retorna `empty`, `reasoning-only` ou `planning-only` para que a política de fallback do OpenClaw possa decidir se deve tentar novamente em um modelo diferente. Ele deixa intencionalmente sem classificação erros de prompt, turnos em andamento e respostas silenciosas intencionais como `NO_REPLY`.

### Modo de harness Codex nativo

O harness `codex` integrado é o modo Codex nativo para turnos de agente incorporados do OpenClaw. Ative primeiro o plugin `codex` integrado e inclua `codex` em `plugins.allow` se sua config usar uma allowlist restritiva. Configs nativas de app-server devem usar `openai/gpt-*` com `agentRuntime.id: "codex"`. Use `openai-codex/*` para OAuth do Codex por meio do PI. Refs de modelo legadas `codex/*` permanecem como aliases de compatibilidade para o harness nativo.

Quando esse modo é executado, o Codex controla o id de thread nativo, comportamento de retomada, compaction e execução do app-server. O OpenClaw ainda controla o canal de chat, espelho de transcrição visível, política de ferramentas, aprovações, entrega de mídia e seleção de sessão. Use `agentRuntime.id: "codex"` sem uma substituição de `fallback` quando você precisa provar que somente o caminho do app-server Codex pode reivindicar a execução. Runtimes de plugin explícitos já falham fechado por padrão. Defina `fallback: "pi"` somente quando você quiser intencionalmente que o PI lide com uma seleção de harness ausente. Falhas do app-server Codex já falham diretamente em vez de tentar novamente pelo PI.

## Desativar fallback para PI

Por padrão, o OpenClaw executa agentes incorporados com `agents.defaults.agentRuntime` definido como `{ id: "auto", fallback: "pi" }`. No modo `auto`, harnesses de plugin registrados podem reivindicar um par provedor/modelo. Se nenhum corresponder, o OpenClaw recorre ao PI.

No modo `auto`, defina `fallback: "none"` quando você precisar que uma seleção ausente de harness de plugin falhe em vez de usar PI. Runtimes de plugin explícitos, como `agentRuntime.id: "codex"`, já falham fechado por padrão, a menos que `fallback: "pi"` seja definido na mesma config ou escopo de substituição de ambiente. Falhas de harness de plugin selecionado sempre falham de forma rígida. Isso não bloqueia um `agentRuntime.id: "pi"` explícito nem `OPENCLAW_AGENT_RUNTIME=pi`.

Para execuções incorporadas somente Codex:

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

Se você quiser que qualquer harness de plugin registrado reivindique modelos correspondentes, mas nunca quiser que o OpenClaw volte silenciosamente para PI, mantenha `runtime: "auto"` e desative o fallback:

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
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
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` ainda substitui o runtime configurado. Use `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para desativar o fallback para PI pelo ambiente.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Com o fallback desativado, uma sessão falha cedo quando o harness solicitado não está registrado, não oferece suporte ao provedor/modelo resolvido ou falha antes de produzir efeitos colaterais de turno. Isso é intencional para implantações somente Codex e para testes ao vivo que precisam provar que o caminho do app-server Codex está realmente em uso.

Esta configuração controla apenas o harness de agente incorporado. Ela não desativa roteamento de modelo específico de provedor para imagem, vídeo, música, TTS, PDF ou outros recursos.

## Sessões nativas e espelho de transcrição

Um harness pode manter um id de sessão nativo, id de thread ou token de retomada do lado do daemon. Mantenha essa associação explicitamente vinculada à sessão do OpenClaw e continue espelhando a saída de assistente/ferramenta visível ao usuário na transcrição do OpenClaw.

A transcrição do OpenClaw continua sendo a camada de compatibilidade para:

- histórico de sessão visível ao canal
- busca e indexação de transcrições
- troca de volta para o harness PI integrado em um turno posterior
- comportamento genérico de `/new`, `/reset` e exclusão de sessão

Se o seu harness armazenar uma associação sidecar, implemente `reset(...)` para que o OpenClaw possa limpá-la quando a sessão do OpenClaw proprietária for redefinida.

## Resultados de ferramenta e mídia

O núcleo constrói a lista de ferramentas do OpenClaw e a passa para a tentativa preparada.
Quando um harness executa uma chamada dinâmica de ferramenta, retorne o resultado da ferramenta por meio
do formato de resultado do harness em vez de enviar mídia do canal por conta própria.

Isso mantém saídas de texto, imagem, vídeo, música, TTS, aprovação e ferramentas de mensagens
no mesmo caminho de entrega das execuções apoiadas por PI.

## Limitações atuais

- O caminho de importação público é genérico, mas alguns aliases de tipo de tentativa/resultado ainda
  carregam nomes `Pi` por compatibilidade.
- A instalação de harness de terceiros é experimental. Prefira plugins de provedor
  até precisar de um runtime de sessão nativo.
- A troca de harness é compatível entre turnos. Não troque harnesses no
  meio de um turno depois que ferramentas nativas, aprovações, texto do assistente ou envios de mensagens
  tiverem começado.

## Relacionado

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview)
- [Auxiliares de runtime](/pt-BR/plugins/sdk-runtime)
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins)
- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
