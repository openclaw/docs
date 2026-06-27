---
read_when:
    - Você precisa de um hook ou ferramenta de Plugin para perguntar antes que um efeito colateral seja executado
    - Você precisa configurar onde os prompts de aprovação do Plugin são entregues
    - Você está decidindo entre ferramentas opcionais, aprovações de exec e aprovações de Plugin
sidebarTitle: Permission requests
summary: Solicite que os usuários aprovem chamadas de ferramentas de Plugin e prompts de permissão pertencentes ao Plugin
title: Solicitações de permissão do Plugin
x-i18n:
    generated_at: "2026-06-27T17:50:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

As solicitações de permissão de Plugin permitem que o código do Plugin pause uma chamada de ferramenta ou operação pertencente ao Plugin até que um usuário aprove ou negue. Elas usam o fluxo `plugin.approval.*` do Gateway e as mesmas superfícies de UI de aprovação que lidam com botões de aprovação no chat e comandos `/approve`.

Use solicitações de permissão de Plugin para permissões de Plugin/app. Elas não substituem aprovações de execução do host, listas de permissão opcionais de ferramentas nem a revisão de permissão nativa do Codex.

## Escolha o gate correto

Escolha o gate que corresponde ao ponto de decisão necessário:

| Gate                             | Use quando                                                               | O que ele controla                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Ferramentas opcionais            | Uma ferramenta não deve ficar visível para o modelo até o usuário optar. | Exposição de ferramentas por meio de `tools.allow`.                                                              |
| Solicitações de permissão de Plugin | Um hook de Plugin ou operação pertencente ao Plugin deve perguntar antes de uma ação ser executada. | Aprovação em runtime por meio de `plugin.approval.*`.                                                            |
| Aprovações de execução           | Um comando do host ou ferramenta semelhante a shell precisa de aprovação do operador. | Política de execução do host e listas de permissão duráveis de execução.                                         |
| Solicitações de permissão nativas do Codex | O Codex pergunta antes de ações nativas de shell, arquivo, MCP ou servidor de app. | Tratamento de aprovação de servidor de app ou hook nativo do Codex, roteado por aprovações de Plugin quando o OpenClaw possui o prompt. |
| Elicitações de aprovação MCP     | Um servidor MCP do Codex solicita aprovação para uma chamada de ferramenta. | Respostas de aprovação MCP encaminhadas por aprovações de Plugin do OpenClaw.                                    |

Ferramentas opcionais são um gate em tempo de descoberta. Solicitações de permissão de Plugin são um gate por chamada. Use ambos quando uma ferramenta sensível deve exigir opt-in explícito antes que o modelo possa vê-la e aprovação antes que a ação seja executada.

## Solicite aprovação antes de uma chamada de ferramenta

A maioria dos prompts criados por Plugins deve começar em um hook `before_tool_call`. O hook é executado depois que o modelo seleciona uma ferramenta e antes que o OpenClaw a execute:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Escreva o texto do prompt para a pessoa que aprovará a ação:

- Mantenha `title` curto e focado na ação. O Gateway aceita até 80
  caracteres.
- Mantenha `description` específico e delimitado. O Gateway aceita até 256
  caracteres.
- Inclua a ação, o alvo e o risco. Não inclua segredos, tokens ou
  payloads privados que não devem aparecer nas superfícies de aprovação do chat.
- Use `severity: "critical"` somente para ações em que uma decisão errada poderia
  causar dano em produção ou perda de dados.
- Use `allowedDecisions: ["allow-once", "deny"]` quando a confiança persistente
  não for segura para essa ação.

## Comportamento da decisão

O OpenClaw cria uma aprovação pendente com um ID `plugin:`, entrega-a às
superfícies de aprovação disponíveis e aguarda uma decisão.

| Decisão           | Resultado                                                                 |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | A chamada atual continua.                                                 |
| `allow-always`    | A chamada atual continua e a decisão é passada ao Plugin.                 |
| `deny`            | A chamada é bloqueada com um resultado de ferramenta negado.              |
| Timeout           | A chamada é bloqueada, a menos que `timeoutBehavior` seja `"allow"`.      |
| Cancelamento      | A chamada é bloqueada quando a execução é abortada.                       |
| Sem rota de aprovação | A chamada é bloqueada porque nenhuma superfície de aprovação conectada consegue resolvê-la. |

`allow-always` só é durável quando o Plugin ou runtime solicitante implementa
essa persistência. Para hooks `before_tool_call.requireApproval` comuns,
o OpenClaw trata `allow-once` e `allow-always` como decisões de aprovação para a
chamada atual e passa o valor resolvido para `onResolution`. Se o seu Plugin
oferece `allow-always`, documente e implemente exatamente quais chamadas futuras
ele confia.

Se o hook também retornar `params`, o OpenClaw aplicará essas alterações de parâmetros somente
depois que a aprovação for bem-sucedida. Um hook de prioridade menor ainda pode bloquear depois que um
hook de prioridade maior solicitou aprovação.

`allowedDecisions` limita os botões e comandos exibidos ao usuário. O
Gateway rejeita uma tentativa de resolução para qualquer decisão que a solicitação não ofereceu.

## Rotear prompts de aprovação

Prompts de aprovação podem ser resolvidos em superfícies de UI locais ou em canais de chat que
oferecem suporte ao tratamento de aprovação. Para encaminhar prompts de aprovação de Plugin a alvos de chat
explícitos, configure `approvals.plugin`:

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` é independente de `approvals.exec`. Habilitar o encaminhamento de aprovação de execução
não roteia prompts de aprovação de Plugin, e habilitar o encaminhamento de aprovação de Plugin
não altera a política de execução do host.

Quando um prompt inclui texto de aprovação manual, resolva-o com uma das decisões
oferecidas:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Consulte [Aprovações de execução avançadas](/pt-BR/tools/exec-approvals-advanced#plugin-approval-forwarding)
para ver o modelo completo de encaminhamento, comportamento de aprovação no mesmo chat, entrega nativa por canal
e regras de aprovador específicas por canal.

## Permissões nativas do Codex

Prompts de permissão nativos do Codex também podem trafegar por aprovações de Plugin, mas
têm uma propriedade diferente dos hooks criados por Plugins.

- Solicitações de aprovação do servidor de app do Codex são roteadas pelo OpenClaw após a revisão do Codex.
- O relay de hook nativo `permission_request` pode solicitar por meio de
  `plugin.approval.request` quando esse relay está habilitado.
- Elicitações de aprovação de ferramenta MCP são roteadas por aprovações de Plugin quando o Codex marca
  `_meta.codex_approval_kind` como `"mcp_tool_call"`.

Consulte [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
para o comportamento específico do Codex e as regras de fallback.

## Solução de problemas

**A ferramenta diz que aprovações de Plugin estão indisponíveis.** Nenhuma UI de aprovação ou rota de aprovação configurada
aceitou a solicitação. Conecte um cliente capaz de aprovar, use um
canal que ofereça suporte a `/approve` no mesmo chat ou configure `approvals.plugin`.

**`allow-always` aparece, mas a próxima chamada pede aprovação novamente.** O fluxo genérico de aprovação de Plugin
não persiste automaticamente a confiança para hooks arbitrários. Persista
a confiança pertencente ao Plugin no seu Plugin após `onResolution("allow-always")`, ou
ofereça apenas `allow-once` e `deny`.

**`/approve` rejeita a decisão.** A solicitação restringiu
`allowedDecisions`. Use uma das decisões exibidas no prompt.

**Um prompt do Slack, Discord, Telegram ou Matrix é roteado de forma diferente das aprovações de execução.** Aprovações de Plugin e aprovações de execução usam configurações separadas e podem usar
verificações de autorização diferentes. Verifique `approvals.plugin` e o suporte do canal a
aprovação de Plugin em vez de verificar apenas `approvals.exec`.

## Relacionado

- [Hooks de Plugin](/pt-BR/plugins/hooks#tool-call-policy)
- [Criando Plugins](/pt-BR/plugins/building-plugins#registering-agent-tools)
- [Aprovações de execução avançadas](/pt-BR/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Runtime do harness Codex](/pt-BR/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
