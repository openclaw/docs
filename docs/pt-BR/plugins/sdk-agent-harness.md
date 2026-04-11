---
read_when:
    - Você está alterando o runtime de agente incorporado ou o registro de harnesses
    - Você está registrando um harness de agente a partir de um plugin empacotado ou confiável
    - Você precisa entender como o plugin Codex se relaciona com provedores de modelo
sidebarTitle: Agent Harness
summary: Superfície experimental do SDK para plugins que substituem o executor de agente incorporado de baixo nível
title: Plugins de Harness de Agente
x-i18n:
    generated_at: "2026-04-11T02:46:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43c1f2c087230398b0162ed98449f239c8db1e822e51c7dcd40c54fa6c3374e1
    source_path: plugins/sdk-agent-harness.md
    workflow: 15
---

# Plugins de Harness de Agente

Um **harness de agente** é o executor de baixo nível para um turno preparado de agente do OpenClaw.
Ele não é um provedor de modelo, não é um canal e não é um registro de ferramentas.

Use esta superfície apenas para plugins nativos empacotados ou confiáveis. O contrato
ainda é experimental porque os tipos de parâmetro espelham intencionalmente o runner incorporado atual.

## Quando usar um harness

Registre um harness de agente quando uma família de modelos tiver seu próprio runtime
nativo de sessão e o transporte normal de provedor do OpenClaw for a abstração errada.

Exemplos:

- um servidor nativo de agente de codificação que controla threads e compactação
- uma CLI local ou daemon que precisa transmitir eventos nativos de plano/raciocínio/ferramenta
- um runtime de modelo que precisa de seu próprio id de retomada além da transcrição
  de sessão do OpenClaw

**Não** registre um harness apenas para adicionar uma nova API de LLM. Para APIs normais de modelo
via HTTP ou WebSocket, crie um [plugin de provedor](/pt-BR/plugins/sdk-provider-plugins).

## O que o core ainda controla

Antes de um harness ser selecionado, o OpenClaw já resolveu:

- provedor e modelo
- estado de autenticação do runtime
- nível de raciocínio e orçamento de contexto
- a transcrição/arquivo de sessão do OpenClaw
- workspace, sandbox e política de ferramentas
- callbacks de resposta do canal e callbacks de streaming
- política de fallback de modelo e troca de modelo ao vivo

Essa separação é intencional. Um harness executa uma tentativa preparada; ele não escolhe
provedores, não substitui a entrega de canal e não troca modelos silenciosamente.

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
    // params.onAgentEvent e os outros campos da tentativa preparada.
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "Meu Agente Nativo",
  description: "Executa modelos selecionados por meio de um daemon nativo de agente.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## Política de seleção

O OpenClaw escolhe um harness após a resolução de provedor/modelo:

1. `OPENCLAW_AGENT_RUNTIME=<id>` força um harness registrado com esse id.
2. `OPENCLAW_AGENT_RUNTIME=pi` força o harness PI incorporado.
3. `OPENCLAW_AGENT_RUNTIME=auto` pergunta aos harnesses registrados se eles oferecem suporte ao
   provedor/modelo resolvido.
4. Se nenhum harness registrado corresponder, o OpenClaw usa PI, a menos que o fallback para PI
   esteja desabilitado.

Falhas em harnesses de plugin forçados aparecem como falhas de execução. No modo `auto`,
o OpenClaw pode recorrer ao PI quando o harness de plugin selecionado falha antes de um
turno produzir efeitos colaterais. Defina `OPENCLAW_AGENT_HARNESS_FALLBACK=none` ou
`embeddedHarness.fallback: "none"` para transformar esse fallback em falha definitiva.

O plugin Codex empacotado registra `codex` como seu id de harness. O core trata isso
como um id comum de harness de plugin; aliases específicos do Codex pertencem ao plugin
ou à configuração do operador, não ao seletor de runtime compartilhado.

## Pareamento de provedor e harness

A maioria dos harnesses também deve registrar um provedor. O provedor torna referências de modelo,
status de autenticação, metadados de modelo e seleção em `/model` visíveis para o restante do
OpenClaw. O harness então reivindica esse provedor em `supports(...)`.

O plugin Codex empacotado segue este padrão:

- id do provedor: `codex`
- referências de modelo do usuário: `codex/gpt-5.4`, `codex/gpt-5.2` ou outro modelo retornado
  pelo servidor de app do Codex
- id do harness: `codex`
- autenticação: disponibilidade sintética do provedor, porque o harness Codex controla o
  login/sessão nativos do Codex
- solicitação ao servidor de app: o OpenClaw envia o id simples do modelo ao Codex e deixa o
  harness conversar com o protocolo nativo do servidor de app

O plugin Codex é aditivo. Referências simples `openai/gpt-*` continuam sendo referências do provedor OpenAI
e continuam usando o caminho normal de provedor do OpenClaw. Selecione `codex/gpt-*`
quando quiser autenticação gerenciada pelo Codex, descoberta de modelos do Codex, threads nativas e
execução via servidor de app do Codex. `/model` pode alternar entre os modelos do Codex retornados
pelo servidor de app do Codex sem exigir credenciais do provedor OpenAI.

Para configuração do operador, exemplos de prefixo de modelo e configs exclusivas do Codex, consulte
[Harness Codex](/pt-BR/plugins/codex-harness).

O OpenClaw exige Codex app-server `0.118.0` ou mais recente. O plugin Codex verifica o handshake
de inicialização do servidor de app e bloqueia servidores antigos ou sem versão para que o
OpenClaw só execute sobre a superfície de protocolo com a qual foi testado.

## Desabilitar fallback para PI

Por padrão, o OpenClaw executa agentes incorporados com `agents.defaults.embeddedHarness`
definido como `{ runtime: "auto", fallback: "pi" }`. No modo `auto`, harnesses de plugin registrados
podem reivindicar um par provedor/modelo. Se nenhum corresponder, ou se um harness de plugin
selecionado automaticamente falhar antes de produzir saída, o OpenClaw recorre ao PI.

Defina `fallback: "none"` quando você precisar provar que um harness de plugin é o único
runtime sendo exercitado. Isso desabilita o fallback automático para PI; não bloqueia
um `runtime: "pi"` explícito nem `OPENCLAW_AGENT_RUNTIME=pi`.

Para execuções incorporadas somente com Codex:

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
      }
    }
  }
}
```

Se você quiser que qualquer harness de plugin registrado reivindique modelos correspondentes, mas nunca
quiser que o OpenClaw recorra silenciosamente ao PI, mantenha `runtime: "auto"` e desabilite
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
        "model": "codex/gpt-5.4",
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
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` para desabilitar o fallback para PI a partir do
ambiente.

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Com o fallback desabilitado, uma sessão falha cedo quando o harness solicitado não está
registrado, não oferece suporte ao provedor/modelo resolvido ou falha antes de
produzir efeitos colaterais no turno. Isso é intencional para implantações somente com Codex e
para testes ao vivo que precisam provar que o caminho do servidor de app do Codex está realmente em uso.

Essa configuração controla apenas o harness de agente incorporado. Ela não desabilita
roteamento específico de modelo para imagem, vídeo, música, TTS, PDF ou outros provedores.

## Sessões nativas e espelho da transcrição

Um harness pode manter um id de sessão nativa, id de thread ou token de retomada do lado do daemon.
Mantenha esse vínculo explicitamente associado à sessão do OpenClaw e continue
espelhando saída visível ao usuário do assistente/ferramenta na transcrição do OpenClaw.

A transcrição do OpenClaw continua sendo a camada de compatibilidade para:

- histórico de sessão visível no canal
- busca e indexação da transcrição
- troca de volta para o harness PI incorporado em um turno posterior
- comportamento genérico de `/new`, `/reset` e exclusão de sessão

Se o seu harness armazenar um vínculo sidecar, implemente `reset(...)` para que o OpenClaw possa
limpá-lo quando a sessão proprietária do OpenClaw for redefinida.

## Resultados de ferramenta e mídia

O core constrói a lista de ferramentas do OpenClaw e a passa para a tentativa preparada.
Quando um harness executa uma chamada dinâmica de ferramenta, retorne o resultado da ferramenta por meio
do formato de resultado do harness em vez de enviar mídia do canal por conta própria.

Isso mantém texto, imagem, vídeo, música, TTS, aprovação e saídas de ferramentas de mensagem
no mesmo caminho de entrega das execuções com suporte de PI.

## Limitações atuais

- O caminho público de importação é genérico, mas alguns aliases de tipo de tentativa/resultado ainda
  carregam nomes `Pi` por compatibilidade.
- A instalação de harnesses de terceiros é experimental. Prefira plugins de provedor
  até precisar de um runtime nativo de sessão.
- A troca de harness é compatível entre turnos. Não troque de harness no
  meio de um turno depois que ferramentas nativas, aprovações, texto do assistente ou envios de mensagem já tiverem começado.

## Relacionado

- [Visão geral do SDK](/pt-BR/plugins/sdk-overview)
- [Helpers de Runtime](/pt-BR/plugins/sdk-runtime)
- [Plugins de Provedor](/pt-BR/plugins/sdk-provider-plugins)
- [Harness Codex](/pt-BR/plugins/codex-harness)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
