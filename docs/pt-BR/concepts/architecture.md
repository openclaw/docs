---
read_when:
    - Trabalhando no protocolo do Gateway, nos clientes ou nos transportes
summary: Arquitetura, componentes e fluxos de clientes do Gateway WebSocket
title: Arquitetura do Gateway
x-i18n:
    generated_at: "2026-07-11T23:51:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f8054bd87f738b957c24f8d6965d55365de2293d44902530a9ba778afa597cc7
    source_path: concepts/architecture.md
    workflow: 16
---

## Visão geral

- Um único **Gateway** de longa duração controla todas as superfícies de mensagens (WhatsApp via
  Baileys, Telegram via grammY, Slack, Discord, Signal, iMessage, WebChat).
- Os clientes do plano de controle (aplicativo para macOS, CLI, interface web, automações) conectam-se ao
  Gateway por **WebSocket** no host de escuta configurado (padrão:
  `127.0.0.1:18789`).
- Os **Nodes** (macOS/iOS/Android/sem interface gráfica) também se conectam por **WebSocket**, mas
  declaram `role: node` com capacidades/comandos explícitos.
- Um Gateway por host; ele é o único local que abre uma sessão do WhatsApp.
- O **host do canvas** é servido pelo servidor HTTP do Gateway em:
  - `/__openclaw__/canvas/` (HTML/CSS/JS editável pelo agente)
  - `/__openclaw__/a2ui/` (host A2UI)

  Ele usa a mesma porta do Gateway (padrão: `18789`).

## Componentes e fluxos

### Gateway (daemon)

- Mantém conexões com os provedores.
- Expõe uma API WS tipada (solicitações, respostas e eventos enviados pelo servidor).
- Valida os quadros recebidos de acordo com o JSON Schema.
- Emite eventos como `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`.

### Clientes (aplicativo para Mac / CLI / administração web)

- Uma conexão WS por cliente.
- Enviam solicitações (`health`, `status`, `send`, `agent`, `system-presence`).
- Assinam eventos (`tick`, `agent`, `presence`, `shutdown`).

### Nodes (macOS / iOS / Android / sem interface gráfica)

- Conectam-se ao **mesmo servidor WS** com `role: node`.
- Fornecem uma identidade de dispositivo em `connect`; o pareamento é **baseado no dispositivo** (função `node`) e
  a aprovação fica no armazenamento de pareamentos de dispositivos.
- Expõem comandos como `canvas.*`, `camera.*`, `screen.record`, `location.get`.

Detalhes do protocolo: [Protocolo do Gateway](/pt-BR/gateway/protocol)

### WebChat

- Interface estática que usa a API WS do Gateway para acessar o histórico de conversas e enviar mensagens.
- Em configurações remotas, conecta-se pelo mesmo túnel SSH/Tailscale que os outros
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

## Protocolo de comunicação (resumo)

- Transporte: WebSocket, quadros de texto com cargas JSON.
- O primeiro quadro **deve** ser `connect`.
- Após o handshake:
  - Solicitações: `{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - Eventos: `{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` são metadados de descoberta, não um
  despejo gerado de todas as rotas auxiliares invocáveis.
- A autenticação por segredo compartilhado usa `connect.params.auth.token` ou
  `connect.params.auth.password`, dependendo do modo de autenticação configurado para o Gateway.
- Modos que incluem identidade, como Tailscale Serve
  (`gateway.auth.allowTailscale: true`) ou
  `gateway.auth.mode: "trusted-proxy"` fora de local loopback, realizam a autenticação por meio dos cabeçalhos da solicitação,
  em vez de `connect.params.auth.*`.
- `gateway.auth.mode: "none"` com entrada privada desativa completamente a autenticação por segredo compartilhado;
  mantenha esse modo desativado em entradas públicas/não confiáveis.
- Chaves de idempotência são obrigatórias para métodos com efeitos colaterais (`send`, `agent`) a fim de
  permitir novas tentativas com segurança; o servidor mantém um cache temporário de desduplicação.
- Os Nodes devem incluir `role: "node"`, além de capacidades/comandos/permissões, em `connect`.

## Pareamento e confiança local

- Todos os clientes WS (operadores e Nodes) incluem uma **identidade de dispositivo** em `connect`.
- Novos IDs de dispositivo exigem aprovação de pareamento; o Gateway emite um **token de dispositivo**
  para conexões posteriores.
- Conexões diretas via local loopback podem ser aprovadas automaticamente para manter uma experiência fluida
  no mesmo host.
- O OpenClaw também possui um caminho restrito de autoconexão local ao backend/contêiner para
  fluxos auxiliares confiáveis com segredo compartilhado.
- Conexões pela tailnet e pela LAN, incluindo vínculos de tailnet no mesmo host, ainda exigem
  aprovação explícita de pareamento.
- Todas as conexões devem assinar o nonce `connect.challenge`. A carga da assinatura `v3`
  também vincula `platform` e `deviceFamily`; o Gateway fixa os metadados pareados na
  reconexão e exige novo pareamento para alterações nos metadados.
- Conexões **não locais** ainda exigem aprovação explícita.
- A autenticação do Gateway (`gateway.auth.*`) ainda se aplica a **todas** as conexões, locais ou
  remotas.

Detalhes: [Protocolo do Gateway](/pt-BR/gateway/protocol), [Pareamento](/pt-BR/channels/pairing),
[Segurança](/pt-BR/gateway/security).

## Tipagem do protocolo e geração de código

- Os esquemas TypeBox definem o protocolo.
- O JSON Schema é gerado com base nesses esquemas.
- Os modelos Swift são gerados com base no JSON Schema.

## Acesso remoto

- Recomendado: Tailscale ou VPN.
- Alternativa: túnel SSH

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
  ```

- O mesmo handshake e token de autenticação se aplicam pelo túnel.
- TLS e fixação opcional de certificado podem ser habilitados para WS em configurações remotas.

## Resumo operacional

- Inicialização: `openclaw gateway` (em primeiro plano, registra logs na saída padrão).
- Integridade: `health` por WS (também incluído em `hello-ok`).
- Supervisão: launchd/systemd para reinicialização automática.

## Invariantes

- Exatamente um Gateway controla uma única sessão do Baileys por host.
- O handshake é obrigatório; qualquer primeiro quadro que não seja JSON ou `connect` causa o encerramento imediato.
- Os eventos não são reproduzidos; os clientes devem atualizar os dados quando houver lacunas.

## Relacionados

- [Loop do agente](/pt-BR/concepts/agent-loop) — ciclo detalhado de execução do agente
- [Protocolo do Gateway](/pt-BR/gateway/protocol) — contrato do protocolo WebSocket
- [Fila](/pt-BR/concepts/queue) — fila de comandos e concorrência
- [Segurança](/pt-BR/gateway/security) — modelo de confiança e proteção
