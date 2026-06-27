---
read_when:
    - Configurando mensagens de canal criadas por bots
    - Ajuste da proteção contra loops entre bots
sidebarTitle: Bot loop protection
summary: Proteção contra loops de bot para bot padrão e substituições de canal
title: Proteção contra loops de bots
x-i18n:
    generated_at: "2026-06-27T17:09:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# Proteção contra loops de bots

O OpenClaw pode aceitar mensagens escritas por outros bots em canais que dão suporte a `allowBots`.
Quando esse caminho está habilitado, a proteção contra loops por par impede que duas identidades de bot
respondam uma à outra indefinidamente.

A proteção é aplicada pelo executor central de respostas de entrada. Cada canal compatível
mapeia seu próprio evento de entrada para fatos genéricos: conta ou escopo, id da conversa,
id do bot remetente e id do bot destinatário. Então o núcleo rastreia o par de participantes nas duas
direções, aplica um orçamento de janela deslizante e suprime o par durante um
cooldown depois que o orçamento é excedido.

## Padrões

A proteção contra loops por par fica ativa quando um canal permite que mensagens escritas por bots cheguem ao
despacho. Os padrões integrados são:

- `maxEventsPerWindow: 20` - um par de bots pode trocar 20 eventos dentro da janela
- `windowSeconds: 60` - duração da janela deslizante
- `cooldownSeconds: 60` - tempo de supressão depois que o par excede o orçamento

A proteção não afeta mensagens normais escritas por humanos, implantações com um único bot,
filtragem de mensagens próprias nem respostas únicas de bot que permaneçam abaixo do orçamento.

## Configurar padrões compartilhados

Defina `channels.defaults.botLoopProtection` uma vez para dar a todos os canais compatíveis
a mesma linha de base. Substituições por canal e por conta ainda podem ajustar superfícies
individuais.

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

Defina `enabled: false` apenas quando a política do seu canal permitir intencionalmente
conversas bot a bot sem supressão automática.

## Substituir por canal ou conta

Canais compatíveis sobrepõem sua própria configuração ao padrão compartilhado. A precedência é:

- `channels.<channel>.<room-or-space>.botLoopProtection`, quando o canal oferece suporte a substituições por conversa
- `channels.<channel>.accounts.<account>.botLoopProtection`, quando o canal oferece suporte a contas
- `channels.<channel>.botLoopProtection`, quando o canal oferece suporte a padrões de nível superior
- `channels.defaults.botLoopProtection`
- padrões integrados

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
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
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
  },
}
```

## Suporte por canal

- Discord: fatos nativos de `author.bot`, indexados por conta do Discord, canal e par de bots.
- Slack: fatos nativos de `bot_id` para mensagens aceitas escritas por bots, indexados por conta do Slack, canal e par de bots.
- Matrix: contas de bot do Matrix configuradas, indexadas por conta do Matrix, sala e par de bots configurado.
- Google Chat: fatos nativos de `sender.type=BOT` para mensagens aceitas escritas por bots, indexados por conta, espaço e par de bots.

Canais que não expõem uma identidade de bot de entrada confiável continuam usando seus
filtros normais de mensagens próprias e política de acesso. Eles não devem aderir a essa
proteção até conseguirem identificar os dois participantes no par de bots.

Consulte [runtime do SDK](/pt-BR/plugins/sdk-runtime#reusable-runtime-utilities) para detalhes de implementação do Plugin.
