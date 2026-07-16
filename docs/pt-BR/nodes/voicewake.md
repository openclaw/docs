---
read_when:
    - Alteração do comportamento ou dos padrões das palavras de ativação por voz
    - Adição de novas plataformas de Node que precisam de sincronização da palavra de ativação
summary: Palavras de ativação por voz globais (gerenciadas pelo Gateway) e como são sincronizadas entre os nodes
title: Ativação por voz
x-i18n:
    generated_at: "2026-07-16T12:39:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

As palavras de ativação são **uma única lista global pertencente ao Gateway** — não há listas personalizadas por Node. Qualquer Node ou interface de aplicativo pode editar a lista; o Gateway persiste a alteração e a transmite a todos os clientes conectados.

- **macOS**: controle local para ativar/desativar a ativação por voz. Requer macOS 26+; consulte [Ativação por voz (macOS)](/pt-BR/platforms/mac/voicewake) para obter detalhes sobre runtime/PTT.
- **iOS**: controle local para ativar/desativar a ativação por voz em Ajustes.
- **Android**: controle local para ativar/desativar a ativação por voz e editor de palavras de ativação em Configurações → Voz. Requer reconhecimento de fala no dispositivo Android.

## Armazenamento

As palavras de ativação e as regras de roteamento ficam no banco de dados de estado do Gateway, `~/.openclaw/state/openclaw.sqlite` por padrão (substitua com `OPENCLAW_STATE_DIR`), nas tabelas `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`. Os arquivos legados `settings/voicewake.json` e `settings/voicewake-routing.json` são apenas entradas de migração de `openclaw doctor --fix` — o runtime nunca os lê.

## Protocolo

### Lista de acionadores

| Método          | Parâmetros               | Resultado                |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | nenhum                   | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` normaliza a entrada: remove espaços em branco nas extremidades, descarta entradas vazias, mantém no máximo 32 acionadores e trunca cada um para 64 unidades de código UTF-16 sem dividir pares substitutos. Um resultado vazio retorna aos padrões integrados (`openclaw`, `claude`, `computer`).

### Roteamento (do acionador ao destino)

| Método                  | Parâmetros                           | Resultado                            |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | nenhum                               | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

Cada `target` de rota aceita exatamente um dos seguintes:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Limites: no máximo 32 rotas, com texto do acionador de no máximo 64 caracteres. Os acionadores das rotas são normalizados para correspondência e detecção de duplicatas por meio da conversão para letras minúsculas, da remoção da pontuação no início e no fim de cada palavra e da redução de espaços em branco consecutivos (`"Hey, Bot!!"` e `"hey bot"` correspondem e são considerados duplicatas) — essa normalização é mais rigorosa que a simples remoção de espaços nas extremidades usada para a lista global de acionadores acima.

### Eventos

| Evento                      | Conteúdo                             |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Ambos são transmitidos a todos os clientes WebSocket com escopo de leitura (aplicativo para macOS, WebChat e semelhantes) e a todos os Nodes conectados. Um Node também recebe ambos como um envio inicial de snapshot logo após se conectar.

## Comportamento dos clientes

- **macOS**: chama `voicewake.set`/`voicewake.get` e escuta `voicewake.changed` para permanecer sincronizado com outros clientes.
- **iOS**: chama `voicewake.set`/`voicewake.get` e escuta `voicewake.changed` para manter responsiva a detecção local de palavras de ativação.
- **Android**: chama `voicewake.set`/`voicewake.get`, escuta `voicewake.changed` e anuncia `voiceWake` enquanto está ativado. O reconhecimento permanece no dispositivo e funciona somente em primeiro plano; ele é pausado enquanto o Talk, o ditado manual, a captura de notas de voz ou a fala de mensagens controla o áudio.

## Relacionados

- [Modo Talk](/pt-BR/nodes/talk)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
