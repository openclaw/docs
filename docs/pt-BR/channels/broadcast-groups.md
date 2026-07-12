---
read_when:
    - Configurando grupos de transmissão
    - Depuração de respostas de múltiplos agentes no WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Transmita uma mensagem do WhatsApp para vários agentes
title: Grupos de transmissão
x-i18n:
    generated_at: "2026-07-11T23:43:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Status:** Experimental. Adicionado na versão 2026.1.9. Somente WhatsApp (canal web).
</Note>

## Visão geral

Os grupos de transmissão executam **vários agentes** para a mesma mensagem recebida. Cada agente processa a mensagem em sua própria sessão isolada e publica sua própria resposta, permitindo que um número do WhatsApp hospede uma equipe de agentes especializados em um único chat em grupo ou mensagem direta.

Os grupos de transmissão são avaliados após as listas de permissões do canal e as regras de ativação de grupos. Nos grupos do WhatsApp, as transmissões ocorrem quando o OpenClaw normalmente responderia (por exemplo, ao ser mencionado, dependendo das configurações do grupo). Elas alteram apenas **quais agentes são executados**, nunca se uma mensagem está qualificada para processamento.

A rotina ativa de controle de qualidade do WhatsApp inclui `whatsapp-broadcast-group-fanout`, que verifica se uma mensagem de grupo com uma menção pode gerar respostas visíveis distintas de dois agentes configurados.

## Configuração

### Configuração básica

Adicione uma seção `broadcast` de nível superior (ao lado de `bindings`). As chaves são IDs de pares do WhatsApp e os valores são matrizes de IDs de agentes:

- chats em grupo: JID do grupo (por exemplo, `120363403215116621@g.us`)
- mensagens diretas: número de telefone E.164 do remetente (por exemplo, `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Resultado:** quando o OpenClaw responderia neste chat, ele executa os três agentes.

Cada ID de agente listado deve existir em `agents.list`: a validação da configuração informa IDs desconhecidos, e o ambiente de execução os ignora com um aviso `Broadcast agent <id> not found in agents.list; skipping`.

### Estratégia de processamento

`broadcast.strategy` define como os agentes processam a mensagem:

| Estratégia           | Comportamento                                                               |
| -------------------- | --------------------------------------------------------------------------- |
| `parallel` (padrão)  | Todos os agentes processam simultaneamente; as respostas chegam sem ordem definida. |
| `sequential`         | Os agentes processam na ordem da matriz; cada um aguarda o anterior terminar. |

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

### Fluxo de mensagens

<Steps>
  <Step title="A mensagem recebida chega">
    Uma mensagem de grupo ou direta do WhatsApp chega.
  </Step>
  <Step title="Roteamento e admissão">
    O OpenClaw aplica listas de permissões do canal, regras de ativação de grupos e a propriedade configurada das associações ACP.
  </Step>
  <Step title="Verificação de transmissão">
    Se nenhuma associação ACP configurada for proprietária da rota, o OpenClaw verificará se o ID do par está em `broadcast`.
  </Step>
  <Step title="Se a transmissão for aplicável">
    - Todos os agentes listados processam a mensagem.
    - Cada agente tem sua própria chave de sessão e contexto isolado.
    - Os agentes processam em paralelo (padrão) ou sequencialmente.
    - Os anexos de áudio são transcritos uma vez antes da distribuição, permitindo que os agentes compartilhem uma transcrição em vez de fazer chamadas STT separadas.

  </Step>
  <Step title="Se a transmissão não for aplicável">
    O OpenClaw encaminha para a rota comum ou para a rota de sessão ACP configurada selecionada durante o roteamento.
  </Step>
</Steps>

<Note>
Os grupos de transmissão não ignoram as listas de permissões do canal nem as regras de ativação de grupos (menções/comandos/etc.). Eles alteram apenas _quais agentes são executados_ quando uma mensagem está qualificada para processamento.
</Note>

### Isolamento de sessões

Cada agente em um grupo de transmissão mantém totalmente separados:

- **Chaves de sessão** (`agent:alfred:whatsapp:group:120363...` em comparação com `agent:baerbel:whatsapp:group:120363...`)
- **Histórico da conversa** (um agente não vê as respostas dos outros agentes)
- **Espaço de trabalho** (sandboxes separados, se configurados)
- **Acesso a ferramentas** (listas distintas de permissões e bloqueios)
- **Memória/contexto** (`IDENTITY.md`, `SOUL.md` etc. separados)

Uma exceção é compartilhada intencionalmente: o **buffer de contexto do grupo** (mensagens recentes do grupo usadas como contexto) é compartilhado por par, portanto todos os agentes da transmissão veem o mesmo contexto quando são acionados. Ele é limpo uma vez após a conclusão da distribuição.

Isso permite que cada agente tenha diferentes personalidades, modelos, Skills e acessos a ferramentas (por exemplo, somente leitura em comparação com leitura e gravação).

### Exemplo: sessões isoladas

No grupo `120363403215116621@g.us` com os agentes `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Contexto de Alfred">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Contexto de Baerbel">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Casos de uso

- **Equipes de agentes especializados**: um grupo de desenvolvimento em que `code-reviewer`, `security-auditor`, `test-generator` e `docs-checker` respondem à mesma mensagem, cada um sob sua própria perspectiva.
- **Suporte multilíngue**: um único chat de suporte com `support-en`, `support-de` e `support-es` respondendo em seus respectivos idiomas.
- **Controle de qualidade**: `support-agent` responde enquanto `qa-agent` revisa e só responde quando encontra problemas.
- **Automação de tarefas**: `task-tracker`, `time-logger` e `report-generator` processam a mesma atualização de status.

## Práticas recomendadas

<AccordionGroup>
  <Accordion title="1. Mantenha os agentes focados">
    Dê a cada agente uma única responsabilidade clara (`formatter`, `linter`, `tester`) em vez de usar um agente genérico "dev-helper".
  </Accordion>
  <Accordion title="2. Use IDs e nomes descritivos">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. Configure acessos diferentes às ferramentas">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` tem acesso somente de leitura. `fixer` pode ler e gravar.

  </Accordion>
  <Accordion title="4. Monitore o desempenho">
    Com muitos agentes, prefira `"strategy": "parallel"` (padrão), limite os grupos de transmissão a poucos agentes e use modelos mais rápidos para agentes mais simples.
  </Accordion>
  <Accordion title="5. As falhas permanecem isoladas">
    Os agentes falham de forma independente. O erro de um agente é registrado (`Broadcast agent <id> failed: ...`) e não bloqueia os demais.
  </Accordion>
</AccordionGroup>

## Compatibilidade

### Provedores

Atualmente, os grupos de transmissão são implementados somente para o WhatsApp (canal web). Outros canais ignoram a configuração `broadcast`.

### Roteamento

Os grupos de transmissão funcionam em conjunto com o roteamento existente:

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

- `GROUP_A`: somente alfred responde (roteamento normal).
- `GROUP_B`: agent1 E agent2 respondem (transmissão).

<Note>
**Precedência:** `broadcast` tem prioridade sobre as associações de rotas comuns. As associações ACP configuradas (`bindings[].type="acp"`) são exclusivas: quando uma delas corresponde, o OpenClaw encaminha para a sessão ACP configurada em vez de realizar a distribuição da transmissão.
</Note>

## Solução de problemas

<AccordionGroup>
  <Accordion title="Os agentes não respondem">
    **Verifique:**

    1. Os IDs dos agentes existem em `agents.list` (a validação da configuração rejeita IDs desconhecidos).
    2. O formato do ID do par está correto (JID de grupo, como `120363403215116621@g.us`, ou E.164, como `+15551234567`, para mensagens diretas).
    3. A mensagem passou pelos controles normais (as regras de menção/ativação ainda se aplicam).

    **Depuração:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    Uma distribuição bem-sucedida registra `Broadcasting message to <n> agents (<strategy>)`.

  </Accordion>
  <Accordion title="Somente um agente responde">
    **Causa:** o ID do par pode estar nas associações de rotas comuns, mas não em `broadcast`, ou pode corresponder a uma associação ACP exclusiva configurada.

    **Correção:** adicione à configuração de transmissão os pares associados a rotas comuns ou remova/altere a associação ACP configurada caso queira a distribuição da transmissão.

  </Accordion>
  <Accordion title="Problemas de desempenho">
    Se o processamento estiver lento com muitos agentes: reduza o número de agentes por grupo, use modelos mais leves e verifique o tempo de inicialização do sandbox.
  </Accordion>
</AccordionGroup>

## Exemplos

<AccordionGroup>
  <Accordion title="Exemplo 1: equipe de revisão de código">
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

    Um trecho de código no grupo gera quatro respostas: correções de formatação, uma constatação de segurança, uma lacuna de cobertura e uma pequena observação sobre a documentação.

  </Accordion>
  <Accordion title="Exemplo 2: pipeline multilíngue">
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
  Como processar os agentes. `parallel` executa todos os agentes simultaneamente; `sequential` os executa na ordem da matriz.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID de grupo do WhatsApp ou número de telefone E.164. O valor é a matriz de IDs dos agentes que devem processar as mensagens desse par.
</ParamField>

## Limitações

1. **Máximo de agentes:** não há limite rígido, mas muitos agentes (10 ou mais) podem causar lentidão.
2. **Contexto compartilhado:** os agentes não veem as respostas uns dos outros (por definição).
3. **Ordem das mensagens:** as respostas em paralelo podem chegar em qualquer ordem.
4. **Limites de taxa:** todas as respostas vêm de uma única conta do WhatsApp, portanto a resposta de cada agente conta para os mesmos limites de taxa do WhatsApp.

## Conteúdo relacionado

- [Roteamento de canais](/pt-BR/channels/channel-routing)
- [Grupos](/pt-BR/channels/groups)
- [Ferramentas de sandbox multiagente](/pt-BR/tools/multi-agent-sandbox-tools)
- [Pareamento](/pt-BR/channels/pairing)
- [Gerenciamento de sessões](/pt-BR/concepts/session)
