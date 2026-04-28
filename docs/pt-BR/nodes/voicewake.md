---
read_when:
- Alterando o comportamento ou os padrões de palavras de ativação por voz
- Adding new node platforms that need wake word sync
summary: Palavras de ativação globais de voz (controladas pelo Gateway) e como elas
  sincronizam entre Nodes
title: Ativação por voz
x-i18n:
  generated_at: '2026-04-26T11:33:18Z'
  refreshed_at: '2026-04-28T04:45:00Z'
  model: gpt-5.4
  provider: openai
  source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
  source_path: nodes/voicewake.md
  workflow: 15
---

O OpenClaw trata **palavras de ativação como uma única lista global** controlada pelo **Gateway**.

- Não há **palavras de ativação personalizadas por Node**.
- **Qualquer UI de node/app pode editar** a lista; as alterações são persistidas pelo Gateway e transmitidas para todos.
- macOS e iOS mantêm toggles locais de **Voice Wake ativado/desativado** (a UX local + permissões diferem).
- O Android atualmente mantém o Voice Wake desativado e usa um fluxo manual de microfone na aba Voice.

## Armazenamento (host do Gateway)

As palavras de ativação são armazenadas na máquina do gateway em:

- `~/.openclaw/settings/voicewake.json`

Formato:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## Protocolo

### Métodos

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` com parâmetros `{ triggers: string[] }` → `{ triggers: string[] }`

Observações:

- Os triggers são normalizados (espaços removidos, vazios descartados). Listas vazias usam fallback para os padrões.
- Limites são aplicados por segurança (limites de contagem/comprimento).

### Métodos de roteamento (trigger → destino)

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

Os destinos de rota oferecem suporte a exatamente um de:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### Eventos

- `voicewake.changed` payload `{ triggers: string[] }`
- `voicewake.routing.changed` payload `{ config: VoiceWakeRoutingConfig }`

Quem recebe:

- Todos os clientes WebSocket (app do macOS, WebChat etc.)
- Todos os Nodes conectados (iOS/Android), e também na conexão do node como um push inicial do “estado atual”.

## Comportamento do cliente

### App do macOS

- Usa a lista global para controlar triggers de `VoiceWakeRuntime`.
- Editar “Trigger words” nas configurações de Voice Wake chama `voicewake.set` e depois depende da transmissão para manter outros clientes sincronizados.

### Node iOS

- Usa a lista global para detecção de trigger em `VoiceWakeManager`.
- Editar Wake Words em Settings chama `voicewake.set` (pelo Gateway WS) e também mantém a detecção local de palavras de ativação responsiva.

### Node Android

- O Voice Wake está atualmente desativado no runtime/Settings do Android.
- A voz no Android usa captura manual de microfone na aba Voice em vez de triggers de palavra de ativação.

## Relacionado

- [Modo Talk](/pt-BR/nodes/talk)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
- [Entendimento de mídia](/pt-BR/nodes/media-understanding)
