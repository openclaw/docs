---
read_when:
    - Você precisa de um hook ou uma ferramenta de Plugin para solicitar confirmação antes que um efeito colateral seja executado
    - Você precisa configurar onde as solicitações de aprovação de plugins são entregues
    - Você está decidindo entre ferramentas opcionais, aprovações de execução e aprovações de plugins
sidebarTitle: Permission requests
summary: Solicite aos usuários que aprovem chamadas de ferramentas de plugins e solicitações de permissão controladas por plugins
title: Solicitações de permissão do Plugin
x-i18n:
    generated_at: "2026-07-12T15:26:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

As solicitações de permissão de plugins permitem que o código do plugin pause uma chamada de ferramenta ou uma operação pertencente ao plugin até que um usuário a aprove ou negue. Elas usam o fluxo `plugin.approval.*` do Gateway e as mesmas superfícies de interface de aprovação que processam botões de aprovação no chat e comandos `/approve`.

Use solicitações de permissão de plugins para permissões de plugins/aplicativos. Elas não substituem aprovações de execução no host, listas de permissões opcionais de ferramentas nem a análise de permissões nativa do Codex.

## Escolha o controle correto

Escolha o controle correspondente ao ponto de decisão necessário:

| Controle                              | Use quando                                                                            | O que ele controla                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Ferramentas opcionais                 | Uma ferramenta não deve ficar visível para o modelo até que o usuário concorde.       | Exposição de ferramentas por meio de `tools.allow`.                                                                             |
| Solicitações de permissão de plugins  | Um hook de plugin ou uma operação pertencente ao plugin precisa solicitar autorização antes de executar uma ação. | Aprovação em tempo de execução por meio de `plugin.approval.*`.                                                                 |
| Aprovações de execução                | Um comando do host ou uma ferramenta semelhante a um shell precisa da aprovação do operador. | Política de execução do host e listas duráveis de permissões de execução.                                                       |
| Solicitações de permissão nativas do Codex | O Codex solicita autorização antes de ações nativas de shell, arquivo, MCP ou servidor de aplicativos. | Tratamento de aprovações do servidor de aplicativos ou de hooks nativos do Codex, encaminhado por aprovações de plugins quando o OpenClaw controla a solicitação. |
| Solicitações de aprovação do MCP      | Um servidor MCP do Codex solicita aprovação para uma chamada de ferramenta.           | Respostas de aprovação do MCP interligadas por meio das aprovações de plugins do OpenClaw.                                      |

As ferramentas opcionais são um controle no momento da descoberta. As solicitações de permissão de plugins são um controle por chamada. Use ambos quando uma ferramenta sensível precisar de consentimento explícito antes de o modelo poder vê-la e de aprovação antes de a ação ser executada.

## Solicite aprovação antes de uma chamada de ferramenta

A maioria das solicitações criadas por plugins deve começar em um hook `before_tool_call`. O hook é executado após o modelo selecionar uma ferramenta e antes de o OpenClaw executá-la:

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
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Escreva o texto da solicitação para a pessoa que aprovará a ação:

- Mantenha `title` curto e focado na ação; o Gateway limita seu tamanho a 80 caracteres.
- Mantenha `description` específico e delimitado; o Gateway limita seu tamanho a 512 caracteres.
- Inclua a ação, o destino e o risco. Não inclua segredos, tokens nem cargas privadas que não devam aparecer nas superfícies de aprovação do chat.
- Quando omitido, `severity` usa `"warning"` como padrão. Use `"critical"` somente para ações nas quais uma decisão incorreta possa causar danos à produção ou perda de dados.
- Quando omitido, `allowedDecisions` usa `["allow-once", "allow-always", "deny"]` como padrão. Passe `["allow-once", "deny"]` quando a confiança persistente não for segura para essa ação.
- `timeoutMs` usa 120000 (2 minutos) como padrão e é limitado a 600000 (10 minutos), independentemente do valor solicitado.

## Comportamento das decisões

O OpenClaw cria uma aprovação pendente com um ID `plugin:`, envia-a às superfícies de aprovação disponíveis e aguarda uma decisão.

| Decisão           | Resultado                                                                 |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | A chamada atual continua.                                                 |
| `allow-always`    | A chamada atual continua, e a decisão é repassada ao plugin.              |
| `deny`            | A chamada é bloqueada com um resultado de ferramenta negado.              |
| Tempo limite      | A chamada é bloqueada.                                                    |
| Cancelamento      | A chamada é bloqueada quando a execução é abortada.                       |
| Sem rota de aprovação | A chamada é bloqueada porque nenhuma superfície de aprovação conectada pode resolvê-la. |

Somente as decisões exatas `allow-once` e `allow-always` permitidas pela solicitação autorizam a execução. Decisões desconhecidas, malformadas, incompatíveis, ausentes ou com tempo limite esgotado causam uma falha fechada. O campo legado `timeoutBehavior` continua sendo aceito para compatibilidade com plugins, mas está obsoleto e é ignorado; não o defina em novos hooks.

`allow-always` só é durável quando o plugin ou runtime solicitante implementa essa persistência. Para hooks comuns `before_tool_call.requireApproval`, o OpenClaw trata `allow-once` e `allow-always` como decisões de aprovação para a chamada atual e repassa o valor resolvido para `onResolution`. Se o seu plugin oferecer `allow-always`, documente e implemente exatamente quais chamadas futuras ele considera confiáveis.

Se o hook também retornar `params`, o OpenClaw aplicará essas alterações de parâmetros somente depois que a aprovação for bem-sucedida. Um hook de prioridade mais baixa ainda poderá bloquear a ação após um hook de prioridade mais alta solicitar aprovação.

`allowedDecisions` limita os botões e comandos exibidos ao usuário. O Gateway rejeita qualquer tentativa de resolução com uma decisão que não tenha sido oferecida pela solicitação.

## Encaminhe solicitações de aprovação

As solicitações de aprovação podem ser resolvidas em superfícies de interface locais ou em canais de chat compatíveis com o tratamento de aprovações. Para encaminhar solicitações de aprovação de plugins a destinos explícitos de chat, configure `approvals.plugin`:

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

`approvals.plugin` é independente de `approvals.exec`. Habilitar o encaminhamento de aprovações de execução não encaminha solicitações de aprovação de plugins, e habilitar o encaminhamento de aprovações de plugins não altera a política de execução do host.

Quando uma solicitação incluir texto de aprovação manual, resolva-a com uma das decisões oferecidas:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Consulte [Aprovações avançadas de execução](/pt-BR/tools/exec-approvals-advanced#plugin-approval-forwarding) para ver o modelo completo de encaminhamento, o comportamento de aprovação no mesmo chat, a entrega nativa por canais e as regras de aprovadores específicas de cada canal.

## Permissões nativas do Codex

As solicitações de permissão nativas do Codex também podem passar por aprovações de plugins, mas têm uma propriedade diferente dos hooks criados por plugins.

- As solicitações de aprovação do servidor de aplicativos do Codex são encaminhadas pelo OpenClaw após a análise do Codex.
- O retransmissor do hook nativo `permission_request` pode solicitar autorização por meio de `plugin.approval.request` quando esse retransmissor está habilitado.
- As solicitações de aprovação de ferramentas MCP são encaminhadas pelas aprovações de plugins quando o Codex marca `_meta.codex_approval_kind` como `"mcp_tool_call"`.

Consulte [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations) para ver o comportamento específico do Codex e as regras de fallback.

## Solução de problemas

**A ferramenta informa que as aprovações de plugins não estão disponíveis.** Nenhuma interface de aprovação nem rota de aprovação configurada aceitou a solicitação. Conecte um cliente compatível com aprovações, use um canal compatível com `/approve` no mesmo chat ou configure `approvals.plugin`.

**`allow-always` aparece, mas a chamada seguinte solicita aprovação novamente.** O fluxo genérico de aprovação de plugins não persiste automaticamente a confiança para hooks arbitrários. Persista no seu plugin a confiança pertencente ao plugin após `onResolution("allow-always")` ou ofereça somente `allow-once` e `deny`.

**`/approve` rejeita a decisão.** A solicitação restringiu `allowedDecisions`. Use uma das decisões exibidas na solicitação.

**Uma solicitação do Discord, Matrix, Slack ou Telegram é encaminhada de modo diferente das aprovações de execução.** As aprovações de plugins e as aprovações de execução usam configurações separadas e podem usar verificações de autorização diferentes. Verifique `approvals.plugin` e a compatibilidade do canal com aprovações de plugins, em vez de verificar somente `approvals.exec`.

## Relacionados

- [Hooks de plugins](/pt-BR/plugins/hooks#tool-call-policy)
- [Criação de plugins](/pt-BR/plugins/building-plugins#registering-tools)
- [Aprovações avançadas de execução](/pt-BR/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
