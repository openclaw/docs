---
read_when:
    - Você está alterando o runtime do agente embutido ou o registro de harnesses
    - Você está registrando um harness de agente a partir de um Plugin agrupado ou confiável
    - Você precisa entender como o Plugin Codex se relaciona com provedores de modelo
sidebarTitle: Agent Harness
summary: Superfície experimental de SDK para Plugins que substituem o executor embutido de baixo nível do agente
title: Plugins de harness de agente
x-i18n:
    generated_at: "2026-04-25T13:51:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: bceb0ccf51431918aec2dfca047af6ed916aa1a8a7c34ca38cb64a14655e4d50
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

Um **harness de agente** é o executor de baixo nível para um turno preparado do agente OpenClaw.
Ele não é um provedor de modelo, nem um canal, nem um registro de ferramentas.
Para o modelo mental voltado ao usuário, consulte [Runtimes de agente](/pt-BR/concepts/agent-runtimes).

Use essa superfície apenas para Plugins nativos agrupados ou confiáveis. O contrato
ainda é experimental porque os tipos de parâmetro intencionalmente espelham o runner
embutido atual.

## Quando usar um harness

Registre um harness de agente quando uma família de modelos tiver seu próprio runtime
nativo de sessão e o transporte normal de provedor do OpenClaw for a abstração errada.

Exemplos:

- um servidor nativo de agente de código que controla threads e Compaction
- uma CLI local ou daemon que precisa transmitir eventos nativos de plano/reasoning/ferramenta
- um runtime de modelo que precisa de seu próprio id de retomada além do
  transcript de sessão do OpenClaw

**Não** registre um harness apenas para adicionar uma nova API de LLM. Para APIs normais de modelo por HTTP ou
WebSocket, crie um [Plugin de provedor](/pt-BR/plugins/sdk-provider-plugins).

## O que o core ainda controla

Antes de um harness ser selecionado, o OpenClaw já resolveu:

- provedor e modelo
- estado de autenticação do runtime
- nível de thinking e orçamento de contexto
- o arquivo de transcript/sessão do OpenClaw
- workspace, sandbox e política de ferramentas
- callbacks de resposta de canal e callbacks de streaming
- fallback de modelo e política de troca ativa de modelo

Essa divisão é intencional. Um harness executa uma tentativa preparada; ele não escolhe
provedores, não substitui a entrega de canal nem troca modelos silenciosamente.

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

1. O id de harness registrado de uma sessão existente prevalece, para que mudanças de config/env não
   troquem em tempo real esse transcript para outro runtime.
2. `OPENCLAW_AGENT_RUNTIME=<id>` força um harness registrado com esse id para
   sessões que ainda não estejam fixadas.
3. `OPENCLAW_AGENT_RUNTIME=pi` força o harness PI integrado.
4. `OPENCLAW_AGENT_RUNTIME=auto` pergunta aos harnesses registrados se eles oferecem suporte ao
   provedor/modelo resolvido.
5. Se nenhum harness registrado corresponder, o OpenClaw usa PI, a menos que o fallback para PI
   esteja desabilitado.

Falhas de harness de Plugin aparecem como falhas de execução. No modo `auto`, o fallback para PI
é usado apenas quando nenhum harness de Plugin registrado oferece suporte ao
provedor/modelo resolvido. Depois que um harness de Plugin assume uma execução, o OpenClaw não
reexecuta esse mesmo turno pelo PI porque isso pode mudar a semântica de autenticação/runtime
ou duplicar efeitos colaterais.

O id do harness selecionado é persistido com o id da sessão após uma execução embutida.
Sessões legadas criadas antes dos pins de harness são tratadas como fixadas em PI quando
têm histórico de transcript. Use uma sessão nova/redefinida ao alternar entre PI e um
harness nativo de Plugin. `/status` mostra ids de harness não padrão como `codex`
ao lado de `Fast`; o PI permanece oculto porque é o caminho padrão de compatibilidade.
Se o harness selecionado parecer inesperado, habilite logging de depuração `agents/harness` e
inspecione o registro estruturado do gateway `agent harness selected`. Ele inclui
o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e, no
modo `auto`, o resultado de suporte de cada candidato de Plugin.

O Plugin Codex agrupado registra `codex` como seu id de harness. O core trata isso
como um id comum de harness de Plugin; aliases específicos do Codex pertencem ao Plugin
ou à configuração do operador, não ao seletor compartilhado de runtime.

## Pareamento entre provedor e harness

A maioria dos harnesses também deve registrar um provedor. O provedor torna
visíveis para o restante do OpenClaw refs de modelo, status de autenticação, metadados de modelo e seleção em `/model`.
O harness então assume esse provedor em `supports(...)`.

O Plugin Codex agrupado segue esse padrão:

- refs de modelo preferenciais para o usuário: `openai/gpt-5.5` mais
  `embeddedHarness.runtime: "codex"`
- refs de compatibilidade: refs legados `codex/gpt-*` continuam aceitos, mas novas
  configs não devem usá-los como refs normais de provedor/modelo
- id do harness: `codex`
- autenticação: disponibilidade sintética do provedor, porque o harness Codex controla o
  login/sessão nativos do Codex
- requisição ao app-server: o OpenClaw envia o id simples do modelo ao Codex e deixa o
  harness falar com o protocolo nativo do app-server

O Plugin Codex é aditivo. Refs simples `openai/gpt-*` continuam usando o
caminho normal de provedor do OpenClaw, a menos que você force o harness Codex com
`embeddedHarness.runtime: "codex"`. Refs antigos `codex/gpt-*` ainda selecionam o
provedor e harness Codex para compatibilidade.

Para configuração do operador, exemplos de prefixo de modelo e configs somente Codex, consulte
[Codex Harness](/pt-BR/plugins/codex-harness).

O OpenClaw exige app-server do Codex `0.118.0` ou mais recente. O Plugin Codex verifica
o handshake de inicialização do app-server e bloqueia servidores mais antigos ou sem versão para que
o OpenClaw só execute contra a superfície de protocolo que foi testada.

### Middleware de resultado de ferramenta

Plugins agrupados podem anexar middleware neutro em relação ao runtime para resultado de ferramenta por meio de
`api.registerAgentToolResultMiddleware(...)` quando seu manifesto declara os
ids de runtime alvo em `contracts.agentToolResultMiddleware`. Essa interface confiável
serve para transformações assíncronas de resultado de ferramenta que precisam ocorrer antes de PI ou Codex
realimentarem a saída da ferramenta ao modelo.

Plugins agrupados legados ainda podem usar
`api.registerCodexAppServerExtensionFactory(...)` para middleware exclusivo do
app-server do Codex, mas novas transformações de resultado devem usar a API neutra em relação ao runtime.
O hook exclusivo de Pi `api.registerEmbeddedExtensionFactory(...)` foi removido;
transformações de resultado de ferramenta no Pi devem usar middleware neutro em relação ao runtime.

### Modo nativo de harness Codex

O harness agrupado `codex` é o modo nativo Codex para turnos embutidos do agente OpenClaw.
Primeiro habilite o Plugin agrupado `codex` e inclua `codex` em
`plugins.allow` se sua configuração usar uma allowlist restritiva. Configs nativas de
app-server devem usar `openai/gpt-*` com `embeddedHarness.runtime: "codex"`.
Use `openai-codex/*` para Codex OAuth via PI. Refs legados de modelo `codex/*`
continuam sendo aliases de compatibilidade para o harness nativo.

Quando esse modo é executado, o Codex controla o id nativo da thread, comportamento de retomada,
Compaction e execução do app-server. O OpenClaw ainda controla o canal de chat,
espelho visível do transcript, política de ferramentas, aprovações, entrega de mídia e seleção
de sessão. Use `embeddedHarness.runtime: "codex"` sem substituição de `fallback`
quando precisar provar que apenas o caminho do app-server do Codex pode assumir a execução.
Runtimes explícitos de Plugin já falham em modo fechado por padrão. Defina `fallback: "pi"`
apenas quando quiser intencionalmente que o PI trate a ausência de seleção de harness. Falhas do
app-server do Codex já falham diretamente em vez de tentar novamente via PI.

## Desabilitar fallback para PI

Por padrão, o OpenClaw executa agentes embutidos com `agents.defaults.embeddedHarness`
definido como `{ runtime: "auto", fallback: "pi" }`. No modo `auto`, harnesses de Plugin registrados
podem assumir um par provedor/modelo. Se nenhum corresponder, o OpenClaw usa PI como fallback.

No modo `auto`, defina `fallback: "none"` quando precisar que a ausência de seleção do harness do Plugin
falhe em vez de usar PI. Runtimes explícitos de Plugin, como
`runtime: "codex"`, já falham em modo fechado por padrão, a menos que `fallback: "pi"` esteja
definido no mesmo escopo de configuração ou substituição de ambiente. Falhas do harness de Plugin
selecionado sempre falham de forma rígida. Isso não bloqueia um `runtime: "pi"` explícito nem
`OPENCLAW_AGENT_RUNTIME=pi`.

Para execuções embutidas somente Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "embeddedHarness": {
        "runtime": "codex"
      }
    }
  }
}
```

Se você quiser que qualquer harness de Plugin registrado assuma modelos correspondentes, mas nunca
quiser que o OpenClaw use PI silenciosamente como fallback, mantenha `runtime: "auto"` e desabilite
o fallback:

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
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` para desabilitar o fallback para PI pelo
ambiente.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Com o fallback desabilitado, uma sessão falha cedo quando o harness solicitado não está
registrado, não oferece suporte ao provedor/modelo resolvido ou falha antes de
produzir efeitos colaterais do turno. Isso é intencional para implantações somente Codex e
para testes live que precisam provar que o caminho do app-server do Codex está realmente em uso.

Essa configuração controla apenas o harness do agente embutido. Ela não desabilita
roteamento específico de provedor para imagem, vídeo, música, TTS, PDF ou outros modelos.

## Sessões nativas e espelho de transcript

Um harness pode manter um id de sessão nativa, id de thread ou token de retomada do lado do daemon.
Mantenha esse vínculo explicitamente associado à sessão do OpenClaw e continue
espelhando a saída visível ao usuário de assistente/ferramenta no transcript do OpenClaw.

O transcript do OpenClaw continua sendo a camada de compatibilidade para:

- histórico de sessão visível ao canal
- busca e indexação de transcript
- alternar de volta para o harness PI integrado em um turno posterior
- comportamento genérico de `/new`, `/reset` e exclusão de sessão

Se o seu harness armazenar um sidecar de vínculo, implemente `reset(...)` para que o OpenClaw possa
limpá-lo quando a sessão correspondente do OpenClaw for redefinida.

## Resultados de ferramenta e mídia

O core constrói a lista de ferramentas do OpenClaw e a passa para a tentativa preparada.
Quando um harness executa uma chamada dinâmica de ferramenta, retorne o resultado da ferramenta pela
forma de resultado do harness em vez de enviar mídia do canal por conta própria.

Isso mantém saídas de texto, imagem, vídeo, música, TTS, aprovação e ferramentas de mensagem
no mesmo caminho de entrega das execuções baseadas em PI.

## Limitações atuais

- O caminho público de importação é genérico, mas alguns aliases de tipo de tentativa/resultado ainda
  carregam nomes `Pi` para compatibilidade.
- A instalação de harness de terceiros é experimental. Prefira Plugins de provedor
  até precisar de um runtime nativo de sessão.
- A troca de harness é compatível entre turnos. Não troque harness no
  meio de um turno depois que ferramentas nativas, aprovações, texto do assistente ou envios
  de mensagem já tiverem começado.

## Relacionado

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview)
- [Helpers de runtime](/pt-BR/plugins/sdk-runtime)
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins)
- [Codex Harness](/pt-BR/plugins/codex-harness)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
