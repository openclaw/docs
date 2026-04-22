---
read_when:
    - Apresentando o OpenClaw para iniciantes
summary: OpenClaw é um Gateway multicanal para agentes de IA que roda em qualquer sistema operacional.
title: OpenClaw
x-i18n:
    generated_at: "2026-04-22T04:23:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 923d34fa604051d502e4bc902802d6921a4b89a9447f76123aa8d2ff085f0b99
    source_path: index.md
    workflow: 15
---

# OpenClaw 🦞

<p align="center">
    <img
        src="/assets/openclaw-logo-text-dark.png"
        alt="OpenClaw"
        width="500"
        class="dark:hidden"
    />
    <img
        src="/assets/openclaw-logo-text.png"
        alt="OpenClaw"
        width="500"
        class="hidden dark:block"
    />
</p>

> _"EXFOLIATE! EXFOLIATE!"_ — Uma lagosta espacial, provavelmente

<p align="center">
  <strong>Gateway para qualquer sistema operacional para agentes de IA em Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e mais.</strong><br />
  Envie uma mensagem e receba a resposta de um agente no seu bolso. Execute um Gateway em canais integrados, plugins de canal incluídos, WebChat e Nodes móveis.
</p>

<Columns>
  <Card title="Começar" href="/pt-BR/start/getting-started" icon="rocket">
    Instale o OpenClaw e coloque o Gateway no ar em minutos.
  </Card>
  <Card title="Executar onboarding" href="/pt-BR/start/wizard" icon="sparkles">
    Configuração guiada com `openclaw onboard` e fluxos de pareamento.
  </Card>
  <Card title="Abrir a Control UI" href="/web/control-ui" icon="layout-dashboard">
    Inicie o painel no navegador para chat, configuração e sessões.
  </Card>
</Columns>

## O que é o OpenClaw?

OpenClaw é um **Gateway auto-hospedado** que conecta seus aplicativos de chat e superfícies de canal favoritos — canais integrados mais plugins de canal incluídos ou externos como Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e mais — a agentes de codificação de IA como Pi. Você executa um único processo do Gateway na sua própria máquina (ou em um servidor), e ele se torna a ponte entre seus aplicativos de mensagens e um assistente de IA sempre disponível.

**Para quem é?** Desenvolvedores e usuários avançados que querem um assistente pessoal de IA para quem possam enviar mensagens de qualquer lugar — sem abrir mão do controle dos próprios dados nem depender de um serviço hospedado.

**O que o torna diferente?**

- **Auto-hospedado**: roda no seu hardware, com as suas regras
- **Multicanal**: um Gateway atende simultaneamente canais integrados mais plugins de canal incluídos ou externos
- **Nativo para agentes**: criado para agentes de codificação com uso de ferramentas, sessões, memória e roteamento multiagente
- **Código aberto**: licenciado sob MIT, conduzido pela comunidade

**Do que você precisa?** Node 24 (recomendado) ou Node 22 LTS (`22.14+`) para compatibilidade, uma chave de API do provider escolhido e 5 minutos. Para a melhor qualidade e segurança, use o modelo mais forte e de última geração disponível.

## Como funciona

```mermaid
flowchart LR
  A["Chat apps + plugins"] --> B["Gateway"]
  B --> C["Pi agent"]
  B --> D["CLI"]
  B --> E["Web Control UI"]
  B --> F["macOS app"]
  B --> G["iOS and Android nodes"]
```

O Gateway é a única fonte de verdade para sessões, roteamento e conexões de canal.

## Principais recursos

<Columns>
  <Card title="Gateway multicanal" icon="network" href="/pt-BR/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e mais com um único processo de Gateway.
  </Card>
  <Card title="Plugins de canal" icon="plug" href="/pt-BR/tools/plugin">
    Plugins incluídos adicionam Matrix, Nostr, Twitch, Zalo e mais nas versões atuais normais.
  </Card>
  <Card title="Roteamento multiagente" icon="route" href="/pt-BR/concepts/multi-agent">
    Sessões isoladas por agente, workspace ou remetente.
  </Card>
  <Card title="Suporte a mídia" icon="image" href="/pt-BR/nodes/images">
    Envie e receba imagens, áudio e documentos.
  </Card>
  <Card title="Web Control UI" icon="monitor" href="/web/control-ui">
    Painel no navegador para chat, configuração, sessões e Nodes.
  </Card>
  <Card title="Nodes móveis" icon="smartphone" href="/pt-BR/nodes">
    Emparelhe Nodes iOS e Android para Canvas, câmera e fluxos com voz.
  </Card>
</Columns>

## Início rápido

<Steps>
  <Step title="Instalar o OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Fazer o onboarding e instalar o serviço">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Conversar">
    Abra a Control UI no navegador e envie uma mensagem:

    ```bash
    openclaw dashboard
    ```

    Ou conecte um canal ([Telegram](/pt-BR/channels/telegram) é o mais rápido) e converse pelo telefone.

  </Step>
</Steps>

Precisa da instalação completa e da configuração de desenvolvimento? Consulte [Primeiros passos](/pt-BR/start/getting-started).

## Painel

Abra a Control UI no navegador depois que o Gateway iniciar.

- Padrão local: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Acesso remoto: [Superfícies Web](/web) e [Tailscale](/pt-BR/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Configuração (opcional)

A configuração fica em `~/.openclaw/openclaw.json`.

- Se você **não fizer nada**, o OpenClaw usa o binário Pi incluído em modo RPC com sessões por remetente.
- Se quiser restringir, comece com `channels.whatsapp.allowFrom` e (para grupos) regras de menção.

Exemplo:

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: { groupChat: { mentionPatterns: ["@openclaw"] } },
}
```

## Comece aqui

<Columns>
  <Card title="Centrais de documentação" href="/pt-BR/start/hubs" icon="book-open">
    Toda a documentação e guias, organizados por caso de uso.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="settings">
    Configurações principais do Gateway, tokens e configuração de provider.
  </Card>
  <Card title="Acesso remoto" href="/pt-BR/gateway/remote" icon="globe">
    Padrões de acesso por SSH e tailnet.
  </Card>
  <Card title="Canais" href="/pt-BR/channels/telegram" icon="message-square">
    Configuração específica por canal para Feishu, Microsoft Teams, WhatsApp, Telegram, Discord e mais.
  </Card>
  <Card title="Nodes" href="/pt-BR/nodes" icon="smartphone">
    Nodes iOS e Android com pareamento, Canvas, câmera e ações de dispositivo.
  </Card>
  <Card title="Ajuda" href="/pt-BR/help" icon="life-buoy">
    Correções comuns e ponto de entrada para solução de problemas.
  </Card>
</Columns>

## Saiba mais

<Columns>
  <Card title="Lista completa de recursos" href="/pt-BR/concepts/features" icon="list">
    Capacidades completas de canais, roteamento e mídia.
  </Card>
  <Card title="Roteamento multiagente" href="/pt-BR/concepts/multi-agent" icon="route">
    Isolamento de workspace e sessões por agente.
  </Card>
  <Card title="Segurança" href="/pt-BR/gateway/security" icon="shield">
    Tokens, allowlists e controles de segurança.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/gateway/troubleshooting" icon="wrench">
    Diagnóstico do Gateway e erros comuns.
  </Card>
  <Card title="Sobre e créditos" href="/pt-BR/reference/credits" icon="info">
    Origens do projeto, contribuidores e licença.
  </Card>
</Columns>
