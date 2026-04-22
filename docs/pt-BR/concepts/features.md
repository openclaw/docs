---
read_when:
    - Você quer uma lista completa do que o OpenClaw oferece
summary: Capacidades do OpenClaw em canais, roteamento, mídia e UX.
title: Recursos
x-i18n:
    generated_at: "2026-04-22T04:21:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af9955b65030fe02e35d3056d284271fa9700f3ed094c6f8323eb10e4064e22
    source_path: concepts/features.md
    workflow: 15
---

# Recursos

## Destaques

<Columns>
  <Card title="Canais" icon="message-square" href="/pt-BR/channels">
    Discord, Google Chat, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e mais com um único Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/pt-BR/tools/plugin">
    Plugins incluídos adicionam Matrix, Nextcloud Talk, Nostr, Twitch, Zalo e mais sem instalações separadas nas versões atuais normais.
  </Card>
  <Card title="Roteamento" icon="route" href="/pt-BR/concepts/multi-agent">
    Roteamento multiagente com sessões isoladas.
  </Card>
  <Card title="Mídia" icon="image" href="/pt-BR/nodes/images">
    Imagens, áudio, vídeo, documentos e geração de imagem/vídeo.
  </Card>
  <Card title="Apps e UI" icon="monitor" href="/web/control-ui">
    UI de controle web e app complementar para macOS.
  </Card>
  <Card title="Nós móveis" icon="smartphone" href="/pt-BR/nodes">
    Nós iOS e Android com pairing, voz/chat e comandos avançados de dispositivo.
  </Card>
</Columns>

## Lista completa

**Canais:**

- Os canais integrados incluem Discord, Google Chat, iMessage (legado), IRC, Signal, Slack, Telegram, WebChat e WhatsApp
- Os canais de plugin incluídos incluem BlueBubbles para iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, Bot QQ, Synology Chat, Tlon, Twitch, Zalo e Zalo Personal
- Os plugins de canal opcionais instalados separadamente incluem Voice Call e pacotes de terceiros como WeChat
- Plugins de canal de terceiros podem ampliar ainda mais o Gateway, como WeChat
- Suporte a chat em grupo com ativação baseada em menção
- Segurança em DM com listas de permissões e pairing

**Agente:**

- Runtime de agente incorporado com streaming de ferramentas
- Roteamento multiagente com sessões isoladas por workspace ou remetente
- Sessões: chats diretos são consolidados em `main`; grupos são isolados
- Streaming e fragmentação para respostas longas

**Autenticação e provedores:**

- Mais de 35 provedores de modelo (Anthropic, OpenAI, Google e mais)
- Autenticação de assinatura via OAuth (por exemplo, OpenAI Codex)
- Suporte a provedores personalizados e auto-hospedados (vLLM, SGLang, Ollama e qualquer endpoint compatível com OpenAI ou compatível com Anthropic)

**Mídia:**

- Imagens, áudio, vídeo e documentos de entrada e saída
- Superfícies compartilhadas de capacidade de geração de imagem e geração de vídeo
- Transcrição de mensagem de voz
- Texto para fala com vários provedores

**Apps e interfaces:**

- WebChat e UI de controle no navegador
- App complementar de barra de menu para macOS
- Nó iOS com pairing, Canvas, câmera, gravação de tela, localização e voz
- Nó Android com pairing, chat, voz, Canvas, câmera e comandos de dispositivo

**Ferramentas e automação:**

- Automação de navegador, exec, sandboxing
- Busca na web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Jobs Cron e agendamento de Heartbeat
- Skills, plugins e pipelines de workflow (Lobster)
