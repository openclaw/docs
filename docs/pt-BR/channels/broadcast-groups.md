---
read_when:
    - Configurando grupos de transmissão
    - Depurando respostas de vários agentes no WhatsApp
status: experimental
summary: Enviar uma mensagem do WhatsApp para vários agentes
title: Grupos de transmissão
x-i18n:
    generated_at: "2026-04-24T05:40:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f3991348570170855158e82089fa073ca62b98855f443d4a227829d7c945ee
    source_path: channels/broadcast-groups.md
    workflow: 15
---

**Status:** Experimental  
**Version:** Adicionado na versão 2026.1.9

## Visão geral

Os Grupos de Transmissão permitem que vários agentes processem e respondam à mesma mensagem simultaneamente. Isso permite criar equipes especializadas de agentes que trabalham juntas em um único grupo ou DM do WhatsApp — tudo usando um único número de telefone.

Escopo atual: **somente WhatsApp** (canal web).

Os grupos de transmissão são avaliados após as allowlists do canal e as regras de ativação de grupo. Em grupos do WhatsApp, isso significa que as transmissões acontecem quando o OpenClaw normalmente responderia (por exemplo: em menção, dependendo das configurações do seu grupo).

## Casos de uso

### 1. Equipes especializadas de agentes

Implante vários agentes com responsabilidades atômicas e focadas:

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

Cada agente processa a mesma mensagem e fornece sua perspectiva especializada.

### 2. Suporte multilíngue

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. Fluxos de garantia de qualidade

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. Automação de tarefas

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## Configuração

### Configuração básica

Adicione uma seção `broadcast` de nível superior (ao lado de `bindings`). As chaves são IDs de peer do WhatsApp:

- chats em grupo: JID do grupo (por exemplo, `120363403215116621@g.us`)
- DMs: número de telefone E.164 (por exemplo, `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Resultado:** quando o OpenClaw responderia neste chat, ele executará todos os três agentes.

### Estratégia de processamento

Controle como os agentes processam mensagens:

#### Paralela (padrão)

Todos os agentes processam simultaneamente:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Sequencial

Os agentes processam em ordem (um espera o anterior terminar):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Exemplo completo

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Como funciona

### Fluxo da mensagem

1. **A mensagem recebida** chega em um grupo do WhatsApp
2. **Verificação de transmissão**: o sistema verifica se o ID do peer está em `broadcast`
3. **Se estiver na lista de transmissão**:
   - Todos os agentes listados processam a mensagem
   - Cada agente tem sua própria chave de sessão e contexto isolado
   - Os agentes processam em paralelo (padrão) ou sequencialmente
4. **Se não estiver na lista de transmissão**:
   - O roteamento normal se aplica (primeiro `binding` correspondente)

Observação: os grupos de transmissão não ignoram as allowlists do canal nem as regras de ativação de grupo (menções/comandos/etc.). Eles apenas mudam _quais agentes são executados_ quando uma mensagem está qualificada para processamento.

### Isolamento de sessão

Cada agente em um grupo de transmissão mantém completamente separados:

- **Chaves de sessão** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Histórico da conversa** (um agente não vê as mensagens dos outros agentes)
- **Workspace** (sandboxes separadas, se configurado)
- **Acesso a ferramentas** (listas diferentes de permitir/negar)
- **Memória/contexto** (`IDENTITY.md`, `SOUL.md` etc. separados)
- **Buffer de contexto do grupo** (mensagens recentes do grupo usadas como contexto), que é compartilhado por peer, então todos os agentes de transmissão veem o mesmo contexto quando acionados

Isso permite que cada agente tenha:

- Personalidades diferentes
- Acessos a ferramentas diferentes (por exemplo, somente leitura vs. leitura e escrita)
- Modelos diferentes (por exemplo, opus vs. sonnet)
- Skills diferentes instaladas

### Exemplo: sessões isoladas

No grupo `120363403215116621@g.us` com os agentes `["alfred", "baerbel"]`:

**Contexto do Alfred:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Contexto da Bärbel:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## Boas práticas

### 1. Mantenha os agentes focados

Projete cada agente com uma responsabilidade única e clara:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Bom:** cada agente tem uma função  
❌ **Ruim:** um agente genérico "dev-helper"

### 2. Use nomes descritivos

Deixe claro o que cada agente faz:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Configure acessos a ferramentas diferentes

Dê aos agentes apenas as ferramentas de que precisam:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Read-only
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
    }
  }
}
```

### 4. Monitore o desempenho

Com muitos agentes, considere:

- Usar `"strategy": "parallel"` (padrão) para mais velocidade
- Limitar grupos de transmissão a 5–10 agentes
- Usar modelos mais rápidos para agentes mais simples

### 5. Trate falhas com elegância

Os agentes falham de forma independente. O erro de um agente não bloqueia os outros:

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## Compatibilidade

### Provedores

Atualmente, os grupos de transmissão funcionam com:

- ✅ WhatsApp (implementado)
- 🚧 Telegram (planejado)
- 🚧 Discord (planejado)
- 🚧 Slack (planejado)

### Roteamento

Os grupos de transmissão funcionam junto com o roteamento existente:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: apenas alfred responde (roteamento normal)
- `GROUP_B`: agent1 E agent2 respondem (transmissão)

**Precedência:** `broadcast` tem prioridade sobre `bindings`.

## Solução de problemas

### Agentes não respondem

**Verifique:**

1. Os IDs dos agentes existem em `agents.list`
2. O formato do ID do peer está correto (por exemplo, `120363403215116621@g.us`)
3. Os agentes não estão em listas de negação

**Depuração:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Apenas um agente responde

**Causa:** o ID do peer pode estar em `bindings`, mas não em `broadcast`.

**Correção:** adicione à configuração de transmissão ou remova de `bindings`.

### Problemas de desempenho

**Se ficar lento com muitos agentes:**

- Reduza o número de agentes por grupo
- Use modelos mais leves (sonnet em vez de opus)
- Verifique o tempo de inicialização da sandbox

## Exemplos

### Exemplo 1: equipe de revisão de código

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**O usuário envia:** trecho de código  
**Respostas:**

- code-formatter: "Fixed indentation and added type hints"
- security-scanner: "⚠️ SQL injection vulnerability in line 12"
- test-coverage: "Coverage is 45%, missing tests for error cases"
- docs-checker: "Missing docstring for function `process_data`"

### Exemplo 2: suporte multilíngue

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## Referência da API

### Esquema de configuração

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Campos

- `strategy` (opcional): como processar os agentes
  - `"parallel"` (padrão): todos os agentes processam simultaneamente
  - `"sequential"`: os agentes processam na ordem do array
- `[peerId]`: JID de grupo do WhatsApp, número E.164 ou outro ID de peer
  - Valor: array de IDs de agentes que devem processar mensagens

## Limitações

1. **Máximo de agentes:** não há limite rígido, mas 10+ agentes podem ficar lentos
2. **Contexto compartilhado:** os agentes não veem as respostas uns dos outros (por design)
3. **Ordenação de mensagens:** respostas paralelas podem chegar em qualquer ordem
4. **Limites de taxa:** todos os agentes contam para os limites de taxa do WhatsApp

## Melhorias futuras

Recursos planejados:

- [ ] Modo de contexto compartilhado (os agentes veem as respostas uns dos outros)
- [ ] Coordenação entre agentes (os agentes podem sinalizar uns aos outros)
- [ ] Seleção dinâmica de agentes (escolher agentes com base no conteúdo da mensagem)
- [ ] Prioridades de agentes (alguns agentes respondem antes de outros)

## Relacionado

- [Grupos](/pt-BR/channels/groups)
- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Pareamento](/pt-BR/channels/pairing)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [Gerenciamento de sessão](/pt-BR/concepts/session)
