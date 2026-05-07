---
read_when:
    - Compilando ou depurando clientes Node (modo Node para iOS/Android/macOS)
    - Investigando falhas de emparelhamento ou de autenticação da ponte
    - Auditando a superfície do Node exposta pelo Gateway
summary: 'Protocolo de ponte histórico (nós legados): TCP JSONL, pareamento, RPC com escopo'
title: Protocolo de ponte
x-i18n:
    generated_at: "2026-05-07T13:16:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
A ponte TCP foi **removida**. As builds atuais do OpenClaw não incluem o listener da ponte, e as chaves de configuração `bridge.*` não estão mais no esquema. Esta página é mantida apenas para referência histórica. Use o [Protocolo Gateway](/pt-BR/gateway/protocol) para todos os clientes de Node/operador.
</Warning>

## Por que existia

- **Limite de segurança**: a ponte expõe uma pequena lista de permissões em vez de toda a superfície da API do Gateway.
- **Pareamento + identidade do Node**: a admissão de Node é controlada pelo Gateway e vinculada a um token por Node.
- **UX de descoberta**: os nós podem descobrir gateways via Bonjour na LAN ou se conectar diretamente por uma tailnet.
- **WS de local loopback**: o plano de controle WS completo permanece local, a menos que seja tunelado via SSH.

## Transporte

- TCP, um objeto JSON por linha (JSONL).
- TLS opcional (quando `bridge.tls.enabled` é true).
- A porta histórica padrão do listener era `18790` (as builds atuais não iniciam uma ponte TCP).

Quando TLS está habilitado, os registros TXT de descoberta incluem `bridgeTls=1` mais `bridgeTlsSha256` como uma dica não secreta. Observe que os registros TXT Bonjour/mDNS não são autenticados; os clientes não devem tratar a impressão digital anunciada como um pin autoritativo sem intenção explícita do usuário ou outra verificação fora de banda.

## Handshake + pareamento

1. O cliente envia `hello` com metadados do Node + token (se já estiver pareado).
2. Se não estiver pareado, o Gateway responde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. O cliente envia `pair-request`.
4. O Gateway aguarda aprovação e então envia `pair-ok` e `hello-ok`.

Historicamente, `hello-ok` retornava `serverName`; as superfícies de Plugin hospedadas agora são anunciadas por meio de `pluginSurfaceUrls`. Canvas/A2UI usa `pluginSurfaceUrls.canvas`; o alias obsoleto `canvasHostUrl` não faz parte do protocolo refatorado.

## Quadros

Cliente → Gateway:

- `req` / `res`: RPC do Gateway com escopo (chat, sessões, configuração, integridade, voicewake, skills.bins)
- `event`: sinais do Node (transcrição de voz, solicitação de agente, assinatura de chat, ciclo de vida de exec)

Gateway → Cliente:

- `invoke` / `invoke-res`: comandos de Node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: atualizações de chat para sessões assinadas
- `ping` / `pong`: keepalive

A aplicação legada da lista de permissões ficava em `src/gateway/server-bridge.ts` (removido).

## Eventos do ciclo de vida de exec

Os Nodes podem emitir eventos `exec.finished` ou `exec.denied` para expor a atividade de system.run.
Eles são mapeados para eventos do sistema no Gateway. (Nodes legados ainda podem emitir `exec.started`.)

Campos do payload (todos opcionais, salvo indicação em contrário):

- `sessionKey` (obrigatório): sessão do agente que deve receber o evento do sistema.
- `runId`: id de exec único para agrupamento.
- `command`: string de comando bruta ou formatada.
- `exitCode`, `timedOut`, `success`, `output`: detalhes de conclusão (somente finished).
- `reason`: motivo da negação (somente denied).

## Uso histórico de tailnet

- Vincule a ponte a um IP de tailnet: `bridge.bind: "tailnet"` em
  `~/.openclaw/openclaw.json` (apenas histórico; `bridge.*` não é mais válido).
- Os clientes se conectam via nome MagicDNS ou IP da tailnet.
- Bonjour **não** atravessa redes; use host/porta manual ou DNS-SD de área ampla quando necessário.

## Versionamento

A ponte era **v1 implícita** (sem negociação de mínimo/máximo). Esta seção é apenas referência histórica; os clientes atuais de Node/operador usam o WebSocket
[Protocolo Gateway](/pt-BR/gateway/protocol).

## Relacionado

- [Protocolo Gateway](/pt-BR/gateway/protocol)
- [Nodes](/pt-BR/nodes)
