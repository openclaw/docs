---
read_when:
    - Você está alterando o runtime do agente embutido ou o registro de harnesses
    - Você está registrando um harness de agente a partir de um Plugin incluído ou confiável
    - Você precisa entender como o Plugin Codex se relaciona com provedores de modelo
sidebarTitle: Agent Harness
summary: Superfície experimental do SDK para Plugins que substituem o executor embutido de baixo nível do agente
title: Plugins de harness de agente
x-i18n:
    generated_at: "2026-04-24T06:03:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: af76c2a3ebe54c87920954b58126ee59538c0e6d3d1b4ba44890c1f5079fabc2
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Um **harness de agente** é o executor de baixo nível para um turno de agente do OpenClaw já preparado.
Ele não é um provedor de modelo, não é um canal e não é um registro de ferramentas.

Use essa superfície apenas para Plugins nativos incluídos ou confiáveis. O contrato
ainda é experimental porque os tipos de parâmetro espelham intencionalmente o runner embutido atual.

## Quando usar um harness

Registre um harness de agente quando uma família de modelos tiver seu próprio
runtime de sessão nativo e o transporte normal de provedor do OpenClaw for a abstração errada.

Exemplos:

- um servidor nativo de coding-agent que controla threads e Compaction
- uma CLI local ou daemon que precisa transmitir eventos nativos de plano/raciocínio/ferramenta
- um runtime de modelo que precisa de seu próprio ID de retomada além da
  transcrição de sessão do OpenClaw

**Não** registre um harness apenas para adicionar uma nova API de LLM. Para APIs normais de modelo via HTTP ou
WebSocket, crie um [provider plugin](/pt-BR/plugins/sdk-provider-plugins).

## O que o núcleo ainda controla

Antes de um harness ser selecionado, o OpenClaw já resolveu:

- provedor e modelo
- estado de autenticação do runtime
- nível de raciocínio e orçamento de contexto
- a transcrição/arquivo de sessão do OpenClaw
- workspace, sandbox e política de ferramentas
- callbacks de resposta de canal e callbacks de streaming
- política de fallback de modelo e troca de modelo live

Essa divisão é intencional. Um harness executa uma tentativa preparada; ele não escolhe
provedores, não substitui a entrega de canal e não troca modelos silenciosamente.

## Registrar um harness

**Import:** `openclaw/plugin-sdk/agent-harness`

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

1. O ID de harness registrado em uma sessão existente vence, para que mudanças de config/env não
   troquem em hot-switch essa transcrição para outro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` força um harness registrado com esse ID para
   sessões que ainda não estejam fixadas.
3. `OPENCLAW_AGENT_RUNTIME=pi` força o harness PI integrado.
4. `OPENCLAW_AGENT_RUNTIME=auto` pergunta aos harnesses registrados se eles oferecem suporte ao
   provedor/modelo resolvido.
5. Se nenhum harness registrado corresponder, o OpenClaw usa PI, a menos que o fallback de PI esteja
   desativado.

Falhas de harness de Plugin aparecem como falhas de execução. No modo `auto`, o fallback para PI
só é usado quando nenhum harness de Plugin registrado oferece suporte ao
provedor/modelo resolvido. Depois que um harness de Plugin reivindica uma execução, o OpenClaw não
reexecuta esse mesmo turno por PI porque isso pode mudar a semântica de autenticação/runtime
ou duplicar efeitos colaterais.

O ID do harness selecionado é persistido com o ID da sessão após uma execução embutida.
Sessões legadas criadas antes do pin de harness são tratadas como fixadas em PI depois que
passam a ter histórico de transcrição. Use uma nova sessão/reset ao alternar entre PI e um
harness nativo de Plugin. `/status` mostra IDs não padrão de harness, como `codex`,
ao lado de `Fast`; PI permanece oculto porque é o caminho padrão de compatibilidade.
Se o harness selecionado parecer surpreendente, ative logging de depuração `agents/harness` e
inspecione o registro estruturado `agent harness selected` do gateway. Ele inclui
o ID do harness selecionado, o motivo da seleção, a política de runtime/fallback e, no
modo `auto`, o resultado de suporte de cada candidato de Plugin.

O Plugin Codex incluído registra `codex` como seu ID de harness. O núcleo trata isso
como um ID comum de harness de Plugin; aliases específicos de Codex pertencem ao Plugin
ou à configuração do operador, não ao seletor compartilhado de runtime.

## Pareamento de provedor mais harness

A maioria dos harnesses também deve registrar um provedor. O provedor torna refs de modelo,
status de autenticação, metadados de modelo e seleção via `/model` visíveis para o restante do
OpenClaw. O harness então reivindica esse provedor em `supports(...)`.

O Plugin Codex incluído segue esse padrão:

- ID do provedor: `codex`
- refs de modelo do usuário: `openai/gpt-5.5` mais `embeddedHarness.runtime: "codex"`;
  refs legadas `codex/gpt-*` continuam aceitas por compatibilidade
- ID do harness: `codex`
- autenticação: disponibilidade sintética do provedor, porque o harness Codex controla o
  login/sessão nativos do Codex
- solicitação app-server: o OpenClaw envia o ID simples do modelo ao Codex e deixa o
  harness conversar com o protocolo nativo do app-server

O Plugin Codex é aditivo. Refs simples `openai/gpt-*` continuam usando o
caminho normal de provedor do OpenClaw, a menos que você force o harness Codex com
`embeddedHarness.runtime: "codex"`. Refs antigas `codex/gpt-*` ainda selecionam o
provedor e o harness Codex por compatibilidade.

Para configuração de operador, exemplos de prefixo de modelo e configurações exclusivas de Codex, consulte
[Codex Harness](/pt-BR/plugins/codex-harness).

O OpenClaw exige Codex app-server `0.118.0` ou mais recente. O Plugin Codex verifica
o handshake de inicialização do app-server e bloqueia servidores mais antigos ou sem versão para que
o OpenClaw execute apenas contra a superfície de protocolo com a qual foi testado.

### Middleware de tool-result do app-server Codex

Plugins incluídos também podem anexar middleware específico de `tool_result` do app-server Codex por meio de `api.registerCodexAppServerExtensionFactory(...)` quando seu
manifesto declara `contracts.embeddedExtensionFactories: ["codex-app-server"]`.
Essa é a interface de Plugin confiável para transformações assíncronas de resultado de ferramenta que precisam
ser executadas dentro do harness nativo do Codex antes que a saída da ferramenta seja projetada de volta
na transcrição do OpenClaw.

### Modo de harness nativo Codex

O harness `codex` incluído é o modo nativo Codex para turnos de agente embutido do OpenClaw.
Ative primeiro o Plugin `codex` incluído e inclua `codex` em
`plugins.allow` se sua configuração usar uma allowlist restritiva. Configurações nativas de app-server devem usar `openai/gpt-*` com `embeddedHarness.runtime: "codex"`.
Use `openai-codex/*` para OAuth Codex via PI. Refs legadas de modelo `codex/*`
continuam como aliases de compatibilidade para o harness nativo.

Quando esse modo é executado, o Codex controla o ID nativo da thread, o comportamento de retomada,
a Compaction e a execução do app-server. O OpenClaw ainda controla o canal de chat,
o espelho visível da transcrição, a política de ferramentas, aprovações, entrega de mídia e a
seleção da sessão. Use `embeddedHarness.runtime: "codex"` com
`embeddedHarness.fallback: "none"` quando precisar comprovar que apenas o caminho do app-server
Codex pode reivindicar a execução. Essa configuração é apenas uma proteção de seleção:
falhas do app-server Codex já falham diretamente em vez de tentar novamente via PI.

## Desativar fallback para PI

Por padrão, o OpenClaw executa agentes embutidos com `agents.defaults.embeddedHarness`
definido como `{ runtime: "auto", fallback: "pi" }`. No modo `auto`, harnesses de Plugin registrados
podem reivindicar um par provedor/modelo. Se nenhum corresponder, o OpenClaw recorre ao PI.

Defina `fallback: "none"` quando precisar que a ausência de seleção de harness de Plugin falhe
em vez de usar PI. Falhas de harness de Plugin selecionado já falham de forma rígida. Isso
não bloqueia `runtime: "pi"` explícito nem `OPENCLAW_AGENT_RUNTIME=pi`.

Para execuções embutidas exclusivas de Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Se você quiser que qualquer harness de Plugin registrado reivindique modelos correspondentes, mas nunca quiser que o OpenClaw recaia silenciosamente em PI, mantenha `runtime: "auto"` e desative o fallback:

```json
{
  "agents": {
    "defaults": {
      "embeddedHarness": {
        "runtime": "auto",
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
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "embeddedHarness": {
          "runtime": "codex",
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
registrado, não oferece suporte ao provedor/modelo resolvido ou falha antes de
produzir efeitos colaterais de turno. Isso é intencional para implantações exclusivas de Codex e
para testes live que precisam comprovar que o caminho do app-server Codex está realmente em uso.

Essa configuração controla apenas o harness do agente embutido. Ela não desativa
roteamento específico de provedor para imagem, vídeo, música, TTS, PDF ou outros modelos.

## Sessões nativas e espelho da transcrição

Um harness pode manter um ID de sessão nativo, ID de thread ou token de retomada do lado do daemon.
Mantenha esse vínculo explicitamente associado à sessão do OpenClaw e continue
espelhando a saída visível ao usuário de assistente/ferramenta na transcrição do OpenClaw.

A transcrição do OpenClaw continua sendo a camada de compatibilidade para:

- histórico de sessão visível no canal
- busca e indexação de transcrição
- troca de volta para o harness PI integrado em um turno posterior
- comportamento genérico de `/new`, `/reset` e exclusão de sessão

Se o seu harness armazenar um vínculo sidecar, implemente `reset(...)` para que o OpenClaw possa
limpá-lo quando a sessão proprietária do OpenClaw for redefinida.

## Resultados de ferramenta e mídia

O núcleo constrói a lista de ferramentas do OpenClaw e a passa para a tentativa preparada.
Quando um harness executa uma chamada dinâmica de ferramenta, devolva o resultado da ferramenta
pela forma de resultado do harness em vez de enviar mídia de canal por conta própria.

Isso mantém texto, imagem, vídeo, música, TTS, aprovação e saídas da ferramenta de mensagens
no mesmo caminho de entrega das execuções com PI.

## Limitações atuais

- O caminho público de importação é genérico, mas alguns aliases de tipo de tentativa/resultado ainda
  carregam nomes `Pi` por compatibilidade.
- A instalação de harness de terceiros é experimental. Prefira Plugins de provedor
  até precisar de um runtime de sessão nativo.
- A troca de harness é compatível entre turnos. Não troque de harness no
  meio de um turno depois que ferramentas nativas, aprovações, texto do assistente ou envios de
  mensagem já tiverem começado.

## Relacionado

- [SDK Overview](/pt-BR/plugins/sdk-overview)
- [Runtime Helpers](/pt-BR/plugins/sdk-runtime)
- [Provider Plugins](/pt-BR/plugins/sdk-provider-plugins)
- [Codex Harness](/pt-BR/plugins/codex-harness)
- [Model Providers](/pt-BR/concepts/model-providers)
