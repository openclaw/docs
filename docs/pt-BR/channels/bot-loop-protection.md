---
read_when:
    - Configurando mensagens de canal criadas por bots
    - Ajuste da proteção contra loops entre bots
sidebarTitle: Bot loop protection
summary: Padrões de proteção contra loops entre bots e substituições por canal
title: Proteção contra loops de bots
x-i18n:
    generated_at: "2026-07-12T14:53:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

O OpenClaw pode aceitar mensagens escritas por outros bots em canais compatíveis com `allowBots`. Quando esse caminho está habilitado, a proteção contra loops entre pares impede que duas identidades de bot respondam uma à outra indefinidamente.

A proteção é aplicada pelo executor principal de respostas recebidas. Cada canal compatível mapeia seu evento recebido para informações genéricas: conta ou escopo, id da conversa, id do bot remetente e id do bot destinatário. O núcleo rastreia o par de participantes em ambas as direções (A para B e B para A contam como o mesmo par), aplica um limite de janela deslizante e suprime o par durante um período de espera após o limite ser excedido.

## Padrões

A proteção contra loops entre pares fica ativa sempre que um canal permite que mensagens criadas por bots cheguem ao despacho. Padrões integrados:

| Chave                | Padrão  | Significado                                                   |
| -------------------- | ------- | ------------------------------------------------------------- |
| `enabled`            | `true`  | Proteção ativa para os canais compatíveis.                    |
| `maxEventsPerWindow` | `20`    | Eventos que um par de bots pode trocar dentro da janela.      |
| `windowSeconds`      | `60`    | Duração da janela deslizante.                                 |
| `cooldownSeconds`    | `60`    | Tempo de supressão após o par exceder o limite.                |

A proteção não afeta mensagens criadas por humanos, implantações com um único bot, filtragem de mensagens do próprio bot nem respostas de bots que permaneçam abaixo do limite.

## Configurar padrões compartilhados

Defina `channels.defaults.botLoopProtection` uma vez para fornecer a todos os canais compatíveis a mesma configuração de referência. Substituições por canal, conta e sala ainda podem ajustar superfícies individuais.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

Defina `enabled: false` somente quando a política do seu canal permitir intencionalmente conversas entre bots sem supressão automática.

## Substituir por canal, conta ou sala

Os canais compatíveis sobrepõem suas próprias configurações ao padrão compartilhado, chave por chave. Precedência, da mais específica para a menos específica:

1. `channels.<channel>.<room-or-space>.botLoopProtection`, quando o canal é compatível com substituições por conversa
2. `channels.<channel>.accounts.<account>.botLoopProtection`, quando o canal é compatível com contas
3. `channels.<channel>.botLoopProtection`, quando o canal é compatível com padrões de nível superior
4. `channels.defaults.botLoopProtection`
5. padrões integrados

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## Compatibilidade dos canais

- Discord: informações nativas de `author.bot`, indexadas por conta do Discord, canal e par de bots.
- Google Chat: informações nativas de `sender.type=BOT` para mensagens aceitas criadas por bots, indexadas por conta, espaço e par de bots.
- Matrix: contas de bot do Matrix configuradas, indexadas por conta do Matrix, sala e par de bots configurado.
- Slack: informações nativas de `bot_id` para mensagens aceitas criadas por bots, indexadas por conta do Slack, canal e par de bots.

Os canais que não expõem uma identidade confiável do bot remetente continuam usando seus filtros normais de mensagens do próprio bot e de política de acesso. Eles não devem aderir a essa proteção até que consigam identificar ambos os participantes do par de bots.

Consulte [runtime do SDK](/pt-BR/plugins/sdk-runtime#reusable-runtime-utilities) para obter detalhes sobre a implementação do plugin.
