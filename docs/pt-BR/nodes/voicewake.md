---
read_when:
    - Alterar o comportamento ou os padrões das palavras de ativação por voz
    - Adicionando novas plataformas de nó que precisam de sincronização de palavra de ativação
summary: Palavras de ativação de voz globais (gerenciadas pelo Gateway) e como elas são sincronizadas entre nós
title: Ativação por voz
x-i18n:
    generated_at: "2026-06-27T17:40:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw trata **palavras de ativação como uma única lista global** pertencente ao **Gateway**.

- Não há **palavras de ativação personalizadas por nó**.
- **Qualquer interface de nó/app pode editar** a lista; as alterações são persistidas pelo Gateway e transmitidas para todos.
- macOS e iOS mantêm alternâncias locais para **Voice Wake ativado/desativado** (a UX local + permissões diferem).
- No momento, o Android mantém o Voice Wake desativado e usa um fluxo manual de microfone na aba Voz.

## Armazenamento (host do Gateway)

Palavras de ativação e regras de roteamento são armazenadas no banco de dados de estado do gateway:

- `~/.openclaw/state/openclaw.sqlite`

As tabelas ativas são:

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

Arquivos legados `settings/voicewake.json` e `settings/voicewake-routing.json` são
apenas entradas de migração do doctor; em tempo de execução, a leitura e a escrita usam as tabelas SQLite.

## Protocolo

### Métodos

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` com parâmetros `{ triggers: string[] }` → `{ triggers: string[] }`

Observações:

- Os gatilhos são normalizados (espaços removidos nas extremidades, vazios descartados). Listas vazias retornam aos padrões.
- Limites são aplicados por segurança (limites de contagem/comprimento).

### Métodos de roteamento (gatilho → destino)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` com parâmetros `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

Formato de `VoiceWakeRoutingConfig`:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Os destinos de rota oferecem suporte a exatamente um dos seguintes:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Eventos

- payload de `voicewake.changed` `{ triggers: string[] }`
- payload de `voicewake.routing.changed` `{ config: VoiceWakeRoutingConfig }`

Quem o recebe:

- Todos os clientes WebSocket (app macOS, WebChat etc.)
- Todos os nós conectados (iOS/Android), e também ao conectar um nó como um envio inicial de "estado atual".

## Comportamento do cliente

### App macOS

- Usa a lista global para controlar os gatilhos de `VoiceWakeRuntime`.
- Editar "Palavras de gatilho" nas configurações de Voice Wake chama `voicewake.set` e então depende da transmissão para manter outros clientes sincronizados.

### Nó iOS

- Usa a lista global para a detecção de gatilhos de `VoiceWakeManager`.
- Editar Palavras de ativação nas Configurações chama `voicewake.set` (pelo WS do Gateway) e também mantém a detecção local de palavras de ativação responsiva.

### Nó Android

- Voice Wake está atualmente desativado no runtime/Configurações do Android.
- A voz no Android usa captura manual de microfone na aba Voz em vez de gatilhos por palavra de ativação.

## Relacionado

- [Modo de conversa](/pt-BR/nodes/talk)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
