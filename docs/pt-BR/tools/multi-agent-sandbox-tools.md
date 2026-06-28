---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Ambiente isolado + restrições de ferramentas por agente, precedência e exemplos
title: Sandbox e ferramentas multiagente
x-i18n:
    generated_at: "2026-05-11T20:37:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Cada agente em uma configuração multiagente pode substituir a sandbox global e a política de ferramentas. Esta página aborda a configuração por agente, as regras de precedência e exemplos.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/pt-BR/gateway/sandboxing">
    Backends e modos — referência completa de sandbox.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated">
    Depure "por que isto está bloqueado?"
  </Card>
  <Card title="Elevated mode" href="/pt-BR/tools/elevated">
    Execução elevada para remetentes confiáveis.
  </Card>
</CardGroup>

<Warning>
A autenticação é escopada por agente: cada agente tem seu próprio armazenamento de autenticação `agentDir` em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Nunca reutilize `agentDir` entre agentes. Agentes podem ler os perfis de autenticação do agente padrão/principal quando não têm um perfil local, mas tokens de atualização OAuth não são clonados para armazenamentos de agentes secundários. Se você copiar credenciais manualmente, copie apenas perfis `api_key` ou `token` estáticos portáveis.
</Warning>

---

## Exemplos de configuração

<AccordionGroup>
  <Accordion title="Example 1: Personal + restricted family agent">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "name": "Personal Assistant",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "Family Bot",
            "workspace": "~/.openclaw/workspace-family",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read", "message"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"],
              "message": {
                "crossContext": {
                  "allowWithinProvider": false,
                  "allowAcrossProviders": false
                }
              }
            }
          }
        ]
      },
      "bindings": [
        {
          "agentId": "family",
          "match": {
            "provider": "whatsapp",
            "accountId": "*",
            "peer": {
              "kind": "group",
              "id": "120363424282127706@g.us"
            }
          }
        }
      ]
    }
    ```

    **Resultado:**

    - agente `main`: executa no host, com acesso completo às ferramentas.
    - agente `family`: executa no Docker (um contêiner por agente), apenas `read` e envios de mensagem na conversa atual.

  </Accordion>
  <Accordion title="Example 2: Work agent with shared sandbox">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "personal",
            "workspace": "~/.openclaw/workspace-personal",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "work",
            "workspace": "~/.openclaw/workspace-work",
            "sandbox": {
              "mode": "all",
              "scope": "shared",
              "workspaceRoot": "/tmp/work-sandboxes"
            },
            "tools": {
              "allow": ["read", "write", "apply_patch", "exec"],
              "deny": ["browser", "gateway", "discord"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="Example 2b: Global coding profile + messaging-only agent">
    ```json
    {
      "tools": { "profile": "coding" },
      "agents": {
        "list": [
          {
            "id": "support",
            "tools": { "profile": "messaging", "allow": ["slack"] }
          }
        ]
      }
    }
    ```

    **Resultado:**

    - agentes padrão recebem ferramentas de programação.
    - o agente `support` é somente para mensagens (+ ferramenta Slack).

  </Accordion>
  <Accordion title="Example 3: Different sandbox modes per agent">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

---

## Precedência da configuração

Quando existem configurações globais (`agents.defaults.*`) e específicas de agente (`agents.list[].*`):

### Configuração de sandbox

As configurações específicas de agente substituem as globais:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` substitui `agents.defaults.sandbox.{docker,browser,prune}.*` para esse agente (ignorado quando o escopo da sandbox resolve para `"shared"`).
</Note>

### Restrições de ferramentas

A ordem de filtragem é:

<Steps>
  <Step title="Tool profile">
    `tools.profile` ou `agents.list[].tools.profile`.
  </Step>
  <Step title="Provider tool profile">
    `tools.byProvider[provider].profile` ou `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Global tool policy">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Provider tool policy">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Agent-specific tool policy">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Agent provider policy">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox tool policy">
    `tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Subagent tool policy">
    `tools.subagents.tools`, se aplicável.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Precedence rules">
    - Cada nível pode restringir ainda mais as ferramentas, mas não pode conceder novamente ferramentas negadas em níveis anteriores.
    - Se `agents.list[].tools.sandbox.tools` estiver definido, ele substitui `tools.sandbox.tools` para esse agente.
    - Se `agents.list[].tools.profile` estiver definido, ele substitui `tools.profile` para esse agente.
    - Chaves de ferramentas de provedor aceitam `provider` (por exemplo, `google-antigravity`) ou `provider/model` (por exemplo, `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Empty allowlist behavior">
    Se qualquer lista de permissões explícita nessa cadeia deixar a execução sem ferramentas chamáveis, o OpenClaw para antes de enviar o prompt ao modelo. Isso é intencional: um agente configurado com uma ferramenta ausente, como `agents.list[].tools.allow: ["query_db"]`, deve falhar de forma clara até que o plugin que registra `query_db` seja habilitado, em vez de continuar como um agente apenas de texto.
  </Accordion>
</AccordionGroup>

Políticas de ferramentas oferecem suporte a abreviações `group:*`, que se expandem para várias ferramentas. Consulte [Grupos de ferramentas](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) para ver a lista completa.

Substituições elevadas por agente (`agents.list[].tools.elevated`) podem restringir ainda mais a execução elevada para agentes específicos. Consulte [Modo elevado](/pt-BR/tools/elevated) para obter detalhes.

---

## Migração de agente único

<Tabs>
  <Tab title="Antes (agente único)">
    ```json
    {
      "agents": {
        "defaults": {
          "workspace": "~/.openclaw/workspace",
          "sandbox": {
            "mode": "non-main"
          }
        }
      },
      "tools": {
        "sandbox": {
          "tools": {
            "allow": ["read", "write", "apply_patch", "exec"],
            "deny": []
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="Depois (multiagente)">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
Configurações legadas `agent.*` são migradas pelo `openclaw doctor`; prefira `agents.defaults` + `agents.list` daqui em diante.
</Note>

---

## Exemplos de restrição de ferramentas

<Tabs>
  <Tab title="Agente somente leitura">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Execução de shell com ferramentas do sistema de arquivos desabilitadas">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Esta política desabilita as ferramentas de sistema de arquivos do OpenClaw, mas `exec` ainda é um shell e pode gravar arquivos onde quer que o host ou o sistema de arquivos de sandbox selecionado permita. Para um agente somente leitura, negue `exec` e `process`, ou combine acesso ao shell com controles de sistema de arquivos da sandbox, como `agents.defaults.sandbox.workspaceAccess: "ro"` ou `"none"`.
    </Warning>

  </Tab>
  <Tab title="Somente comunicação">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` neste perfil ainda retorna uma visualização de recuperação limitada e sanitizada, em vez de um despejo bruto de transcrição. A recuperação do assistente remove tags de pensamento, estrutura `<relevant-memories>`, payloads XML de chamadas de ferramentas em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramentas), estrutura de chamadas de ferramentas rebaixada, tokens vazados de controle do modelo em ASCII/largura total e XML malformado de chamadas de ferramentas do MiniMax antes da redação/truncamento.

  </Tab>
</Tabs>

---

## Armadilha comum: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` é baseado em `session.mainKey` (padrão `"main"`), não no id do agente. Sessões de grupo/canal sempre recebem suas próprias chaves, portanto são tratadas como não principais e serão colocadas em sandbox. Se você quiser que um agente nunca use sandbox, defina `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Testes

Depois de configurar sandbox e ferramentas multiagente:

<Steps>
  <Step title="Verificar a resolução de agentes">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verificar contêineres de sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Testar restrições de ferramentas">
    - Envie uma mensagem que exija ferramentas restritas.
    - Verifique se o agente não consegue usar ferramentas negadas.

  </Step>
  <Step title="Monitorar logs">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Solução de problemas

<AccordionGroup>
  <Accordion title="Agente não está em sandbox apesar de `mode: 'all'`">
    - Verifique se há um `agents.defaults.sandbox.mode` global que o substitui.
    - A configuração específica do agente tem precedência, portanto defina `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Ferramentas ainda disponíveis apesar da lista de negação">
    - Verifique a ordem de filtragem de ferramentas: global → agente → sandbox → subagente.
    - Cada nível só pode restringir ainda mais, não conceder de volta.
    - Verifique com os logs: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Contêiner não isolado por agente">
    - Defina `scope: "agent"` na configuração de sandbox específica do agente.
    - O padrão é `"session"`, que cria um contêiner por sessão.

  </Accordion>
</AccordionGroup>

---

## Relacionado

- [Modo elevado](/pt-BR/tools/elevated)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Configuração de sandbox](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs política de ferramentas vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — depuração de "por que isso está bloqueado?"
- [Sandboxing](/pt-BR/gateway/sandboxing) — referência completa de sandbox (modos, escopos, backends, imagens)
- [Gerenciamento de sessão](/pt-BR/concepts/session)
