---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: “Sandbox por agente + restrições de ferramentas, precedência e exemplos”
title: Sandbox e ferramentas para vários agentes
x-i18n:
    generated_at: "2026-04-25T13:57:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4473b8ea0f10c891b08cb56c9ba5a073f79c55b42f5b348b69ffb3c3d94c8f88
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Configuração de Sandbox e Ferramentas para Vários Agentes

Cada agente em uma configuração com vários agentes pode substituir a política global
de sandbox e de ferramentas. Esta página aborda configuração por agente, regras de
precedência e exemplos.

- **Backends e modos de sandbox**: consulte [Sandboxing](/pt-BR/gateway/sandboxing).
- **Depurando ferramentas bloqueadas**: consulte [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) e `openclaw sandbox explain`.
- **Exec elevado**: consulte [Elevated Mode](/pt-BR/tools/elevated).

A autenticação é por agente: cada agente lê do seu próprio armazenamento de autenticação em
`agentDir`, em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
As credenciais **não** são compartilhadas entre agentes. Nunca reutilize `agentDir` entre agentes.
Se você quiser compartilhar credenciais, copie `auth-profiles.json` para o `agentDir` do outro agente.

---

## Exemplos de configuração

### Exemplo 1: Agente pessoal + agente familiar restrito

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

- Agente `main`: roda no host, acesso total às ferramentas
- Agente `family`: roda em Docker (um contêiner por agente), apenas ferramenta `read`

---

### Exemplo 2: Agente de trabalho com sandbox compartilhado

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

---

### Exemplo 2b: Perfil global de coding + agente apenas de messaging

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

- agentes padrão recebem ferramentas de coding
- agente `support` é apenas de messaging (+ ferramenta Slack)

---

### Exemplo 3: Modos de sandbox diferentes por agente

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Padrão global
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Substituição: main nunca usa sandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Substituição: public sempre usa sandbox
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

---

## Precedência da configuração

Quando existem tanto configurações globais (`agents.defaults.*`) quanto específicas por agente (`agents.list[].*`):

### Configuração de sandbox

Configurações específicas do agente substituem as globais:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Observações:**

- `agents.list[].sandbox.{docker,browser,prune}.*` substitui `agents.defaults.sandbox.{docker,browser,prune}.*` para aquele agente (ignorado quando o escopo do sandbox é resolvido para `"shared"`).

### Restrições de ferramentas

A ordem de filtragem é:

1. **Perfil de ferramentas** (`tools.profile` ou `agents.list[].tools.profile`)
2. **Perfil de ferramentas por provedor** (`tools.byProvider[provider].profile` ou `agents.list[].tools.byProvider[provider].profile`)
3. **Política global de ferramentas** (`tools.allow` / `tools.deny`)
4. **Política de ferramentas por provedor** (`tools.byProvider[provider].allow/deny`)
5. **Política de ferramentas específica do agente** (`agents.list[].tools.allow/deny`)
6. **Política de provedor do agente** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Política de ferramentas do sandbox** (`tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`)
8. **Política de ferramentas de subagente** (`tools.subagents.tools`, se aplicável)

Cada nível pode restringir ainda mais as ferramentas, mas não pode restaurar ferramentas negadas em níveis anteriores.
Se `agents.list[].tools.sandbox.tools` estiver definido, ele substitui `tools.sandbox.tools` para aquele agente.
Se `agents.list[].tools.profile` estiver definido, ele substitui `tools.profile` para aquele agente.
As chaves de ferramentas por provedor aceitam `provider` (por exemplo `google-antigravity`) ou `provider/model` (por exemplo `openai/gpt-5.4`).

Se qualquer allowlist explícita nessa cadeia deixar a execução sem ferramentas chamáveis,
o OpenClaw para antes de enviar o prompt ao modelo. Isso é intencional:
um agente configurado com uma ferramenta ausente, como
`agents.list[].tools.allow: ["query_db"]`, deve falhar de forma evidente até que o Plugin
que registra `query_db` seja ativado, e não continuar como um agente apenas de texto.

Políticas de ferramentas oferecem suporte a abreviações `group:*` que se expandem em várias ferramentas. Consulte [Tool groups](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) para a lista completa.

Substituições de elevado por agente (`agents.list[].tools.elevated`) podem restringir ainda mais o exec elevado para agentes específicos. Consulte [Elevated Mode](/pt-BR/tools/elevated) para detalhes.

---

## Migração de agente único

**Antes (agente único):**

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

**Depois (vários agentes com perfis diferentes):**

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

Configurações legadas `agent.*` são migradas por `openclaw doctor`; prefira `agents.defaults` + `agents.list` daqui para frente.

---

## Exemplos de restrição de ferramentas

### Agente somente leitura

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agente de execução segura (sem modificações de arquivo)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agente somente de comunicação

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` nesse perfil ainda retorna uma visão de recall limitada e sanitizada,
em vez de um dump bruto da transcrição. O recall do assistente remove tags de thinking,
scaffolding `<relevant-memories>`, payloads XML de chamada de ferramenta em texto simples
(incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta),
scaffolding degradado de chamada de ferramenta, tokens de controle de modelo
vazados em ASCII/full-width e XML malformado de chamada de ferramenta MiniMax antes da redação/truncamento.

---

## Armadilha comum: "non-main"

`agents.defaults.sandbox.mode: "non-main"` é baseado em `session.mainKey` (padrão `"main"`),
não no ID do agente. Sessões de grupo/canal sempre recebem suas próprias chaves, então
são tratadas como não principais e entrarão em sandbox. Se você quiser que um agente nunca use
sandbox, defina `agents.list[].sandbox.mode: "off"`.

---

## Testes

Após configurar sandbox e ferramentas para vários agentes:

1. **Verifique a resolução do agente:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Verifique os contêineres de sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Teste as restrições de ferramenta:**
   - Envie uma mensagem que exija ferramentas restritas
   - Verifique se o agente não consegue usar ferramentas negadas

4. **Monitore os logs:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Solução de problemas

### O agente não está em sandbox apesar de `mode: "all"`

- Verifique se há um `agents.defaults.sandbox.mode` global que o substitui
- A configuração específica do agente tem precedência, então defina `agents.list[].sandbox.mode: "all"`

### Ferramentas ainda disponíveis apesar da lista de negação

- Verifique a ordem de filtragem de ferramentas: global → agente → sandbox → subagente
- Cada nível só pode restringir ainda mais, não restaurar permissões
- Verifique com logs: `[tools] filtering tools for agent:${agentId}`

### Contêiner não isolado por agente

- Defina `scope: "agent"` na configuração específica de sandbox do agente
- O padrão é `"session"`, que cria um contêiner por sessão

---

## Relacionado

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox (modos, escopos, backends, imagens)
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) -- depurando "por que isso está bloqueado?"
- [Elevated Mode](/pt-BR/tools/elevated)
- [Multi-Agent Routing](/pt-BR/concepts/multi-agent)
- [Sandbox Configuration](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Session Management](/pt-BR/concepts/session)
