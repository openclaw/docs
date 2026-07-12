---
read_when:
    - Investigando código antigo do cliente Node ou logs de emparelhamento arquivados
    - Auditando o que a interface legada do Node costumava expor
summary: 'Protocolo de ponte histórico (nós legados): JSONL sobre TCP, pareamento, RPC com escopo'
title: Protocolo da ponte
x-i18n:
    generated_at: "2026-07-12T15:08:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
A ponte TCP foi **removida**. As versões atuais do OpenClaw não incluem o listener da ponte, e as chaves de configuração `bridge.*` não fazem mais parte do esquema. Esta página serve apenas como referência histórica. Use o [protocolo do Gateway](/pt-BR/gateway/protocol) para todos os clientes de Node/operador.
</Warning>

## Por que ela existia

- **Limite de segurança**: expunha uma pequena lista de permissões em vez de toda a superfície da API do Gateway.
- **Emparelhamento + identidade do Node**: a admissão de Nodes era controlada pelo Gateway e vinculada a um token por Node.
- **Experiência de descoberta**: os Nodes podiam descobrir Gateways via Bonjour na LAN ou se conectar diretamente por uma tailnet.
- **WS em loopback**: o plano de controle WS completo permanecia local, a menos que fosse encapsulado via SSH.

## Transporte

- TCP, um objeto JSON por linha (JSONL).
- TLS opcional (`bridge.tls.enabled: true`).
- A porta padrão do listener era `18790`.

Quando o TLS estava habilitado, os registros TXT de descoberta incluíam `bridgeTls=1` e `bridgeTlsSha256` como uma indicação não secreta. Os registros TXT do Bonjour/mDNS não são autenticados; os clientes não podiam tratar a impressão digital anunciada como um pin autoritativo sem outra verificação fora de banda.

## Handshake e emparelhamento

1. O cliente envia `hello` com os metadados do Node e o token (se já estiver emparelhado).
2. Se não estiver emparelhado, o Gateway responde com `error` (`NOT_PAIRED` / `UNAUTHORIZED`).
3. O cliente envia `pair-request`.
4. O Gateway aguarda aprovação e, em seguida, envia `pair-ok` e `hello-ok`.

`hello-ok` retornava `serverName`; as superfícies de Plugin hospedadas agora são anunciadas por meio de `pluginSurfaceUrls` no protocolo atual do Gateway (Canvas/A2UI usa `pluginSurfaceUrls.canvas`).

## Frames

Do cliente para o Gateway:

- `req` / `res`: RPC do Gateway com escopo limitado (chat, sessões, configuração, integridade, voicewake, skills.bins).
- `event`: sinais do Node (transcrição de voz, solicitação do agente, assinatura de chat, ciclo de vida de execução).

Do Gateway para o cliente:

- `invoke` / `invoke-res`: comandos do Node (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event`: atualizações de chat para sessões assinadas.
- `ping` / `pong`: manutenção da conexão.

A aplicação da lista de permissões ficava em `src/gateway/server-bridge.ts` (removido).

## Eventos do ciclo de vida de execução

Os Nodes emitiam `exec.finished` para expor atividades concluídas de `system.run`, mapeadas para eventos do sistema pelo Gateway (Nodes legados também podiam emitir `exec.started`). `exec.denied` marcava uma tentativa negada de `system.run` como uma negação terminal, sem enfileirar um evento do sistema nem despertar o trabalho do agente.

Campos do payload (todos opcionais, exceto quando indicado):

| Campo                            | Observações                                                                                                     |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `sessionKey`                     | Obrigatório. Sessão do agente para correlação de eventos e, no caso de `exec.finished`, entrega do evento do sistema. |
| `runId`                          | ID de execução exclusivo para agrupamento.                                                                      |
| `command`                        | String de comando bruta ou formatada.                                                                           |
| `exitCode`, `timedOut`, `output` | Detalhes da conclusão (somente para conclusão).                                                                  |
| `reason`                         | Motivo da negação (somente para negação).                                                                        |

## Uso histórico em tailnet

- Vincule a ponte a um IP da tailnet: `bridge.bind: "tailnet"` em `~/.openclaw/openclaw.json` (somente para referência histórica; `bridge.*` não é mais uma configuração válida).
- Os clientes se conectavam por meio do nome MagicDNS ou do IP da tailnet.
- O Bonjour não atravessa redes; caso contrário, era necessário usar DNS-SD de longa distância ou especificar manualmente o host e a porta.

## Versionamento

A ponte usava implicitamente a versão v1, sem negociação de versão mínima/máxima. Os clientes atuais de Node/operador usam o [protocolo WebSocket do Gateway](/pt-BR/gateway/protocol), que negocia um intervalo de versões do protocolo.

## Relacionados

- [Protocolo do Gateway](/pt-BR/gateway/protocol)
- [Nodes](/pt-BR/nodes)
