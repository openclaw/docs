---
read_when:
    - Alteração do comportamento ou dos padrões das palavras de ativação por voz
    - Adição de novas plataformas de Node que precisam de sincronização da palavra de ativação
summary: Palavras de ativação por voz globais (gerenciadas pelo Gateway) e como são sincronizadas entre os nós
title: Ativação por voz
x-i18n:
    generated_at: "2026-07-12T15:24:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8a8c7a8bb2ee5bbc57d9141cd8f2176246cc61952b0ed42257f83af2c777427
    source_path: nodes/voicewake.md
    workflow: 16
---

As palavras de ativação são **uma única lista global pertencente ao Gateway** — não há listas personalizadas por Node. Qualquer Node ou interface do aplicativo pode editar a lista; o Gateway persiste a alteração e a transmite a todos os clientes conectados.

- **macOS**: controle local para ativar/desativar a Ativação por Voz. Requer macOS 26+; consulte [Ativação por voz (macOS)](/pt-BR/platforms/mac/voicewake) para obter detalhes sobre runtime/PTT.
- **iOS**: controle local para ativar/desativar a Ativação por Voz em Settings.
- **Android**: não implementa a Ativação por Voz. A guia Voice usa a captura manual do microfone em vez de acionadores por palavra de ativação.

## Armazenamento

As palavras de ativação e as regras de roteamento ficam no banco de dados de estado do Gateway, `~/.openclaw/state/openclaw.sqlite` por padrão (substitua com `OPENCLAW_STATE_DIR`), nas tabelas `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`. Os arquivos legados `settings/voicewake.json` e `settings/voicewake-routing.json` são apenas entradas de migração para `openclaw doctor --fix` — o runtime nunca os lê.

## Protocolo

### Lista de acionadores

| Método          | Parâmetros               | Resultado                |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | nenhum                   | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set` normaliza a entrada: remove espaços em branco no início e no fim, descarta entradas vazias, mantém no máximo 32 acionadores e trunca cada um para 64 unidades de código UTF-16 sem dividir pares substitutos. Um resultado vazio reverte para os valores padrão integrados (`openclaw`, `claude`, `computer`).

### Roteamento (do acionador para o destino)

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

Cada `target` de rota oferece suporte a exatamente uma das opções:

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

Limites: no máximo 32 rotas e texto do acionador com no máximo 64 caracteres. Para correspondência e detecção de duplicatas, os acionadores de rota são normalizados convertendo-os em letras minúsculas, removendo a pontuação inicial e final de cada palavra e reduzindo espaços em branco consecutivos (`"Hey, Bot!!"` e `"hey bot"` correspondem e são contabilizados como duplicatas) — essa normalização é mais rigorosa do que a simples remoção de espaços no início e no fim usada para a lista global de acionadores acima.

### Eventos

| Evento                      | Conteúdo                             |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

Ambos são transmitidos a todos os clientes WebSocket com escopo de leitura (aplicativo para macOS, WebChat e similares) e a todos os Nodes conectados. Um Node também recebe ambos como um envio de estado inicial logo após se conectar.

## Comportamento dos clientes

- **macOS**: chama `voicewake.set`/`voicewake.get` e monitora `voicewake.changed` para permanecer sincronizado com outros clientes.
- **iOS**: chama `voicewake.set`/`voicewake.get` e monitora `voicewake.changed` para manter responsiva a detecção local de palavras de ativação.
- **Android**: não anuncia o recurso `voiceWake` nem consome atualizações de palavras de ativação.

## Relacionado

- [Modo de conversa](/pt-BR/nodes/talk)
- [Áudio e mensagens de voz](/pt-BR/nodes/audio)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
