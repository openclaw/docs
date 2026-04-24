---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: “Sandbox por agente + restrições de ferramentas, precedência e exemplos”
title: Sandbox e ferramentas multiagente
x-i18n:
    generated_at: "2026-04-24T06:17:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7239e28825759efb060b821f87f5ebd9a7f3b720b30ff16dc076b186e47fcde9
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Configuração de sandbox e ferramentas multiagente

Cada agente em uma configuração multiagente pode sobrescrever a política global de sandbox e ferramentas.
Esta página cobre configuração por agente, regras de precedência e
exemplos.

- **Backends e modos de sandbox**: consulte [Sandboxing](/pt-BR/gateway/sandboxing).
- **Depuração de ferramentas bloqueadas**: consulte [Sandbox vs política de ferramenta vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) e `openclaw sandbox explain`.
- **Exec elevado**: consulte [Modo elevado](/pt-BR/tools/elevated).

A autenticação é por agente: cada agente lê do seu próprio armazenamento de autenticação em `agentDir`
em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Credenciais **não** são compartilhadas entre agentes. Nunca reutilize `agentDir` entre agentes.
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
        "name": "Assistente pessoal",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Bot da família",
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

- Agente `main`: executa no host, acesso total às ferramentas
- Agente `family`: executa em Docker (um contêiner por agente), apenas ferramenta `read`

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

### Exemplo 2b: Perfil global de coding + agente apenas de mensagens

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

- Agentes padrão recebem ferramentas de coding
- O agente `support` é apenas de mensagens (+ ferramenta Slack)

---

### Exemplo 3: Modos de sandbox diferentes por agente

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // padrão global
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // sobrescrita: main nunca em sandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // sobrescrita: público sempre em sandbox
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

## Precedência de configuração

Quando existem configurações globais (`agents.defaults.*`) e específicas de agente (`agents.list[].*`):

### Configuração de sandbox

Configurações específicas de agente sobrescrevem as globais:

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

- `agents.list[].sandbox.{docker,browser,prune}.*` sobrescreve `agents.defaults.sandbox.{docker,browser,prune}.*` para aquele agente (ignorado quando o escopo do sandbox resolve para `"shared"`).

### Restrições de ferramentas

A ordem de filtragem é:

1. **Perfil de ferramenta** (`tools.profile` ou `agents.list[].tools.profile`)
2. **Perfil de ferramenta por provedor** (`tools.byProvider[provider].profile` ou `agents.list[].tools.byProvider[provider].profile`)
3. **Política global de ferramenta** (`tools.allow` / `tools.deny`)
4. **Política de ferramenta por provedor** (`tools.byProvider[provider].allow/deny`)
5. **Política de ferramenta específica do agente** (`agents.list[].tools.allow/deny`)
6. **Política de provedor do agente** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Política de ferramenta de sandbox** (`tools.sandbox.tools` ou `agents.list[].tools.sandbox.tools`)
8. **Política de ferramenta de subagente** (`tools.subagents.tools`, se aplicável)

Cada nível pode restringir ainda mais as ferramentas, mas não pode devolver ferramentas negadas por níveis anteriores.
Se `agents.list[].tools.sandbox.tools` estiver definido, ele substitui `tools.sandbox.tools` para aquele agente.
Se `agents.list[].tools.profile` estiver definido, ele sobrescreve `tools.profile` para aquele agente.
Chaves de ferramenta por provedor aceitam `provider` (por exemplo `google-antigravity`) ou `provider/model` (por exemplo `openai/gpt-5.4`).

Políticas de ferramenta oferecem suporte a atalhos `group:*` que se expandem para várias ferramentas. Consulte [Grupos de ferramentas](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) para a lista completa.

Sobrescritas elevadas por agente (`agents.list[].tools.elevated`) podem restringir ainda mais exec elevado para agentes específicos. Consulte [Modo elevado](/pt-BR/tools/elevated) para detalhes.

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

**Depois (multiagente com perfis diferentes):**

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

`sessions_history` neste perfil ainda retorna uma visão limitada e sanitizada de recuperação,
em vez de um dump bruto de transcrição. A recuperação do assistente remove tags de thinking,
estruturas `<relevant-memories>`, payloads XML de chamada de ferramenta em texto simples
(incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta),
estrutura degradada de chamada de ferramenta, tokens de controle de modelo vazados em ASCII/largura total
e XML malformado de chamada de ferramenta do MiniMax antes da redação/truncagem.

---

## Armadilha comum: "non-main"

`agents.defaults.sandbox.mode: "non-main"` é baseado em `session.mainKey` (padrão `"main"`),
não no ID do agente. Sessões de grupo/canal sempre recebem suas próprias chaves, então
são tratadas como não main e ficarão em sandbox. Se você quiser que um agente nunca entre
em sandbox, defina `agents.list[].sandbox.mode: "off"`.

---

## Testes

Após configurar sandbox e ferramentas multiagente:

1. **Verificar resolução de agente:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Verificar contêineres de sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Testar restrições de ferramenta:**
   - Envie uma mensagem que exija ferramentas restritas
   - Verifique se o agente não consegue usar ferramentas negadas

4. **Monitorar logs:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Solução de problemas

### Agente não está em sandbox apesar de `mode: "all"`

- Verifique se existe um `agents.defaults.sandbox.mode` global que o sobrescreve
- Configuração específica de agente tem precedência, então defina `agents.list[].sandbox.mode: "all"`

### Ferramentas ainda disponíveis apesar da lista deny

- Verifique a ordem de filtragem de ferramenta: global → agente → sandbox → subagente
- Cada nível só pode restringir mais, não devolver permissões
- Verifique com logs: `[tools] filtering tools for agent:${agentId}`

### Contêiner não está isolado por agente

- Defina `scope: "agent"` na configuração de sandbox específica do agente
- O padrão é `"session"`, que cria um contêiner por sessão

---

## Relacionado

- [Sandboxing](/pt-BR/gateway/sandboxing) -- referência completa de sandbox (modos, escopos, backends, imagens)
- [Sandbox vs política de ferramenta vs elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) -- depurar “por que isto está bloqueado?”
- [Modo elevado](/pt-BR/tools/elevated)
- [Roteamento multiagente](/pt-BR/concepts/multi-agent)
- [Configuração de sandbox](/pt-BR/gateway/config-agents#agentsdefaultssandbox)
- [Gerenciamento de sessão](/pt-BR/concepts/session)
