---
read_when:
    - Alterando o comportamento ou os padrões de palavras de ativação por voz
    - Adicionando novas plataformas de Node que precisam de sincronização de palavras de ativação
summary: Palavras de ativação de voz globais (controladas pelo Gateway) e como elas sincronizam entre os Nodes
title: Ativação por voz
x-i18n:
    generated_at: "2026-04-24T05:59:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5094c17aaa7f868beb81d04f7dc60565ded1852cc5c835a33de64dbd3da74bb4
    source_path: nodes/voicewake.md
    workflow: 15
---

O OpenClaw trata **palavras de ativação** como uma única lista global controlada pelo **Gateway**.

- **Não existem palavras de ativação personalizadas por Node**.
- **Qualquer UI de Node/app pode editar** a lista; as alterações são persistidas pelo Gateway e transmitidas para todos.
- macOS e iOS mantêm toggles locais de **Voice Wake ativado/desativado** (a UX local + permissões são diferentes).
- Atualmente, o Android mantém o Voice Wake desativado e usa um fluxo manual de microfone na aba Voice.

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

- Os triggers são normalizados (espaços removidos nas pontas, vazios descartados). Listas vazias usam fallback para os padrões.
- Limites são aplicados por segurança (limites de contagem/comprimento).

### Eventos

- payload de `voicewake.changed` `{ triggers: string[] }`

Quem recebe:

- Todos os clientes WebSocket (app macOS, WebChat etc.)
- Todos os Nodes conectados (iOS/Android), e também no momento da conexão do Node como um push inicial do “estado atual”.

## Comportamento do cliente

### app macOS

- Usa a lista global para controlar triggers de `VoiceWakeRuntime`.
- Editar “Trigger words” nas configurações de Voice Wake chama `voicewake.set` e depois depende da transmissão para manter outros clientes sincronizados.

### Node iOS

- Usa a lista global para detecção de trigger em `VoiceWakeManager`.
- Editar Wake Words em Settings chama `voicewake.set` (pela WS do Gateway) e também mantém responsiva a detecção local de palavras de ativação.

### Node Android

- O Voice Wake está atualmente desativado no runtime/Settings do Android.
- A voz no Android usa captura manual de microfone na aba Voice em vez de triggers por palavra de ativação.

## Relacionado

- [Modo de conversa](/pt-BR/nodes/talk)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
- [Entendimento de mídia](/pt-BR/nodes/media-understanding)
