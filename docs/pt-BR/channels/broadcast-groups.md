---
read_when:
    - Configurando grupos de transmissão
    - Depurando respostas de vários agentes no WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Transmitir uma mensagem do WhatsApp para vários agentes
title: Grupos de transmissão
x-i18n:
    generated_at: "2026-04-26T11:23:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b36710d9cc3eb4e2b8ba3d57031bd020aedbb6a502b400ec02a835a320d609
    source_path: channels/broadcast-groups.md
    workflow: 15
---

<Note>
**Status:** Experimental. Adicionado na versão 2026.1.9.
</Note>

## Visão geral

Os Grupos de transmissão permitem que vários agentes processem e respondam à mesma mensagem simultaneamente. Isso permite criar equipes especializadas de agentes que trabalham juntas em um único grupo do WhatsApp ou DM — tudo usando um único número de telefone.

Escopo atual: **apenas WhatsApp** (canal web).

Os grupos de transmissão são avaliados após as allowlists do canal e as regras de ativação de grupo. Em grupos do WhatsApp, isso significa que as transmissões acontecem quando o OpenClaw normalmente responderia (por exemplo: em menção, dependendo das configurações do seu grupo).

## Casos de uso

<AccordionGroup>
  <Accordion title="1. Equipes especializadas de agentes">
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

  </Accordion>
  <Accordion title="2. Suporte multilíngue">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Fluxos de trabalho de garantia de qualidade">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Automação de tarefas">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## Configuração

### Configuração básica

Adicione uma seção `broadcast` de nível superior (ao lado de `bindings`). As chaves são IDs de pares do WhatsApp:

- chats em grupo: JID do grupo (por exemplo, `120363403215116621@g.us`)
- DMs: número de telefone E.164 (por exemplo, `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Resultado:** Quando o OpenClaw responderia neste chat, ele executará todos os três agentes.

### Estratégia de processamento

Controle como os agentes processam mensagens:

<Tabs>
  <Tab title="parallel (padrão)">
    Todos os agentes processam simultaneamente:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    Os agentes processam em ordem (um espera o anterior terminar):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

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

<Steps>
  <Step title="Mensagem recebida chega">
    Uma mensagem de grupo ou DM do WhatsApp chega.
  </Step>
  <Step title="Verificação de transmissão">
    O sistema verifica se o ID do par está em `broadcast`.
  </Step>
  <Step title="Se estiver na lista de transmissão">
    - Todos os agentes listados processam a mensagem.
    - Cada agente tem sua própria chave de sessão e contexto isolado.
    - Os agentes processam em paralelo (padrão) ou sequencialmente.

  </Step>
  <Step title="Se não estiver na lista de transmissão">
    O roteamento normal se aplica (primeiro binding correspondente).
  </Step>
</Steps>

<Note>
Os grupos de transmissão não ignoram as allowlists do canal nem as regras de ativação de grupo (menções/comandos/etc.). Eles apenas mudam _quais agentes são executados_ quando uma mensagem está apta para processamento.
</Note>

### Isolamento de sessão

Cada agente em um grupo de transmissão mantém separadamente:

- **Chaves de sessão** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Histórico de conversa** (o agente não vê as mensagens de outros agentes)
- **Workspace** (sandboxes separados, se configurado)
- **Acesso a ferramentas** (listas de permitir/negar diferentes)
- **Memória/contexto** (`IDENTITY.md`, `SOUL.md` etc. separados)
- **Buffer de contexto do grupo** (mensagens recentes do grupo usadas como contexto) é compartilhado por par, então todos os agentes de transmissão veem o mesmo contexto quando acionados

Isso permite que cada agente tenha:

- Personalidades diferentes
- Acesso a ferramentas diferente (por exemplo, somente leitura vs. leitura e escrita)
- Modelos diferentes (por exemplo, opus vs. sonnet)
- Skills diferentes instaladas

### Exemplo: sessões isoladas

No grupo `120363403215116621@g.us` com agentes `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Contexto do Alfred">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Contexto da Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Boas práticas

<AccordionGroup>
  <Accordion title="1. Mantenha os agentes focados">
    Projete cada agente com uma responsabilidade única e clara:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Bom:** Cada agente tem uma função. ❌ **Ruim:** Um agente genérico "dev-helper".

  </Accordion>
  <Accordion title="2. Use nomes descritivos">
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

  </Accordion>
  <Accordion title="3. Configure acessos a ferramentas diferentes">
    Dê aos agentes apenas as ferramentas de que precisam:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Somente leitura
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Leitura e escrita
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. Monitore o desempenho">
    Com muitos agentes, considere:

    - Usar `"strategy": "parallel"` (padrão) para velocidade
    - Limitar grupos de transmissão a 5–10 agentes
    - Usar modelos mais rápidos para agentes mais simples

  </Accordion>
  <Accordion title="5. Trate falhas de forma elegante">
    Os agentes falham independentemente. O erro de um agente não bloqueia os outros:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Compatibilidade

### Providers

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

- `GROUP_A`: Apenas alfred responde (roteamento normal).
- `GROUP_B`: agent1 E agent2 respondem (transmissão).

<Note>
**Precedência:** `broadcast` tem prioridade sobre `bindings`.
</Note>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Agentes não respondem">
    **Verifique:**

    1. Os IDs dos agentes existem em `agents.list`.
    2. O formato do ID do par está correto (por exemplo, `120363403215116621@g.us`).
    3. Os agentes não estão em listas de negação.

    **Depuração:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Apenas um agente responde">
    **Causa:** O ID do par pode estar em `bindings`, mas não em `broadcast`.

    **Correção:** Adicione à configuração de transmissão ou remova de bindings.

  </Accordion>
  <Accordion title="Problemas de desempenho">
    Se estiver lento com muitos agentes:

    - Reduza o número de agentes por grupo.
    - Use modelos mais leves (sonnet em vez de opus).
    - Verifique o tempo de inicialização do sandbox.

  </Accordion>
</AccordionGroup>

## Exemplos

<AccordionGroup>
  <Accordion title="Exemplo 1: Equipe de revisão de código">
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

    **Usuário envia:** Trecho de código.

    **Respostas:**

    - code-formatter: "Corrigi a indentação e adicionei dicas de tipo"
    - security-scanner: "⚠️ Vulnerabilidade de injeção de SQL na linha 12"
    - test-coverage: "A cobertura está em 45%, faltam testes para casos de erro"
    - docs-checker: "Falta docstring para a função `process_data`"

  </Accordion>
  <Accordion title="Exemplo 2: Suporte multilíngue">
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
  </Accordion>
</AccordionGroup>

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

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Como processar agentes. `parallel` executa todos os agentes simultaneamente; `sequential` os executa na ordem do array.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID de grupo do WhatsApp, número E.164 ou outro ID de par. O valor é o array de IDs de agentes que devem processar mensagens.
</ParamField>

## Limitações

1. **Máximo de agentes:** Não há limite rígido, mas 10+ agentes podem ser lentos.
2. **Contexto compartilhado:** Os agentes não veem as respostas uns dos outros (por design).
3. **Ordem das mensagens:** As respostas paralelas podem chegar em qualquer ordem.
4. **Limites de taxa:** Todos os agentes contam para os limites de taxa do WhatsApp.

## Melhorias futuras

Recursos planejados:

- [ ] Modo de contexto compartilhado (os agentes veem as respostas uns dos outros)
- [ ] Coordenação entre agentes (os agentes podem sinalizar uns aos outros)
- [ ] Seleção dinâmica de agentes (escolher agentes com base no conteúdo da mensagem)
- [ ] Prioridades de agentes (alguns agentes respondem antes dos outros)

## Relacionado

- [Roteamento de canal](/pt-BR/channels/channel-routing)
- [Grupos](/pt-BR/channels/groups)
- [Ferramentas de sandbox para vários agentes](/pt-BR/tools/multi-agent-sandbox-tools)
- [Pareamento](/pt-BR/channels/pairing)
- [Gerenciamento de sessão](/pt-BR/concepts/session)
