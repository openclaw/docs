---
read_when:
    - Trabalhando no protocolo do Gateway, em clientes ou em transportes
summary: Arquitetura do Gateway WebSocket, componentes e fluxos de cliente
title: Arquitetura do Gateway
x-i18n:
    generated_at: "2026-05-06T05:49:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 433489081bfe07691b211f5076ec45ce0ed3fd043eb86128f73121f2cab71cd3
    source_path: concepts/architecture.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Visão geral

- Um único **Gateway** de longa duração controla todas as superfícies de mensagens (WhatsApp via
  Baileys, Telegram via grammY, Slack, Discord, Signal, iMessage, WebChat).
- Clientes do plano de controle (app macOS, CLI, UI web, automações) conectam-se ao
  Gateway por **WebSocket** no host de bind configurado (padrão
  `127.0.0.1:18789`).
- **Nodes** (macOS/iOS/Android/headless) também se conectam por **WebSocket**, mas
  declaram `role: node` com capacidades/comandos explícitos.
- Um Gateway por host; ele é o único lugar que abre uma sessão do WhatsApp.
- O **host do canvas** é servido pelo servidor HTTP do Gateway em:
  - `/__openclaw__/canvas/` (HTML/CSS/JS editável pelo agente)
  - `/__openclaw__/a2ui/` (host A2UI)
    Ele usa a mesma porta do Gateway (padrão `18789`).

## Componentes e fluxos

### Gateway (daemon)

- Mantém conexões de provedores.
- Expõe uma API WS tipada (requisições, respostas, eventos server-push).
- Valida frames de entrada contra JSON Schema.
- Emite eventos como `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`.

### Clientes (app para Mac / CLI / administração web)

- Uma conexão WS por cliente.
- Enviam requisições (`health`, `status`, `send`, `agent`, `system-presence`).
- Assinam eventos (`tick`, `agent`, `presence`, `shutdown`).

### Nodes (macOS / iOS / Android / headless)

- Conectam-se ao **mesmo servidor WS** com `role: node`.
- Fornecem uma identidade de dispositivo em `connect`; o pareamento é **baseado em dispositivo** (função `node`) e
  a aprovação fica no armazenamento de pareamento de dispositivos.
- Expõem comandos como `canvas.*`, `camera.*`, `screen.record`, `location.get`.

Detalhes do protocolo:

- [Protocolo do Gateway](/pt-BR/gateway/protocol)

### WebChat

- UI estática que usa a API WS do Gateway para histórico de chat e envios.
- Em configurações remotas, conecta-se pelo mesmo túnel SSH/Tailscale que outros
  clientes.

## Ciclo de vida da conexão (cliente único)

```mermaid
sequenceDiagram
    participant Client
    participant Gateway

    Client->>Gateway: req:connect
    Gateway-->>Client: res (ok)
    Note right of Gateway: or res error + close
    Note left of Client: payload=hello-ok<br>snapshot: presence + health

    Gateway-->>Client: event:presence
    Gateway-->>Client: event:tick

    Client->>Gateway: req:agent
    Gateway-->>Client: res:agent<br>ack {runId, status:"accepted"}
    Gateway-->>Client: event:agent<br>(streaming)
    Gateway-->>Client: res:agent<br>final {runId, status, summary}
```

## Protocolo de conexão (resumo)

- Transporte: WebSocket, frames de texto com payloads JSON.
- O primeiro frame **deve** ser `connect`.
- Após o handshake:
  - Requisições: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - Eventos: `{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` são metadados de descoberta, não um
  despejo gerado de todas as rotas auxiliares chamáveis.
- A autenticação por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação do gateway configurado.
- Modos que carregam identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou não loopback
  `gateway.auth.mode: "trusted-proxy"` satisfazem a autenticação a partir dos cabeçalhos da requisição
  em vez de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` em ingresso privado desativa completamente a autenticação por segredo compartilhado;
  mantenha esse modo desativado em ingressos públicos/não confiáveis.
- Chaves de idempotência são obrigatórias para métodos com efeitos colaterais (`send`, `agent`) para
  permitir novas tentativas com segurança; o servidor mantém um cache de deduplicação de curta duração.
- Nodes devem incluir `role: "node"` mais capacidades/comandos/permissões em `connect`.

## Pareamento + confiança local

- Todos os clientes WS (operadores + nodes) incluem uma **identidade de dispositivo** em `connect`.
- Novos IDs de dispositivo exigem aprovação de pareamento; o Gateway emite um **token de dispositivo**
  para conexões subsequentes.
- Conexões diretas por local loopback podem ser aprovadas automaticamente para manter a UX no mesmo host
  fluida.
- OpenClaw também tem um caminho restrito de autoconexão local de backend/contêiner para
  fluxos auxiliares confiáveis com segredo compartilhado.
- Conexões por tailnet e LAN, incluindo binds de tailnet no mesmo host, ainda exigem
  aprovação explícita de pareamento.
- Todas as conexões devem assinar o nonce `connect.challenge`.
- O payload de assinatura `v3` também vincula `platform` + `deviceFamily`; o gateway
  fixa os metadados pareados na reconexão e exige pareamento de reparo para alterações de metadados.
- Conexões **não locais** ainda exigem aprovação explícita.
- A autenticação do Gateway (`gateway.auth.*`) ainda se aplica a **todas** as conexões, locais ou
  remotas.

Detalhes: [Protocolo do Gateway](/pt-BR/gateway/protocol), [Pareamento](/pt-BR/channels/pairing),
[Segurança](/pt-BR/gateway/security).

## Tipagem de protocolo e geração de código

- Esquemas TypeBox definem o protocolo.
- JSON Schema é gerado a partir desses esquemas.
- Modelos Swift são gerados a partir do JSON Schema.

## Acesso remoto

- Preferencial: Tailscale ou VPN.
- Alternativa: túnel SSH

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```

- O mesmo handshake + token de autenticação se aplicam pelo túnel.
- TLS + pinning opcional podem ser habilitados para WS em configurações remotas.

## Snapshot de operações

- Iniciar: `openclaw gateway` (primeiro plano, logs para stdout).
- Saúde: `health` por WS (também incluído em `hello-ok`).
- Supervisão: launchd/systemd para reinício automático.

## Invariantes

- Exatamente um Gateway controla uma única sessão Baileys por host.
- Handshake é obrigatório; qualquer primeiro frame que não seja JSON ou não seja connect resulta em fechamento imediato.
- Eventos não são reproduzidos; clientes devem atualizar em caso de lacunas.

## Relacionado

- [Loop do agente](/pt-BR/concepts/agent-loop) — ciclo detalhado de execução do agente
- [Protocolo do Gateway](/pt-BR/gateway/protocol) — contrato do protocolo WebSocket
- [Fila](/pt-BR/concepts/queue) — fila de comandos e concorrência
- [Segurança](/pt-BR/gateway/security) — modelo de confiança e hardening
