---
read_when:
    - Apresentando o OpenClaw a novos usuários
summary: O OpenClaw é um Gateway multicanal para agentes de IA que é executado em qualquer sistema operacional.
title: OpenClaw
x-i18n:
    generated_at: "2026-05-07T13:19:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7bf82c8551703257e55289d2b82f6436c9900a8afae7ab9b6a655332716ff37b
    source_path: index.md
    workflow: 16
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

> _"ESFOLIE! ESFOLIE!"_ — Uma lagosta espacial, provavelmente

<p align="center">
  <strong>Gateway para qualquer sistema operacional para agentes de IA no Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e mais.</strong><br />
  Envie uma mensagem e receba uma resposta do agente direto do seu bolso. Execute um Gateway em canais integrados, plugins de canal incluídos, WebChat e nodes móveis.
</p>

<Columns>
  <Card title="Comece" href="/pt-BR/start/getting-started" icon="rocket">
    Instale o OpenClaw e coloque o Gateway no ar em minutos.
  </Card>
  <Card title="Execute o onboarding" href="/pt-BR/start/wizard" icon="sparkles">
    Configuração guiada com `openclaw onboard` e fluxos de pareamento.
  </Card>
  <Card title="Abra a Control UI" href="/pt-BR/web/control-ui" icon="layout-dashboard">
    Inicie o painel do navegador para chat, configuração e sessões.
  </Card>
</Columns>

## O que é o OpenClaw?

OpenClaw é um **gateway auto-hospedado** que conecta seus aplicativos de chat e superfícies de canal favoritos — canais integrados mais plugins de canal incluídos ou externos, como Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e mais — a agentes de programação de IA como Pi. Você executa um único processo Gateway na sua própria máquina (ou em um servidor), e ele se torna a ponte entre seus aplicativos de mensagens e um assistente de IA sempre disponível.

**Para quem é?** Desenvolvedores e usuários avançados que querem um assistente de IA pessoal com o qual possam trocar mensagens de qualquer lugar — sem abrir mão do controle sobre seus dados nem depender de um serviço hospedado.

**O que o torna diferente?**

- **Auto-hospedado**: roda no seu hardware, sob suas regras
- **Multicanal**: um Gateway atende simultaneamente canais integrados e plugins de canal incluídos ou externos
- **Nativo para agentes**: criado para agentes de programação com uso de ferramentas, sessões, memória e roteamento multiagente
- **Código aberto**: licenciado sob MIT e impulsionado pela comunidade

**Do que você precisa?** Node 24 (recomendado), ou Node 22 LTS (`22.16+`) para compatibilidade, uma chave de API do provedor escolhido e 5 minutos. Para obter a melhor qualidade e segurança, use o modelo de geração mais recente mais forte disponível.

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

O Gateway é a única fonte da verdade para sessões, roteamento e conexões de canal.

## Principais recursos

<Columns>
  <Card title="Gateway multicanal" icon="network" href="/pt-BR/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e mais com um único processo Gateway.
  </Card>
  <Card title="Canais Plugin" icon="plug" href="/pt-BR/tools/plugin">
    Plugins incluídos adicionam Matrix, Nostr, Twitch, Zalo e mais nas versões atuais normais.
  </Card>
  <Card title="Roteamento multiagente" icon="route" href="/pt-BR/concepts/multi-agent">
    Sessões isoladas por agente, workspace ou remetente.
  </Card>
  <Card title="Suporte a mídia" icon="image" href="/pt-BR/nodes/images">
    Envie e receba imagens, áudio e documentos.
  </Card>
  <Card title="Web Control UI" icon="monitor" href="/pt-BR/web/control-ui">
    Painel do navegador para chat, configuração, sessões e nodes.
  </Card>
  <Card title="Nodes móveis" icon="smartphone" href="/pt-BR/nodes">
    Pareie nodes iOS e Android para fluxos de trabalho com Canvas, câmera e voz.
  </Card>
</Columns>

## Início rápido

<Steps>
  <Step title="Instale o OpenClaw">
    ```bash
    npm install -g openclaw@latest
    ```
  </Step>
  <Step title="Faça o onboarding e instale o serviço">
    ```bash
    openclaw onboard --install-daemon
    ```
  </Step>
  <Step title="Chat">
    Abra a Control UI no navegador e envie uma mensagem:

    ```bash
    openclaw dashboard
    ```

    Ou conecte um canal ([Telegram](/pt-BR/channels/telegram) é o mais rápido) e converse pelo celular.

  </Step>
</Steps>

Precisa da instalação completa e da configuração de desenvolvimento? Consulte [Primeiros passos](/pt-BR/start/getting-started).

## Painel

Abra a Control UI do navegador depois que o Gateway iniciar.

- Padrão local: [http://127.0.0.1:18789/](http://127.0.0.1:18789/)
- Acesso remoto: [Superfícies web](/pt-BR/web) e [Tailscale](/pt-BR/gateway/tailscale)

<p align="center">
  <img src="/whatsapp-openclaw.jpg" alt="OpenClaw" width="420" />
</p>

## Configuração (opcional)

A configuração fica em `~/.openclaw/openclaw.json`.

- Se você **não fizer nada**, o OpenClaw usa o binário Pi incluído no modo RPC com sessões por remetente.
- Se quiser restringir o acesso, comece por `channels.whatsapp.allowFrom` e (para grupos) regras de menção.

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
  <Card title="Centros de documentação" href="/pt-BR/start/hubs" icon="book-open">
    Toda a documentação e guias, organizados por caso de uso.
  </Card>
  <Card title="Configuração" href="/pt-BR/gateway/configuration" icon="settings">
    Configurações centrais do Gateway, tokens e configuração de provedor.
  </Card>
  <Card title="Acesso remoto" href="/pt-BR/gateway/remote" icon="globe">
    Padrões de acesso por SSH e tailnet.
  </Card>
  <Card title="Canais" href="/pt-BR/channels/telegram" icon="message-square">
    Configuração específica de canal para Feishu, Microsoft Teams, WhatsApp, Telegram, Discord e mais.
  </Card>
  <Card title="Nodes" href="/pt-BR/nodes" icon="smartphone">
    Nodes iOS e Android com pareamento, Canvas, câmera e ações do dispositivo.
  </Card>
  <Card title="Ajuda" href="/pt-BR/help" icon="life-buoy">
    Correções comuns e ponto de entrada para solução de problemas.
  </Card>
</Columns>

## Saiba mais

<Columns>
  <Card title="Lista completa de recursos" href="/pt-BR/concepts/features" icon="list">
    Recursos completos de canal, roteamento e mídia.
  </Card>
  <Card title="Roteamento multiagente" href="/pt-BR/concepts/multi-agent" icon="route">
    Isolamento de workspace e sessões por agente.
  </Card>
  <Card title="Segurança" href="/pt-BR/gateway/security" icon="shield">
    Tokens, listas de permissões e controles de segurança.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/gateway/troubleshooting" icon="wrench">
    Diagnósticos do Gateway e erros comuns.
  </Card>
  <Card title="Sobre e créditos" href="/pt-BR/reference/credits" icon="info">
    Origens do projeto, colaboradores e licença.
  </Card>
</Columns>
