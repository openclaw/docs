---
read_when:
    - Desenvolver ou depurar clientes de Node (modo Node em iOS/Android/macOS)
    - Investigar falhas de pareamento ou autenticação de bridge
    - Auditar a superfície de Node exposta pelo gateway
summary: 'Protocolo histórico de bridge (Nodes legados): TCP JSONL, pareamento, RPC com escopo'
title: Protocolo de bridge
x-i18n:
    generated_at: "2026-04-25T13:45:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
A bridge TCP foi **removida**. As builds atuais do OpenClaw não incluem o listener da bridge e as chaves de configuração `bridge.*` não fazem mais parte do schema. Esta página é mantida apenas para referência histórica. Use o [Gateway Protocol](/pt-BR/gateway/protocol) para todos os clientes de Node/operador.
</Warning>

## Por que ela existia

- **Limite de segurança**: a bridge expõe uma pequena allowlist em vez de toda a
  superfície de API do gateway.
- **Pareamento + identidade do Node**: a admissão de Node é controlada pelo gateway e vinculada
  a um token por Node.
- **UX de descoberta**: Nodes podem descobrir gateways via Bonjour na LAN ou se conectar
  diretamente por uma tailnet.
- **WS em loopback**: o plano de controle WS completo permanece local, a menos que seja tunelado via SSH.

## Transporte

- TCP, um objeto JSON por linha (JSONL).
- TLS opcional (quando `bridge.tls.enabled` é true).
- Historicamente, a porta padrão do listener era `18790` (as builds atuais não iniciam uma
  bridge TCP).

Quando o TLS está habilitado, registros TXT de descoberta incluem `bridgeTls=1` mais
`bridgeTlsSha256` como uma dica não secreta. Observe que registros TXT de Bonjour/mDNS não são
autenticados; clientes não devem tratar a impressão digital anunciada como um pin autoritativo sem intenção explícita do usuário ou outra verificação fora de banda.

## Handshake + pareamento

1. O cliente envia `hello` com metadados do Node + token (se já estiver pareado).
2. Se não estiver pareado, o gateway responde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. O cliente envia `pair-request`.
4. O gateway aguarda aprovação e, em seguida, envia `pair-ok` e `hello-ok`.

Historicamente, `hello-ok` retornava `serverName` e podia incluir
`canvasHostUrl`.

## Frames

Cliente → Gateway:

- `req` / `res`: RPC do gateway com escopo (chat, sessions, config, health, voicewake, skills.bins)
- `event`: sinais do Node (transcrição de voz, solicitação do agente, assinatura de chat, ciclo de vida de exec)

Gateway → Cliente:

- `invoke` / `invoke-res`: comandos do Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: atualizações de chat para sessões assinadas
- `ping` / `pong`: keepalive

A aplicação histórica da allowlist ficava em `src/gateway/server-bridge.ts` (removido).

## Eventos do ciclo de vida de exec

Nodes podem emitir eventos `exec.finished` ou `exec.denied` para expor a atividade de system.run.
Eles são mapeados para eventos do sistema no gateway. (Nodes legados ainda podem emitir `exec.started`.)

Campos do payload (todos opcionais, salvo indicação em contrário):

- `sessionKey` (obrigatório): sessão do agente que deve receber o evento do sistema.
- `runId`: id exclusivo de exec para agrupamento.
- `command`: string de comando bruta ou formatada.
- `exitCode`, `timedOut`, `success`, `output`: detalhes de conclusão (apenas finished).
- `reason`: motivo da negação (apenas denied).

## Uso histórico em tailnet

- Vincule a bridge a um IP da tailnet: `bridge.bind: "tailnet"` em
  `~/.openclaw/openclaw.json` (apenas histórico; `bridge.*` não é mais válido).
- Clientes se conectam por nome MagicDNS ou IP da tailnet.
- Bonjour **não** atravessa redes; use host/porta manual ou DNS‑SD de área ampla
  quando necessário.

## Versionamento

A bridge era **v1 implícita** (sem negociação min/max). Esta seção é
apenas referência histórica; os clientes atuais de Node/operador usam o WebSocket
[Gateway Protocol](/pt-BR/gateway/protocol).

## Relacionado

- [Gateway protocol](/pt-BR/gateway/protocol)
- [Nodes](/pt-BR/nodes)
