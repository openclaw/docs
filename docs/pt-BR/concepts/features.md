---
read_when:
    - Você quer uma lista completa do que o OpenClaw oferece suporte
summary: Capacidades do OpenClaw em canais, roteamento, mídia e UX.
title: Recursos
x-i18n:
    generated_at: "2026-04-24T05:47:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## Destaques

<Columns>
  <Card title="Canais" icon="message-square" href="/pt-BR/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e mais com um único Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/pt-BR/tools/plugin">
    Plugins integrados adicionam Matrix, Nextcloud Talk, Nostr, Twitch, Zalo e mais, sem instalações separadas nas versões atuais normais.
  </Card>
  <Card title="Roteamento" icon="route" href="/pt-BR/concepts/multi-agent">
    Roteamento com vários agentes com sessões isoladas.
  </Card>
  <Card title="Mídia" icon="image" href="/pt-BR/nodes/images">
    Imagens, áudio, vídeo, documentos e geração de imagem/vídeo.
  </Card>
  <Card title="Apps e UI" icon="monitor" href="/pt-BR/web/control-ui">
    Control UI web e app complementar para macOS.
  </Card>
  <Card title="Nodes móveis" icon="smartphone" href="/pt-BR/nodes">
    Nodes iOS e Android com pareamento, voz/chat e comandos avançados de dispositivo.
  </Card>
</Columns>

## Lista completa

**Canais:**

- Canais integrados incluem Discord, Google Chat, iMessage (legado), IRC, Signal, Slack, Telegram, WebChat e WhatsApp
- Canais de Plugin integrados incluem BlueBubbles para iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo e Zalo Personal
- Plugins opcionais de canal instalados separadamente incluem Voice Call e pacotes de terceiros como WeChat
- Plugins de canal de terceiros podem estender ainda mais o Gateway, como o WeChat
- Suporte a chat em grupo com ativação baseada em menção
- Segurança de DM com listas de permissões e pareamento

**Agente:**

- Runtime de agente incorporado com streaming de ferramentas
- Roteamento com vários agentes com sessões isoladas por workspace ou remetente
- Sessões: chats diretos colapsam em `main`; grupos são isolados
- Streaming e chunking para respostas longas

**Autenticação e providers:**

- Mais de 35 providers de modelos (Anthropic, OpenAI, Google e mais)
- Autenticação de assinatura via OAuth (por exemplo, OpenAI Codex)
- Suporte a providers personalizados e auto-hospedados (vLLM, SGLang, Ollama e qualquer endpoint compatível com OpenAI ou compatível com Anthropic)

**Mídia:**

- Imagens, áudio, vídeo e documentos na entrada e na saída
- Superfícies compartilhadas de capacidade de geração de imagem e geração de vídeo
- Transcrição de mensagem de voz
- Texto para fala com vários providers

**Apps e interfaces:**

- WebChat e Control UI no navegador
- App complementar de barra de menu do macOS
- Node iOS com pareamento, Canvas, câmera, gravação de tela, localização e voz
- Node Android com pareamento, chat, voz, Canvas, câmera e comandos de dispositivo

**Ferramentas e automação:**

- Automação de navegador, exec, sandboxing
- Busca na web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Jobs Cron e agendamento de Heartbeat
- Skills, Plugins e pipelines de workflow (Lobster)

## Relacionado

- [Recursos experimentais](/pt-BR/concepts/experimental-features)
- [Runtime do agente](/pt-BR/concepts/agent)
