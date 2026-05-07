---
read_when:
    - Você está alterando o ambiente de execução de agente incorporado ou o registro do ambiente de teste
    - Você está registrando um mecanismo de agente de um plugin incluído ou confiável
    - Você precisa entender como o Plugin do Codex se relaciona com provedores de modelo
sidebarTitle: Agent Harness
summary: Superfície experimental do SDK para plugins que substituem o executor de agente embutido de baixo nível
title: Plugins do ambiente de execução de agentes
x-i18n:
    generated_at: "2026-05-07T13:22:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab47fbedbd429a4c0e72da0057a88be34528b69804fa1e7af795f377c4907f55
    source_path: plugins/sdk-agent-harness.md
    workflow: 16
---

Um **harness de agente** é o executor de baixo nível para uma rodada preparada de agente do OpenClaw. Ele não é um provedor de modelo, não é um canal e não é um registro de ferramentas. Para o modelo mental voltado ao usuário, consulte [Runtimes de agente](/pt-BR/concepts/agent-runtimes).

Use esta superfície apenas para plugins nativos agrupados ou confiáveis. O contrato ainda é experimental porque os tipos de parâmetros espelham intencionalmente o runner embarcado atual.

## Quando usar um harness

Registre um harness de agente quando uma família de modelos tiver seu próprio runtime de sessão nativo e o transporte normal de provedor do OpenClaw for a abstração incorreta.

Exemplos:

- um servidor de agente de codificação nativo que possui threads e Compaction
- uma CLI local ou daemon que precisa transmitir eventos nativos de plano/raciocínio/ferramenta
- um runtime de modelo que precisa de seu próprio ID de retomada além da transcrição de sessão do OpenClaw

**Não** registre um harness apenas para adicionar uma nova API de LLM. Para APIs de modelo HTTP ou WebSocket normais, crie um [plugin de provedor](/pt-BR/plugins/sdk-provider-plugins).

## O que o core ainda controla

Antes que um harness seja selecionado, o OpenClaw já resolveu:

- provedor e modelo
- estado de autenticação do runtime
- nível de raciocínio e orçamento de contexto
- o arquivo de transcrição/sessão do OpenClaw
- workspace, sandbox e política de ferramentas
- callbacks de resposta de canal e callbacks de streaming
- fallback de modelo e política de troca de modelo ao vivo

Essa divisão é intencional. Um harness executa uma tentativa preparada; ele não escolhe provedores, substitui a entrega de canal nem troca modelos silenciosamente.

A tentativa preparada também inclui `params.runtimePlan`, um pacote de políticas controlado pelo OpenClaw para decisões de runtime que devem permanecer compartilhadas entre PI e harnesses nativos:

- `runtimePlan.tools.normalize(...)` e
  `runtimePlan.tools.logDiagnostics(...)` para política de esquema de ferramenta ciente do provedor
- `runtimePlan.transcript.resolvePolicy(...)` para sanitização de transcrição e política de reparo de chamada de ferramenta
- `runtimePlan.delivery.isSilentPayload(...)` para supressão compartilhada de `NO_REPLY` e entrega de mídia
- `runtimePlan.outcome.classifyRunResult(...)` para classificação de fallback de modelo
- `runtimePlan.observability` para metadados resolvidos de provedor/modelo/harness

Harnesses podem usar o plano para decisões que precisam corresponder ao comportamento de PI, mas ainda devem tratá-lo como estado de tentativa controlado pelo host. Não o modifique nem o use para trocar provedores/modelos dentro de uma rodada.

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

1. O ID de harness registrado de uma sessão existente tem precedência, para que alterações de configuração/ambiente não troquem essa transcrição para outro runtime a quente.
2. `OPENCLAW_AGENT_RUNTIME=<id>` força um harness registrado com esse ID para sessões que ainda não estão fixadas.
3. `OPENCLAW_AGENT_RUNTIME=pi` força o harness PI integrado.
4. `OPENCLAW_AGENT_RUNTIME=auto` pergunta aos harnesses registrados se eles dão suporte ao provedor/modelo resolvido.
5. Se nenhum harness registrado corresponder, o OpenClaw usa PI, a menos que o fallback para PI esteja desabilitado.

Falhas de harness de Plugin aparecem como falhas de execução. No modo `auto`, o fallback para PI só é usado quando nenhum harness de Plugin registrado dá suporte ao provedor/modelo resolvido. Depois que um harness de Plugin reivindica uma execução, o OpenClaw não reexecuta essa mesma rodada por PI porque isso pode alterar a semântica de autenticação/runtime ou duplicar efeitos colaterais.

O ID do harness selecionado é persistido com o ID da sessão após uma execução embarcada. Sessões legadas criadas antes das fixações de harness são tratadas como fixadas em PI assim que têm histórico de transcrição. Use uma sessão nova/redefinida ao alternar entre PI e um harness de Plugin nativo. `/status` mostra IDs de harness não padrão, como `codex`, ao lado de `Fast`; PI permanece oculto porque é o caminho de compatibilidade padrão. Se o harness selecionado surpreender, habilite o log de depuração `agents/harness` e inspecione o registro estruturado `agent harness selected` do Gateway. Ele inclui o ID do harness selecionado, o motivo da seleção, a política de runtime/fallback e, no modo `auto`, o resultado de suporte de cada candidato de Plugin.

O Plugin Codex agrupado registra `codex` como seu ID de harness. O core trata isso como um ID comum de harness de Plugin; aliases específicos do Codex pertencem ao Plugin ou à configuração do operador, não ao seletor de runtime compartilhado.

## Pareamento de provedor e harness

A maioria dos harnesses também deve registrar um provedor. O provedor torna referências de modelo, status de autenticação, metadados de modelo e seleção por `/model` visíveis ao restante do OpenClaw. Em seguida, o harness reivindica esse provedor em `supports(...)`.

O Plugin Codex agrupado segue este padrão:

- referências de modelo preferenciais do usuário: `openai/gpt-5.5` mais
  `agentRuntime.id: "codex"`
- referências de compatibilidade: referências legadas `codex/gpt-*` continuam aceitas, mas novas configurações não devem usá-las como referências normais de provedor/modelo
- ID de harness: `codex`
- autenticação: disponibilidade de provedor sintética, porque o harness Codex controla o login/sessão nativo do Codex
- solicitação do app-server: o OpenClaw envia o ID de modelo simples ao Codex e deixa o harness falar com o protocolo nativo do app-server

O Plugin Codex é aditivo. Referências simples `openai/gpt-*` continuam usando o caminho normal de provedor do OpenClaw, a menos que você force o harness Codex com `agentRuntime.id: "codex"`. Referências antigas `codex/gpt-*` ainda selecionam o provedor e o harness Codex por compatibilidade.

Para configuração de operador, exemplos de prefixo de modelo e configurações exclusivas do Codex, consulte [Harness Codex](/pt-BR/plugins/codex-harness).

O OpenClaw exige app-server Codex `0.125.0` ou mais recente. O Plugin Codex verifica o handshake de inicialização do app-server e bloqueia servidores mais antigos ou sem versão, para que o OpenClaw execute apenas contra a superfície de protocolo com a qual foi testado. O piso `0.125.0` inclui o suporte nativo a payloads de hook MCP que chegou no Codex `0.124.0`, enquanto fixa o OpenClaw na linha estável testada mais recente.

### Middleware de resultado de ferramenta

Plugins agrupados podem anexar middleware de resultado de ferramenta neutro em relação ao runtime por meio de `api.registerAgentToolResultMiddleware(...)` quando seu manifesto declara os IDs de runtime alvo em `contracts.agentToolResultMiddleware`. Essa superfície confiável é para transformações assíncronas de resultado de ferramenta que devem rodar antes de PI ou Codex devolverem a saída da ferramenta ao modelo.

Plugins agrupados legados ainda podem usar `api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo do app-server Codex, mas novas transformações de resultado devem usar a API neutra em relação ao runtime. O hook exclusivo de Pi `api.registerEmbeddedExtensionFactory(...)` foi removido; transformações de resultado de ferramenta de Pi devem usar middleware neutro em relação ao runtime.

### Classificação de resultado terminal

Harnesses nativos que controlam sua própria projeção de protocolo podem usar `classifyAgentHarnessTerminalOutcome(...)` de `openclaw/plugin-sdk/agent-harness-runtime` quando uma rodada concluída não produziu texto visível do assistente. O helper retorna `empty`, `reasoning-only` ou `planning-only` para que a política de fallback do OpenClaw possa decidir se deve tentar novamente em um modelo diferente. Ele intencionalmente deixa sem classificação erros de prompt, rodadas em andamento e respostas silenciosas intencionais como `NO_REPLY`.

### Modo de harness Codex nativo

O harness `codex` agrupado é o modo Codex nativo para rodadas embarcadas de agente do OpenClaw. Habilite primeiro o Plugin `codex` agrupado e inclua `codex` em `plugins.allow` se sua configuração usar uma lista de permissões restritiva. Configurações de app-server nativas devem usar `openai/gpt-*`; rodadas de agente OpenAI selecionam o harness Codex por padrão. Rotas legadas `openai-codex/*` devem ser reparadas com `openclaw doctor --fix`, e referências de modelo legadas `codex/*` continuam sendo aliases de compatibilidade para o harness nativo.

Quando esse modo roda, o Codex controla o ID de thread nativo, o comportamento de retomada, a Compaction e a execução do app-server. O OpenClaw ainda controla o canal de chat, o espelho de transcrição visível, a política de ferramentas, aprovações, entrega de mídia e seleção de sessão. Use `agentRuntime.id: "codex"` quando precisar provar que apenas o caminho do app-server Codex pode reivindicar a execução. Runtimes de Plugin explícitos falham de forma fechada; falhas de seleção do app-server Codex e falhas de runtime não são retentadas por PI.

## Rigor de runtime

Por padrão, o OpenClaw executa agentes embarcados com OpenClaw Pi. No modo `auto`, harnesses de Plugin registrados podem reivindicar um par provedor/modelo, e PI cuida da rodada quando nenhum corresponde. Use um runtime de Plugin explícito, como `agentRuntime.id: "codex"`, quando a ausência de seleção de harness deve falhar em vez de rotear por PI. Falhas de harness de Plugin selecionado sempre falham de forma definitiva. Isso não bloqueia um `agentRuntime.id: "pi"` explícito nem `OPENCLAW_AGENT_RUNTIME=pi`.

Para execuções embarcadas exclusivas do Codex:

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

Se quiser que qualquer harness de Plugin registrado reivindique modelos correspondentes e, caso contrário, use PI, defina `id: "auto"`:

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

Com um runtime de Plugin explícito, uma sessão falha cedo quando o harness solicitado não está registrado, não dá suporte ao provedor/modelo resolvido ou falha antes de produzir efeitos colaterais de rodada. Isso é intencional para implantações exclusivas do Codex e para testes ao vivo que precisam provar que o caminho do app-server Codex está realmente em uso.

Esta configuração controla apenas o harness de agente embarcado. Ela não desabilita roteamento de modelo específico de provedor para imagem, vídeo, música, TTS, PDF ou outros.

## Sessões nativas e espelho de transcrição

Um harness pode manter um ID de sessão nativo, ID de thread ou token de retomada do lado do daemon. Mantenha essa vinculação explicitamente associada à sessão do OpenClaw e continue espelhando a saída de assistente/ferramenta visível ao usuário na transcrição do OpenClaw.

A transcrição do OpenClaw continua sendo a camada de compatibilidade para:

- histórico de sessão visível no canal
- busca e indexação de transcrição
- troca de volta para o harness PI integrado em uma rodada posterior
- comportamento genérico de `/new`, `/reset` e exclusão de sessão

Se seu harness armazenar uma vinculação sidecar, implemente `reset(...)` para que o OpenClaw possa limpá-la quando a sessão OpenClaw proprietária for redefinida.

## Resultados de ferramenta e mídia

O core constrói a lista de ferramentas do OpenClaw e a passa para a tentativa preparada. Quando um harness executa uma chamada dinâmica de ferramenta, retorne o resultado da ferramenta pelo formato de resultado do harness em vez de enviar mídia de canal você mesmo.

Isso mantém saídas de texto, imagem, vídeo, música, TTS, aprovação e ferramenta de mensagens no mesmo caminho de entrega das execuções baseadas em PI.

## Limitações atuais

- O caminho público de importação é genérico, mas alguns aliases de tipo de tentativa/resultado ainda
  carregam nomes `Pi` por compatibilidade.
- A instalação de harness de terceiros é experimental. Prefira plugins de provedor
  até precisar de um runtime de sessão nativo.
- A troca de harness é compatível entre turnos. Não troque de harness no
  meio de um turno depois que ferramentas nativas, aprovações, texto do assistente ou envios de
  mensagem tiverem começado.

## Relacionados

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview)
- [Auxiliares de runtime](/pt-BR/plugins/sdk-runtime)
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins)
- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
