---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox por agente + restrições de ferramentas, precedência e exemplos
title: Sandbox e ferramentas para múltiplos agentes
x-i18n:
    generated_at: "2026-04-26T11:39:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

Cada agente em uma configuração com múltiplos agentes pode substituir a política global de sandbox e ferramentas. Esta página cobre configuração por agente, regras de precedência e exemplos.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/pt-BR/gateway/sandboxing">
    Backends e modos — referência completa de sandbox.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated">
    Depure "por que isso está bloqueado?"
  </Card>
  <Card title="Elevated mode" href="/pt-BR/tools/elevated">
    Execução elevada para remetentes confiáveis.
  </Card>
</CardGroup>

<Warning>
A autenticação é por agente: cada agente lê do seu próprio armazenamento de autenticação `agentDir` em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. As credenciais **não** são compartilhadas entre agentes. Nunca reutilize `agentDir` entre agentes. Se quiser compartilhar credenciais, copie `auth-profiles.json` para o `agentDir` do outro agente.
</Warning>

---

## Exemplos de configuração

<AccordionGroup>
  <Accordion title="Exemplo 1: agente pessoal + agente familiar restrito">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "name": "Assistente Pessoal",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "Bot da Família",
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

    - agente `main`: executa no host, acesso completo às ferramentas.
    - agente `family`: executa no Docker (um contêiner por agente), somente a ferramenta `read`.

  </Accordion>
  <Accordion title="Exemplo 2: agente de trabalho com sandbox compartilhado">
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
  <Accordion title="Exemplo 2b: perfil global de coding + agente somente para mensagens">
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

    - agentes padrão recebem ferramentas de coding.
    - o agente `support` é somente para mensagens (+ ferramenta Slack).

  </Accordion>
  <Accordion title="Exemplo 3: modos de sandbox diferentes por agente">
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

Quando existem configs globais (`agents.defaults.*`) e específicas de agente (`agents.list[].*`):

### Config de sandbox

Configurações específicas de agente substituem as globais:

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
`agents.list[].sandbox.{docker,browser,prune}.*` substitui `agents.defaults.sandbox.{docker,browser,prune}.*` para esse agente (ignorado quando o escopo do sandbox é resolvido para `"shared"`).
</Note>

### Restrições de ferramentas

A ordem de filtragem é:

<Steps>
  <Step title="Perfil de ferramentas">
    `tools.profile` ou `agents.list[].tools.profile`.
  </Step>
  <Step title="Perfil de ferramentas do provider">
    `tools.byProvider[provider].profile` ou `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Política global de ferramentas">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Política de ferramentas do provider">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Política de ferramentas específica do agente">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Política de provider do agente">
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
    - Cada nível pode restringir ainda mais as ferramentas, mas não pode restaurar ferramentas negadas em níveis anteriores.
    - Se `agents.list[].tools.sandbox.tools` estiver definido, ele substitui `tools.sandbox.tools` para esse agente.
    - Se `agents.list[].tools.profile` estiver definido, ele substitui `tools.profile` para esse agente.
    - Chaves de ferramentas de provider aceitam tanto `provider` (por exemplo `google-antigravity`) quanto `provider/model` (por exemplo `openai/gpt-5.4`).
  </Accordion>
  <Accordion title="Comportamento de allowlist vazia">
    Se qualquer allowlist explícita nessa cadeia fizer com que a execução fique sem ferramentas chamáveis, o OpenClaw interrompe antes de enviar o prompt ao modelo. Isso é intencional: um agente configurado com uma ferramenta ausente, como `agents.list[].tools.allow: ["query_db"]`, deve falhar explicitamente até que o plugin que registra `query_db` seja habilitado, e não continuar como um agente somente de texto.
  </Accordion>
</AccordionGroup>

As políticas de ferramentas aceitam atalhos `group:*` que se expandem para várias ferramentas. Consulte [Grupos de ferramentas](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) para a lista completa.

Substituições elevadas por agente (`agents.list[].tools.elevated`) podem restringir ainda mais a execução elevada para agentes específicos. Consulte [Elevated mode](/pt-BR/tools/elevated) para detalhes.

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
  <Tab title="Depois (múltiplos agentes)">
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
Configs legadas `agent.*` são migradas por `openclaw doctor`; daqui para frente, prefira `agents.defaults` + `agents.list`.
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

    `sessions_history` nesse perfil ainda retorna uma visualização de recuperação limitada e sanitizada, em vez de um dump bruto da transcrição. A recuperação do assistente remove tags de thinking, scaffolding de `<relevant-memories>`, payloads XML em texto simples de chamadas de ferramenta (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramenta), scaffolding de chamadas de ferramenta rebaixado, tokens de controle de modelo ASCII/full-width vazados e XML malformado de chamadas de ferramenta do MiniMax antes de redaction/truncation.

  </Tab>
</Tabs>

---

## Armadilha comum: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` é baseado em `session.mainKey` (padrão `"main"`), não no ID do agente. Sessões de grupo/canal sempre recebem suas próprias chaves, então são tratadas como non-main e serão colocadas em sandbox. Se você quiser que um agente nunca use sandbox, defina `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Testes

Depois de configurar sandbox e ferramentas para múltiplos agentes:

<Steps>
  <Step title="Verificar a resolução do agente">
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
  <Accordion title="Agente sem sandbox apesar de `mode: 'all'`">
    - Verifique se há um `agents.defaults.sandbox.mode` global que o substitui.
    - A config específica do agente tem precedência, então defina `agents.list[].sandbox.mode: "all"`.
  </Accordion>
  <Accordion title="Ferramentas ainda disponíveis apesar da lista deny">
    - Verifique a ordem de filtragem de ferramentas: global → agente → sandbox → subagente.
    - Cada nível só pode restringir mais, não restaurar permissões.
    - Verifique nos logs: `[tools] filtering tools for agent:${agentId}`.
  </Accordion>
  <Accordion title="Contêiner não isolado por agente">
    - Defina `scope: "agent"` na config de sandbox específica do agente.
    - O padrão é `"session"`, que cria um contêiner por sessão.
  </Accordion>
</AccordionGroup>

---

## Relacionado

- [Elevated mode](/pt-BR/tools/elevated)
- [Roteamento de múltiplos agentes](/pt-BR/concepts/multi-agent)
- [Configuração de sandbox](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs política de ferramentas vs modo elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — depuração de "por que isso está bloqueado?"
- [Sandboxing](/pt-BR/gateway/sandboxing) — referência completa de sandbox (modos, escopos, backends, imagens)
- [Gerenciamento de sessão](/pt-BR/concepts/session)
