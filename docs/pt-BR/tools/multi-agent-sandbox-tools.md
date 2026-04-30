---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Ambiente isolado por agente + restrições de ferramentas, precedência e exemplos
title: Sandbox e ferramentas multiagente
x-i18n:
    generated_at: "2026-04-30T10:12:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Cada agente em uma configuração multiagente pode substituir a política global de sandbox e ferramentas. Esta página aborda configuração por agente, regras de precedência e exemplos.

<CardGroup cols={3}>
  <Card title="Isolamento em sandbox" href="/pt-BR/gateway/sandboxing">
    Backends e modos — referência completa de sandbox.
  </Card>
  <Card title="Sandbox vs política de ferramentas vs elevado" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated">
    Depure "por que isto está bloqueado?"
  </Card>
  <Card title="Modo elevado" href="/pt-BR/tools/elevated">
    Exec elevado para remetentes confiáveis.
  </Card>
</CardGroup>

<Warning>
A autenticação tem escopo por agente: cada agente tem seu próprio armazenamento de autenticação `agentDir` em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Nunca reutilize `agentDir` entre agentes. Agentes podem consultar os perfis de autenticação do agente padrão/principal quando não têm um perfil local, mas tokens de atualização OAuth não são clonados para armazenamentos de agentes secundários. Se você copiar credenciais manualmente, copie apenas perfis estáticos portáveis `api_key` ou `token`.
</Warning>

---

## Exemplos de configuração

<AccordionGroup>
  <Accordion title="Exemplo 1: Agente pessoal + familiar restrito">
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
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
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

    - Agente `main`: roda no host, com acesso completo às ferramentas.
    - Agente `family`: roda no Docker (um contêiner por agente), apenas a ferramenta `read`.

  </Accordion>
  <Accordion title="Exemplo 2: Agente de trabalho com sandbox compartilhado">
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
  <Accordion title="Exemplo 2b: Perfil global de codificação + agente apenas de mensagens">
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

    - agentes padrão recebem ferramentas de codificação.
    - o agente `support` é apenas de mensagens (+ ferramenta Slack).

  </Accordion>
  <Accordion title="Exemplo 3: Diferentes modos de sandbox por agente">
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

## Precedência de configuração

Quando existem configurações globais (`agents.defaults.*`) e específicas do agente (`agents.list[].*`):

### Configuração de sandbox

As configurações específicas do agente substituem as globais:

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
`agents.list[].sandbox.{docker,browser,prune}.*` substitui `agents.defaults.sandbox.{docker,browser,prune}.*` para esse agente (ignorado quando o escopo do sandbox resolve para `"shared"`).
</Note>

### Restrições de ferramentas

A ordem de filtragem é:

<Steps>
  <Step title="Perfil de ferramentas">
    `tools.profile` ou `agents.list[].tools.profile`.
  </Step>
  <Step title="Perfil de ferramentas do provedor">
    `tools.byProvider[provider].profile` ou `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Política global de ferramentas">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Política de ferramentas do provedor">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Política de ferramentas específica do agente">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Política de provedor do agente">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Política de ferramentas do sandbox">
    `tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Política de ferramentas de subagente">
    `tools.subagents.tools`, se aplicável.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Regras de precedência">
    - Cada nível pode restringir ainda mais as ferramentas, mas não pode reabilitar ferramentas negadas por níveis anteriores.
    - Se `agents.list[].tools.sandbox.tools` estiver definido, ele substitui `tools.sandbox.tools` para esse agente.
    - Se `agents.list[].tools.profile` estiver definido, ele substitui `tools.profile` para esse agente.
    - Chaves de ferramentas do provedor aceitam `provider` (por exemplo, `google-antigravity`) ou `provider/model` (por exemplo, `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Comportamento de lista de permissões vazia">
    Se qualquer lista de permissões explícita nessa cadeia deixar a execução sem ferramentas chamáveis, o OpenClaw para antes de enviar o prompt ao modelo. Isso é intencional: um agente configurado com uma ferramenta ausente como `agents.list[].tools.allow: ["query_db"]` deve falhar explicitamente até que o Plugin que registra `query_db` esteja habilitado, em vez de continuar como um agente apenas de texto.
  </Accordion>
</AccordionGroup>

Políticas de ferramentas oferecem suporte a atalhos `group:*` que se expandem para várias ferramentas. Consulte [Grupos de ferramentas](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) para ver a lista completa.

Substituições elevadas por agente (`agents.list[].tools.elevated`) podem restringir ainda mais o exec elevado para agentes específicos. Consulte [Modo elevado](/pt-BR/tools/elevated) para detalhes.

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
Configurações legadas `agent.*` são migradas por `openclaw doctor`; prefira `agents.defaults` + `agents.list` daqui em diante.
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
  <Tab title="Execução segura (sem modificações de arquivo)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="Apenas comunicação">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` neste perfil ainda retorna uma visualização de recuperação limitada e sanitizada, em vez de um despejo bruto da transcrição. A recuperação do assistente remove tags de pensamento, estrutura auxiliar `<relevant-memories>`, payloads XML de chamadas de ferramenta em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta), estrutura auxiliar rebaixada de chamadas de ferramenta, tokens de controle de modelo ASCII/largura total vazados e XML de chamadas de ferramenta MiniMax malformado antes da redação/truncamento.

  </Tab>
</Tabs>

---

## Armadilha comum: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` é baseado em `session.mainKey` (padrão `"main"`), não no ID do agente. Sessões de grupo/canal sempre recebem suas próprias chaves, portanto são tratadas como não principais e serão colocadas em sandbox. Se quiser que um agente nunca use sandbox, defina `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Testes

Depois de configurar sandbox e ferramentas multiagente:

<Steps>
  <Step title="Verificar resolução de agentes">
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
    - A configuração específica do agente tem precedência, então defina `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Ferramentas ainda disponíveis apesar da lista de negação">
    - Verifique a ordem de filtragem de ferramentas: global → agente → sandbox → subagente.
    - Cada nível só pode restringir ainda mais, não reabilitar.
    - Verifique com logs: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Contêiner não isolado por agente">
    - Defina `scope: "agent"` na configuração de sandbox específica do agente.
    - O padrão é `"session"`, que cria um contêiner por sessão.

  </Accordion>
</AccordionGroup>

---

## Relacionados

- [Modo elevado](/pt-BR/tools/elevated)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Configuração de sandbox](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs política de ferramentas vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — depurando "por que isto está bloqueado?"
- [Isolamento em sandbox](/pt-BR/gateway/sandboxing) — referência completa de sandbox (modos, escopos, backends, imagens)
- [Gerenciamento de sessões](/pt-BR/concepts/session)
