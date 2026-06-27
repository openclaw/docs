---
read_when:
    - Criando ou depurando clientes de nó (modo de nó iOS/Android/macOS)
    - Investigando falhas de pareamento ou autenticação de ponte
    - Auditando a superfície de Node exposta pelo gateway
summary: 'Protocolo de ponte histórica (nós legados): TCP JSONL, pareamento, RPC com escopo'
title: Protocolo de ponte
x-i18n:
    generated_at: "2026-06-27T17:28:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
A ponte TCP foi **removida**. As compilações atuais do OpenClaw não incluem o listener da ponte, e as chaves de configuração `bridge.*` não estão mais no esquema. Esta página é mantida apenas para referência histórica. Use o [Protocolo do Gateway](/pt-BR/gateway/protocol) para todos os clientes de nó/operador.
</Warning>

## Por que ela existia

- **Limite de segurança**: a ponte expõe uma pequena lista de permissões em vez de toda a superfície da API do gateway.
- **Emparelhamento + identidade do nó**: a admissão do nó é controlada pelo gateway e vinculada a um token por nó.
- **UX de descoberta**: nós podem descobrir gateways via Bonjour na LAN ou conectar diretamente por uma tailnet.
- **WS de loopback**: o plano de controle WS completo permanece local, a menos que seja tunelado via SSH.

## Transporte

- TCP, um objeto JSON por linha (JSONL).
- TLS opcional (quando `bridge.tls.enabled` é true).
- A porta histórica padrão do listener era `18790` (compilações atuais não iniciam uma ponte TCP).

Quando TLS está habilitado, registros TXT de descoberta incluem `bridgeTls=1` mais `bridgeTlsSha256` como uma dica não secreta. Observe que registros TXT Bonjour/mDNS não são autenticados; clientes não devem tratar a impressão digital anunciada como um pin autoritativo sem intenção explícita do usuário ou outra verificação fora de banda.

## Handshake + emparelhamento

1. O cliente envia `hello` com metadados do nó + token (se já estiver emparelhado).
2. Se não estiver emparelhado, o gateway responde `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. O cliente envia `pair-request`.
4. O gateway aguarda aprovação e então envia `pair-ok` e `hello-ok`.

Historicamente, `hello-ok` retornava `serverName`; superfícies de plugin hospedadas agora são anunciadas por meio de `pluginSurfaceUrls`. Canvas/A2UI usa `pluginSurfaceUrls.canvas`; o alias obsoleto `canvasHostUrl` não faz parte do protocolo refatorado.

## Quadros

Cliente → Gateway:

- `req` / `res`: RPC do gateway com escopo (chat, sessões, configuração, integridade, voicewake, skills.bins)
- `event`: sinais do nó (transcrição de voz, solicitação de agente, assinatura de chat, ciclo de vida de exec)

Gateway → Cliente:

- `invoke` / `invoke-res`: comandos de nó (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`)
- `event`: atualizações de chat para sessões assinadas
- `ping` / `pong`: keepalive

A aplicação legada da lista de permissões ficava em `src/gateway/server-bridge.ts` (removido).

## Eventos do ciclo de vida de exec

Nós podem emitir eventos `exec.finished` para expor atividade `system.run` concluída. Eles são mapeados para eventos de sistema no gateway. (Nós legados ainda podem emitir `exec.started`.)
Nós podem emitir `exec.denied` para tentativas negadas de `system.run`; o gateway aceita o evento como uma negação terminal e não enfileira um evento de sistema nem desperta trabalho de agente.

Campos de payload (todos opcionais, salvo indicação em contrário):

- `sessionKey` (obrigatório): sessão de agente para correlação do evento e, para `exec.finished`, entrega do evento de sistema.
- `runId`: ID único de exec para agrupamento.
- `command`: string de comando bruta ou formatada.
- `exitCode`, `timedOut`, `success`, `output`: detalhes de conclusão (somente finished).
- `reason`: motivo da negação (somente denied).

## Uso histórico de tailnet

- Vincule a ponte a um IP de tailnet: `bridge.bind: "tailnet"` em `~/.openclaw/openclaw.json` (apenas histórico; `bridge.*` não é mais válido).
- Clientes se conectam via nome MagicDNS ou IP de tailnet.
- Bonjour **não** atravessa redes; use host/porta manual ou DNS-SD de área ampla quando necessário.

## Versionamento

A ponte era **v1 implícita** (sem negociação min/max). Esta seção é apenas referência histórica; clientes de nó/operador atuais usam o [Protocolo do Gateway](/pt-BR/gateway/protocol) via WebSocket.

## Relacionado

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Nós](/pt-BR/nodes)
