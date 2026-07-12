---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox por agente + restrições de ferramentas, precedência e exemplos
title: Sandbox e ferramentas multiagente
x-i18n:
    generated_at: "2026-07-12T00:28:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Cada agente em uma configuração multiagente pode substituir a política global de sandbox e ferramentas. Esta página aborda a configuração por agente, as regras de precedência e exemplos.

<CardGroup cols={3}>
  <Card title="Isolamento em sandbox" href="/pt-BR/gateway/sandboxing">
    Backends e modos — referência completa de sandbox.
  </Card>
  <Card title="Sandbox vs. política de ferramentas vs. modo elevado" href="/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated">
    Depure "por que isso está bloqueado?"
  </Card>
  <Card title="Modo elevado" href="/pt-BR/tools/elevated">
    Execução elevada para remetentes confiáveis.
  </Card>
</CardGroup>

<Warning>
A autenticação tem escopo por agente: cada agente tem seu próprio armazenamento de autenticação `agentDir` em `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Nunca reutilize o `agentDir` entre agentes. Os agentes podem consultar os perfis de autenticação do agente padrão/principal quando não têm um perfil local, mas os tokens de atualização OAuth não são clonados para os armazenamentos dos agentes secundários. Se você copiar credenciais manualmente, copie somente perfis estáticos portáteis de `api_key` ou `token`.
</Warning>

---

## Exemplos de configuração

<AccordionGroup>
  <Accordion title="Exemplo 1: Agente pessoal + agente familiar restrito">
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

    - Agente `main`: é executado no host, com acesso completo às ferramentas.
    - Agente `family`: é executado no Docker (um contêiner por agente), somente com `read` e envio de mensagens na conversa atual.

  </Accordion>
  <Accordion title="Exemplo 2: Agente de trabalho com sandbox compartilhada">
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
  <Accordion title="Exemplo 2b: Perfil global de programação + agente somente para mensagens">
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

    - Os agentes padrão recebem ferramentas de programação.
    - O agente `support` é somente para mensagens (+ ferramenta do Slack).

  </Accordion>
  <Accordion title="Exemplo 3: Modos de sandbox diferentes por agente">
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

Quando existem configurações globais (`agents.defaults.*`) e específicas do agente (`agents.list[].*`):

### Configuração da sandbox

As configurações específicas do agente substituem as globais:

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` substitui `agents.defaults.sandbox.{docker,browser,prune}.*` para esse agente (é ignorado quando o escopo da sandbox é resolvido como `"shared"`).
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
  <Step title="Política de ferramentas da sandbox">
    `tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Política de ferramentas de subagentes">
    `tools.subagents.tools`, se aplicável.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Regras de precedência">
    - Cada nível pode restringir ainda mais as ferramentas, mas não pode conceder novamente ferramentas negadas em níveis anteriores.
    - Se `agents.list[].tools.sandbox.tools` estiver definido, ele substituirá `tools.sandbox.tools` para esse agente.
    - Se `agents.list[].tools.profile` estiver definido, ele substituirá `tools.profile` para esse agente.
    - As chaves de ferramentas do provedor aceitam `provider` (por exemplo, `google-antigravity`) ou `provider/model` (por exemplo, `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Comportamento de uma lista de permissões vazia">
    Se qualquer lista de permissões explícita nessa cadeia deixar a execução sem ferramentas que possam ser chamadas, o OpenClaw interromperá o processo antes de enviar o prompt ao modelo. Isso é intencional: um agente configurado com uma ferramenta ausente, como `agents.list[].tools.allow: ["query_db"]`, deve falhar de forma explícita até que o Plugin que registra `query_db` seja habilitado, em vez de continuar como um agente somente de texto.
  </Accordion>
</AccordionGroup>

As políticas de ferramentas aceitam abreviações `group:*` que se expandem para várias ferramentas. Consulte [Grupos de ferramentas](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) para ver a lista completa.

As substituições de modo elevado por agente (`agents.list[].tools.elevated`) podem restringir ainda mais a execução elevada para agentes específicos. Consulte [Modo elevado](/pt-BR/tools/elevated) para obter detalhes.

---

## Migração de um único agente

<Tabs>
  <Tab title="Antes (um único agente)">
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
As chaves de configuração legadas `agents.defaults.*`/`agents.list[].*` (como `sandbox.perSession`, `agentRuntime`, `embeddedPi`) são migradas por `openclaw doctor`; daqui em diante, prefira `agents.defaults` + `agents.list`.
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
    Esta política desabilita as ferramentas de sistema de arquivos do OpenClaw, mas `exec` ainda é um shell e pode gravar arquivos onde quer que o sistema de arquivos do host ou da sandbox selecionada permita. Para um agente somente leitura, negue `exec` e `process` ou combine o acesso ao shell com controles do sistema de arquivos da sandbox, como `agents.defaults.sandbox.workspaceAccess: "ro"` ou `"none"`.
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

    `sessions_history` neste perfil ainda retorna uma visualização de recuperação limitada e sanitizada, em vez de um despejo bruto da transcrição. A recuperação do assistente remove tags de raciocínio, estruturas auxiliares `<relevant-memories>`, cargas XML de chamadas de ferramentas em texto simples (incluindo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocos truncados de chamadas de ferramentas), estruturas auxiliares degradadas de chamadas de ferramentas, tokens de controle de modelo ASCII/de largura completa que tenham vazado e XML malformado de chamadas de ferramentas do MiniMax antes da ocultação/truncamento.

  </Tab>
</Tabs>

---

## Armadilha comum: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` compara a chave da sessão com a chave da sessão principal (sempre `"main"`; `session.mainKey` não pode ser configurada pelo usuário, e o OpenClaw avisa e ignora qualquer outro valor), e não com o ID do agente. Sessões de grupo/canal sempre recebem suas próprias chaves, portanto são tratadas como não principais e executadas em sandbox. Se você quiser que um agente nunca seja executado em sandbox, defina `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Testes

Depois de configurar a sandbox e as ferramentas multiagente:

<Steps>
  <Step title="Verificar a resolução dos agentes">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verificar os contêineres da sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Testar as restrições de ferramentas">
    - Envie uma mensagem que exija ferramentas restritas.
    - Verifique se o agente não consegue usar as ferramentas negadas.

  </Step>
  <Step title="Monitorar os logs">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Solução de problemas

<AccordionGroup>
  <Accordion title="O agente não é executado em sandbox apesar de `mode: 'all'`">
    - Verifique se há um `agents.defaults.sandbox.mode` global que o substitui.
    - A configuração específica do agente tem precedência, portanto defina `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Ferramentas ainda disponíveis apesar da lista de negação">
    - Confira a [ordem completa de filtragem](#tool-restrictions): perfil → perfil do provedor → política global → política do provedor → política do agente → política do provedor do agente → sandbox → subagente.
    - Cada nível só pode restringir ainda mais, não conceder novamente.
    - Consulte [Sandbox vs. política de ferramentas vs. modo elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) para uma depuração passo a passo.

  </Accordion>
  <Accordion title="Contêiner não isolado por agente">
    - O `scope` padrão é `"agent"` (um contêiner por ID de agente).
    - Defina `scope: "session"` para ter um contêiner por sessão ou `scope: "shared"` para reutilizar um contêiner entre agentes.

  </Accordion>
</AccordionGroup>

---

## Relacionados

- [Modo elevado](/pt-BR/tools/elevated)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Configuração do sandbox](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs. política de ferramentas vs. modo elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) — depuração de "por que isto está bloqueado?"
- [Sandbox](/pt-BR/gateway/sandboxing) — referência completa do sandbox (modos, escopos, backends, imagens)
- [Gerenciamento de sessões](/pt-BR/concepts/session)
