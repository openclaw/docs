---
read_when:
    - Você está alterando o runtime embutido do agente ou o registro de harnesses
    - Você está registrando um harness de agente a partir de um Plugin incluído ou confiável
    - Você precisa entender como o plugin Codex se relaciona com providers de modelo
sidebarTitle: Agent Harness
summary: Superfície experimental de SDK para Plugins que substituem o executor embutido de baixo nível do agente
title: Plugins de harness de agente
x-i18n:
    generated_at: "2026-04-26T11:34:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 340fc6207dabc6ffe7ffb9c07ca9e80e76f1034d4978c41279dc826468302181
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Um **harness de agente** é o executor de baixo nível de um turno preparado de agente do OpenClaw. Ele não é um provider de modelo, nem um canal, nem um registro de ferramentas.
Para o modelo mental voltado ao usuário, veja [Runtimes de agente](/pt-BR/concepts/agent-runtimes).

Use essa superfície apenas para Plugins nativos incluídos ou confiáveis. O contrato
ainda é experimental porque os tipos de parâmetro espelham intencionalmente o runner embutido atual.

## Quando usar um harness

Registre um harness de agente quando uma família de modelos tiver seu próprio runtime
nativo de sessão e o transporte normal de provider do OpenClaw for a abstração errada.

Exemplos:

- um servidor nativo de agente de codificação que controla threads e compaction
- uma CLI local ou daemon que precisa transmitir eventos nativos de plano/raciocínio/ferramenta
- um runtime de modelo que precisa do próprio resume id além da
  transcrição de sessão do OpenClaw

**Não** registre um harness apenas para adicionar uma nova API de LLM. Para APIs normais
de modelo via HTTP ou WebSocket, crie um [Plugin de provider](/pt-BR/plugins/sdk-provider-plugins).

## O que o core ainda controla

Antes de um harness ser selecionado, o OpenClaw já resolveu:

- provider e modelo
- estado de auth do runtime
- nível de thinking e orçamento de contexto
- a transcrição/arquivo de sessão do OpenClaw
- workspace, sandbox e política de ferramentas
- callbacks de resposta de canal e callbacks de streaming
- política de fallback de modelo e troca dinâmica de modelo

Essa divisão é intencional. Um harness executa uma tentativa preparada; ele não escolhe
providers, não substitui a entrega de canal e não troca modelos silenciosamente.

A tentativa preparada também inclui `params.runtimePlan`, um pacote de políticas
controlado pelo OpenClaw para decisões de runtime que precisam permanecer compartilhadas entre PI e
harnesses nativos:

- `runtimePlan.tools.normalize(...)` e
  `runtimePlan.tools.logDiagnostics(...)` para política de schema de ferramenta sensível a provider
- `runtimePlan.transcript.resolvePolicy(...)` para política de sanitização de transcrição e
  reparo de chamada de ferramenta
- `runtimePlan.delivery.isSilentPayload(...)` para supressão compartilhada de entrega
  `NO_REPLY` e de mídia
- `runtimePlan.outcome.classifyRunResult(...)` para classificação de fallback de modelo
- `runtimePlan.observability` para metadados resolvidos de provider/modelo/harness

Harnesses podem usar o plano para decisões que precisam corresponder ao comportamento do PI,
mas ainda devem tratá-lo como estado de tentativa controlado pelo host. Não o modifique e não o use para
trocar providers/modelos dentro de um turno.

## Registrar um harness

**Import:** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "Meu harness nativo de agente",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // Inicie ou retome sua thread nativa.
    // Use params.prompt, params.tools, params.images, params.onPartialReply,
    // params.onAgentEvent e os demais campos da tentativa preparada.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Meu agente nativo",
  description: "Executa modelos selecionados por meio de um daemon nativo de agente.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Política de seleção

O OpenClaw escolhe um harness após a resolução de provider/modelo:

1. O id do harness registrado de uma sessão existente vence, para que mudanças de config/env não
   troquem em tempo real aquela transcrição para outro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` força um harness registrado com esse id para
   sessões que ainda não estão fixadas.
3. `OPENCLAW_AGENT_RUNTIME=pi` força o harness PI integrado.
4. `OPENCLAW_AGENT_RUNTIME=auto` pergunta aos harnesses registrados se eles oferecem suporte ao
   provider/modelo resolvido.
5. Se nenhum harness registrado corresponder, o OpenClaw usa PI, a menos que o fallback para PI esteja
   desativado.

Falhas de harness de Plugin aparecem como falhas de execução. No modo `auto`, o fallback para PI
é usado apenas quando nenhum harness de Plugin registrado oferece suporte ao
provider/modelo resolvido. Depois que um harness de Plugin reivindica uma execução, o OpenClaw não
reproduz esse mesmo turno pelo PI porque isso pode mudar semântica de auth/runtime
ou duplicar efeitos colaterais.

O id do harness selecionado é persistido com o id da sessão após uma execução embutida.
Sessões legadas criadas antes de pins de harness são tratadas como fixadas em PI assim que
têm histórico de transcrição. Use uma nova sessão/redefinição ao mudar entre PI e um
harness nativo de Plugin. `/status` mostra ids de harness não padrão, como `codex`,
ao lado de `Fast`; PI permanece oculto porque é o caminho de compatibilidade padrão.
Se o harness selecionado for surpreendente, ative o log de depuração `agents/harness` e
inspecione o registro estruturado do gateway `agent harness selected`. Ele inclui
o id do harness selecionado, motivo da seleção, política de runtime/fallback e, no
modo `auto`, o resultado de suporte de cada candidato de Plugin.

O plugin Codex incluído registra `codex` como id de seu harness. O core trata isso
como um id comum de harness de Plugin; aliases específicos de Codex pertencem ao Plugin
ou à config do operador, não ao seletor compartilhado de runtime.

## Pareamento provider + harness

A maioria dos harnesses também deve registrar um provider. O provider torna refs de modelo,
estado de auth, metadados de modelo e seleção `/model` visíveis ao restante do
OpenClaw. O harness então reivindica esse provider em `supports(...)`.

O plugin Codex incluído segue esse padrão:

- refs de modelo preferidas pelo usuário: `openai/gpt-5.5` mais
  `agentRuntime.id: "codex"`
- refs de compatibilidade: refs legadas `codex/gpt-*` continuam aceitas, mas novas
  configs não devem usá-las como refs normais de provider/modelo
- id do harness: `codex`
- auth: disponibilidade sintética de provider, porque o harness Codex controla o
  login/sessão nativos do Codex
- requisição do app-server: o OpenClaw envia o id bruto do modelo ao Codex e deixa o
  harness falar com o protocolo nativo do app-server

O plugin Codex é aditivo. Refs simples `openai/gpt-*` continuam usando o
caminho normal de provider do OpenClaw, a menos que você force o harness Codex com
`agentRuntime.id: "codex"`. Refs antigas `codex/gpt-*` ainda selecionam o
provider e harness Codex por compatibilidade.

Para configuração de operador, exemplos de prefixo de modelo e configs exclusivas do Codex, veja
[Harness Codex](/pt-BR/plugins/codex-harness).

O OpenClaw exige app-server Codex `0.125.0` ou mais recente. O plugin Codex verifica
o handshake de inicialização do app-server e bloqueia servidores mais antigos ou sem versão, para que
o OpenClaw só execute contra a superfície de protocolo com a qual foi testado. O
limite `0.125.0` inclui suporte nativo a payload de hook MCP que chegou no
Codex `0.124.0`, ao mesmo tempo em que fixa o OpenClaw na linha estável mais nova testada.

### Middleware de resultado de ferramenta

Plugins incluídos podem anexar middleware neutro de resultado de ferramenta em runtime por meio de
`api.registerAgentToolResultMiddleware(...)` quando seu manifesto declara os
ids de runtime alvo em `contracts.agentToolResultMiddleware`. Esse seam confiável
serve para transformações assíncronas de resultado de ferramenta que precisam ser executadas antes que PI ou Codex devolvam
a saída da ferramenta ao modelo.

Plugins incluídos legados ainda podem usar
`api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo do app-server Codex, mas
novas transformações de resultado devem usar a API neutra de runtime.
O hook exclusivo do Pi `api.registerEmbeddedExtensionFactory(...)` foi removido;
transformações de resultado de ferramenta do Pi devem usar middleware neutro de runtime.

### Classificação de resultado terminal

Harnesses nativos que controlam sua própria projeção de protocolo podem usar
`classifyAgentHarnessTerminalOutcome(...)` de
`openclaw/plugin-sdk/agent-harness-runtime` quando um turno concluído não produz
texto visível do assistente. O helper retorna `empty`, `reasoning-only` ou
`planning-only` para que a política de fallback do OpenClaw possa decidir se deve
repetir com outro modelo. Ele intencionalmente deixa erros de prompt, turnos em andamento
e respostas silenciosas intencionais como `NO_REPLY` sem classificação.

### Modo de harness nativo Codex

O harness `codex` incluído é o modo nativo Codex para turnos embutidos de
agente do OpenClaw. Primeiro ative o plugin `codex` incluído e inclua `codex` em
`plugins.allow` se sua config usar uma allowlist restritiva. Configs nativas de app-server
devem usar `openai/gpt-*` com `agentRuntime.id: "codex"`.
Use `openai-codex/*` para OAuth Codex por meio do PI. Refs legadas de modelo `codex/*`
continuam como aliases de compatibilidade para o harness nativo.

Quando esse modo é executado, o Codex controla o id nativo da thread, comportamento de retomada,
compaction e execução do app-server. O OpenClaw ainda controla o canal de chat,
espelho de transcrição visível, política de ferramentas, aprovações, entrega de mídia e
seleção de sessão. Use `agentRuntime.id: "codex"` sem substituição de `fallback`
quando você precisar provar que apenas o caminho do app-server Codex pode reivindicar a execução.
Runtimes explícitos de Plugin já falham em modo fail-closed por padrão. Defina `fallback: "pi"`
apenas quando quiser intencionalmente que o PI trate a ausência de seleção de harness. Falhas do
app-server Codex já falham diretamente em vez de tentar novamente pelo PI.

## Desativar fallback para PI

Por padrão, o OpenClaw executa agentes embutidos com `agents.defaults.agentRuntime`
definido como `{ id: "auto", fallback: "pi" }`. No modo `auto`, harnesses registrados
de Plugin podem reivindicar um par provider/modelo. Se nenhum corresponder, o OpenClaw usa PI como fallback.

No modo `auto`, defina `fallback: "none"` quando você precisar que a ausência de seleção
de harness de Plugin falhe em vez de usar PI. Runtimes explícitos de Plugin, como
`runtime: "codex"`, já falham em modo fail-closed por padrão, a menos que `fallback: "pi"` esteja
definido no mesmo escopo de config ou substituição de ambiente. Falhas de harness de Plugin selecionado
sempre falham de forma rígida. Isso não bloqueia `runtime: "pi"` explícito nem
`OPENCLAW_AGENT_RUNTIME=pi`.

Para execuções embutidas exclusivas do Codex:

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

Se você quiser que qualquer harness de Plugin registrado reivindique modelos compatíveis, mas nunca
quiser que o OpenClaw faça fallback silencioso para PI, mantenha `runtime: "auto"` e desative
o fallback:

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

`OPENCLAW_AGENT_RUNTIME` ainda substitui o runtime configurado. Use
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` para desativar o fallback para PI a partir do
ambiente.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Com o fallback desativado, uma sessão falha cedo quando o harness solicitado não está
registrado, não oferece suporte ao provider/modelo resolvido ou falha antes de
produzir efeitos colaterais do turno. Isso é intencional para implantações exclusivas de Codex e
para testes ao vivo que precisam provar que o caminho do app-server Codex está realmente em uso.

Essa configuração controla apenas o harness embutido do agente. Ela não desativa
roteamento específico de provider para imagem, vídeo, música, TTS, PDF ou outros modelos.

## Sessões nativas e espelho de transcrição

Um harness pode manter um id nativo de sessão, id de thread ou token de retomada do lado do daemon.
Mantenha esse binding explicitamente associado à sessão do OpenClaw e continue
espelhando a saída visível de assistente/ferramenta na transcrição do OpenClaw.

A transcrição do OpenClaw continua sendo a camada de compatibilidade para:

- histórico de sessão visível no canal
- pesquisa e indexação de transcrição
- troca de volta para o harness PI integrado em um turno posterior
- comportamento genérico de `/new`, `/reset` e exclusão de sessão

Se o seu harness armazenar um binding sidecar, implemente `reset(...)` para que o OpenClaw possa
limpá-lo quando a sessão proprietária do OpenClaw for redefinida.

## Resultados de ferramenta e mídia

O core constrói a lista de ferramentas do OpenClaw e a passa para a tentativa preparada.
Quando um harness executa uma chamada dinâmica de ferramenta, retorne o resultado da ferramenta pelo
formato de resultado do harness em vez de enviar mídia de canal diretamente.

Isso mantém saídas de texto, imagem, vídeo, música, TTS, aprovação e ferramentas de mensagens
no mesmo caminho de entrega que execuções baseadas em PI.

## Limitações atuais

- O caminho público de import é genérico, mas alguns aliases de tipo de tentativa/resultado ainda
  carregam nomes `Pi` por compatibilidade.
- A instalação de harness de terceiros é experimental. Prefira Plugins de provider
  até precisar de um runtime nativo de sessão.
- A troca de harness é compatível entre turnos. Não troque harnesses no
  meio de um turno depois que ferramentas nativas, aprovações, texto do assistente ou envios de
  mensagem tiverem começado.

## Relacionados

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview)
- [Helpers de runtime](/pt-BR/plugins/sdk-runtime)
- [Plugins de provider](/pt-BR/plugins/sdk-provider-plugins)
- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Providers de modelo](/pt-BR/concepts/model-providers)
