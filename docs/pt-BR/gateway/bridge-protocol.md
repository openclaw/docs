---
read_when:
    - Criando ou depurando clientes Node (modo Node para iOS/Android/macOS)
    - Investigando falhas de pareamento ou de autenticação da ponte
    - Auditando a superfície de Node exposta pelo Gateway
summary: 'Protocolo de ponte histórico (nós legados): TCP JSONL, emparelhamento, RPC com escopo'
title: Protocolo de ponte
x-i18n:
    generated_at: "2026-05-06T17:55:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
A ponte TCP foi **removida**. As builds atuais do OpenClaw não incluem mais o listener da ponte e as chaves de configuração `bridge.*` não estão mais no esquema. Esta página é mantida apenas para referência histórica. Use o [Protocolo do Gateway](/pt-BR/gateway/protocol) para todos os clientes de Node/operador.
</Warning>

## Por que ela existia

- **Limite de segurança**: a ponte expõe uma pequena allowlist em vez de toda a
  superfície da API do Gateway.
- **Pareamento + identidade do Node**: a admissão de Nodes é controlada pelo Gateway e vinculada
  a um token por Node.
- **UX de descoberta**: Nodes podem descobrir Gateways via Bonjour na LAN ou se conectar
  diretamente por uma tailnet.
- **WS de loopback**: o plano de controle WS completo permanece local, a menos que seja tunelado via SSH.

## Transporte

- TCP, um objeto JSON por linha (JSONL).
- TLS opcional (quando `bridge.tls.enabled` é true).
- A porta histórica padrão do listener era `18790` (as builds atuais não iniciam uma
  ponte TCP).

Quando TLS está habilitado, os registros TXT de descoberta incluem `bridgeTls=1` mais
`bridgeTlsSha256` como uma dica não secreta. Observe que registros TXT Bonjour/mDNS
não são autenticados; clientes não devem tratar a impressão digital anunciada como um
pin autoritativo sem intenção explícita do usuário ou outra verificação fora de banda.

## Handshake + pareamento

1. O cliente envia `hello` com metadados do Node + token (se já pareado).
2. Se não estiver pareado, o Gateway responde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. O cliente envia `pair-request`.
4. O Gateway aguarda aprovação e então envia `pair-ok` e `hello-ok`.

Historicamente, `hello-ok` retornava `serverName` e podia incluir
`canvasHostUrl`.

## Frames

Cliente → Gateway:

- `req` / `res`: RPC do Gateway com escopo (chat, sessões, configuração, integridade, voicewake, skills.bins)
- `event`: sinais do Node (transcrição de voz, solicitação de agente, assinatura de chat, ciclo de vida de exec)

Gateway → Cliente:

- `invoke` / `invoke-res`: comandos do Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: atualizações de chat para sessões assinadas
- `ping` / `pong`: keepalive

A aplicação histórica da allowlist ficava em `src/gateway/server-bridge.ts` (removido).

## Eventos de ciclo de vida de exec

Nodes podem emitir eventos `exec.finished` ou `exec.denied` para expor atividade system.run.
Eles são mapeados para eventos de sistema no Gateway. (Nodes legados ainda podem emitir `exec.started`.)

Campos de payload (todos opcionais, salvo indicação em contrário):

- `sessionKey` (obrigatório): sessão do agente que receberá o evento de sistema.
- `runId`: id de exec exclusivo para agrupamento.
- `command`: string de comando bruta ou formatada.
- `exitCode`, `timedOut`, `success`, `output`: detalhes de conclusão (somente finalizado).
- `reason`: motivo da negação (somente negado).

## Uso histórico da tailnet

- Vincule a ponte a um IP de tailnet: `bridge.bind: "tailnet"` em
  `~/.openclaw/openclaw.json` (somente histórico; `bridge.*` não é mais válido).
- Clientes se conectam via nome MagicDNS ou IP da tailnet.
- Bonjour **não** atravessa redes; use host/porta manual ou DNS-SD de área ampla
  quando necessário.

## Versionamento

A ponte era **v1 implícita** (sem negociação de mín./máx.). Esta seção é
apenas referência histórica; os clientes atuais de Node/operador usam o WebSocket
[Protocolo do Gateway](/pt-BR/gateway/protocol).

## Relacionado

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Nodes](/pt-BR/nodes)
