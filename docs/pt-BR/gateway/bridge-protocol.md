---
read_when:
    - Investigando código antigo do cliente Node ou logs arquivados de pareamento
    - Auditando o que a antiga superfície de Node expunha anteriormente
summary: 'Protocolo histórico da ponte (nós legados): JSONL via TCP, emparelhamento, RPC com escopo'
title: Protocolo de ponte
x-i18n:
    generated_at: "2026-07-11T23:56:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
A ponte TCP foi **removida**. As versões atuais do OpenClaw não incluem o listener da ponte, e as chaves de configuração `bridge.*` não fazem mais parte do esquema. Esta página serve apenas como referência histórica. Use o [protocolo do Gateway](/pt-BR/gateway/protocol) para todos os clientes de nó/operador.
</Warning>

## Por que ela existia

- **Limite de segurança**: expunha uma pequena lista de permissões em vez de toda a superfície da API do Gateway.
- **Emparelhamento + identidade do nó**: a admissão do nó era controlada pelo Gateway e vinculada a um token específico por nó.
- **Experiência de descoberta**: os nós podiam descobrir Gateways via Bonjour na LAN ou se conectar diretamente por uma tailnet.
- **WS em local loopback**: todo o plano de controle por WS permanecia local, a menos que fosse encapsulado via SSH.

## Transporte

- TCP, um objeto JSON por linha (JSONL).
- TLS opcional (`bridge.tls.enabled: true`).
- A porta padrão do listener era `18790`.

Quando o TLS estava habilitado, os registros TXT de descoberta incluíam `bridgeTls=1` e `bridgeTlsSha256` como uma indicação não secreta. Os registros TXT do Bonjour/mDNS não são autenticados; os clientes não podiam tratar a impressão digital anunciada como uma fixação autoritativa sem outra verificação fora de banda.

## Handshake e emparelhamento

1. O cliente envia `hello` com os metadados do nó e o token (se já estiver emparelhado).
2. Se não estiver emparelhado, o Gateway responde com `error` (`NOT_PAIRED` / `UNAUTHORIZED`).
3. O cliente envia `pair-request`.
4. O Gateway aguarda aprovação e então envia `pair-ok` e `hello-ok`.

`hello-ok` retornava `serverName`; as superfícies de Plugin hospedadas agora são anunciadas por meio de `pluginSurfaceUrls` no protocolo atual do Gateway (Canvas/A2UI usa `pluginSurfaceUrls.canvas`).

## Quadros

Do cliente para o Gateway:

- `req` / `res`: RPC do Gateway com escopo limitado (chat, sessões, configuração, integridade, voicewake, skills.bins).
- `event`: sinais do nó (transcrição de voz, solicitação do agente, inscrição no chat, ciclo de vida da execução).

Do Gateway para o cliente:

- `invoke` / `invoke-res`: comandos do nó (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event`: atualizações do chat para sessões inscritas.
- `ping` / `pong`: manutenção da conexão.

A aplicação da lista de permissões ficava em `src/gateway/server-bridge.ts` (removido).

## Eventos do ciclo de vida da execução

Os nós emitiam `exec.finished` para expor atividades concluídas de `system.run`, mapeadas para eventos do sistema pelo Gateway (nós legados também podiam emitir `exec.started`). `exec.denied` marcava uma tentativa negada de `system.run` como uma negação terminal, sem enfileirar um evento do sistema nem despertar o trabalho do agente.

Campos da carga útil (todos opcionais, salvo indicação em contrário):

| Campo                            | Observações                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `sessionKey`                     | Obrigatório. Sessão do agente para correlação do evento e, para `exec.finished`, entrega do evento do sistema. |
| `runId`                          | ID exclusivo da execução para agrupamento.                                                                 |
| `command`                        | String do comando bruto ou formatado.                                                                      |
| `exitCode`, `timedOut`, `output` | Detalhes da conclusão (somente para conclusão).                                                             |
| `reason`                         | Motivo da negação (somente para negação).                                                                   |

## Uso histórico da tailnet

- Vinculava a ponte a um IP da tailnet: `bridge.bind: "tailnet"` em `~/.openclaw/openclaw.json` (apenas histórico; `bridge.*` não é mais uma configuração válida).
- Os clientes se conectavam pelo nome MagicDNS ou pelo IP da tailnet.
- O Bonjour não atravessa redes; caso contrário, era necessário usar DNS-SD de longa distância ou um host/porta manual.

## Versionamento

A ponte usava implicitamente a v1, sem negociação de mínimo/máximo. Os clientes atuais de nó/operador usam o [protocolo do Gateway](/pt-BR/gateway/protocol) WebSocket, que negocia um intervalo de versões do protocolo.

## Relacionados

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Nós](/pt-BR/nodes)
