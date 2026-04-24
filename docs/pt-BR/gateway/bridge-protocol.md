---
read_when:
    - Criar ou depurar clientes de Node (modo Node de iOS/Android/macOS)
    - Investigar falhas de pareamento ou autenticação do bridge
    - Auditar a superfície de Node exposta pelo gateway
summary: 'Protocolo bridge histórico (Nodes legados): TCP JSONL, pareamento, RPC com escopo'
title: Protocolo Bridge
x-i18n:
    generated_at: "2026-04-24T05:50:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b2a54f439e586ea7e535cedae4a07c365f95702835b05ba5a779d590dcf967e
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

# Protocolo Bridge (transporte legado de Node)

<Warning>
O bridge TCP foi **removido**. As versões atuais do OpenClaw não incluem o listener do bridge e as chaves de configuração `bridge.*` não fazem mais parte do schema. Esta página é mantida apenas como referência histórica. Use o [Protocolo do Gateway](/pt-BR/gateway/protocol) para todos os clientes de node/operator.
</Warning>

## Por que ele existia

- **Limite de segurança**: o bridge expõe uma pequena allowlist em vez de toda a
  superfície da API do gateway.
- **Pareamento + identidade do node**: a admissão de node é controlada pelo gateway e vinculada
  a um token por node.
- **UX de descoberta**: nodes podem descobrir gateways via Bonjour na LAN ou se conectar
  diretamente por uma tailnet.
- **WS de loopback**: o plano de controle WS completo permanece local, a menos que seja tunelado via SSH.

## Transporte

- TCP, um objeto JSON por linha (JSONL).
- TLS opcional (quando `bridge.tls.enabled` é true).
- A porta padrão histórica do listener era `18790` (as versões atuais não iniciam um
  bridge TCP).

Quando o TLS está ativado, os registros TXT de descoberta incluem `bridgeTls=1` mais
`bridgeTlsSha256` como uma dica não secreta. Observe que registros TXT de Bonjour/mDNS não são
autenticados; clientes não devem tratar a impressão digital anunciada como um pin autoritativo sem intenção explícita do usuário ou outra verificação fora de banda.

## Handshake + pareamento

1. O cliente envia `hello` com metadados do node + token (se já estiver pareado).
2. Se não estiver pareado, o gateway responde com `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. O cliente envia `pair-request`.
4. O gateway aguarda aprovação e então envia `pair-ok` e `hello-ok`.

Historicamente, `hello-ok` retornava `serverName` e podia incluir
`canvasHostUrl`.

## Frames

Cliente → Gateway:

- `req` / `res`: RPC do gateway com escopo (`chat`, `sessions`, `config`, `health`, `voicewake`, `skills.bins`)
- `event`: sinais do node (transcrição de voz, solicitação do agente, assinatura de chat, ciclo de vida de exec)

Gateway → Cliente:

- `invoke` / `invoke-res`: comandos de node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: atualizações de chat para sessões assinadas
- `ping` / `pong`: keepalive

A aplicação legada de allowlist ficava em `src/gateway/server-bridge.ts` (removido).

## Eventos de ciclo de vida de exec

Nodes podem emitir eventos `exec.finished` ou `exec.denied` para expor atividade de `system.run`.
Eles são mapeados para eventos do sistema no gateway. (Nodes legados ainda podem emitir `exec.started`.)

Campos do payload (todos opcionais, salvo indicação em contrário):

- `sessionKey` (obrigatório): sessão do agente que receberá o evento do sistema.
- `runId`: id único de exec para agrupamento.
- `command`: string de comando bruta ou formatada.
- `exitCode`, `timedOut`, `success`, `output`: detalhes de conclusão (apenas para finished).
- `reason`: motivo da negação (apenas para denied).

## Uso histórico de tailnet

- Vincule o bridge a um IP de tailnet: `bridge.bind: "tailnet"` em
  `~/.openclaw/openclaw.json` (apenas histórico; `bridge.*` não é mais válido).
- Clientes se conectam via nome MagicDNS ou IP da tailnet.
- O Bonjour **não** atravessa redes; use host/porta manuais ou DNS-SD de área ampla
  quando necessário.

## Controle de versão

O bridge era um **v1 implícito** (sem negociação de mín/máx). Esta seção é
apenas referência histórica; clientes atuais de node/operator usam o WebSocket
[Protocolo do Gateway](/pt-BR/gateway/protocol).

## Relacionado

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Nodes](/pt-BR/nodes)
