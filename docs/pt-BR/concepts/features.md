---
read_when:
    - Você quer uma lista completa do que o OpenClaw suporta
summary: Recursos do OpenClaw em canais, roteamento, mídia e experiência do usuário.
title: Recursos
x-i18n:
    generated_at: "2026-05-06T05:50:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d46085b326dd1e5f0d5531bdf8d7d84ac8c22b7fb4637b7183be2bd9d556c500
    source_path: concepts/features.md
    workflow: 16
---

## Destaques

<Columns>
  <Card title="Canais" icon="message-square" href="/pt-BR/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e mais com um único Gateway.
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
  <Card title="Apps e UI" icon="monitor" href="/pt-BR/web/control-ui">
    UI de Controle Web e app complementar para macOS.
  </Card>
  <Card title="Nós móveis" icon="smartphone" href="/pt-BR/nodes">
    Nós iOS e Android com pareamento, voz/chat e comandos avançados do dispositivo.
  </Card>
</Columns>

## Lista completa

**Canais:**

- Os canais integrados incluem Discord, Google Chat, iMessage (legado), IRC, Signal, Slack, Telegram, WebChat e WhatsApp
- Os canais de Plugin incluídos incluem BlueBubbles para iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo e Zalo Personal
- Plugins de canal opcionais instalados separadamente incluem Voice Call e pacotes de terceiros, como WeChat
- Plugins de canal de terceiros podem estender ainda mais o Gateway, como WeChat
- Suporte a chat em grupo com ativação baseada em menções
- Segurança em DM com listas de permissão e pareamento

**Agente:**

- Runtime de agente incorporado com streaming de ferramentas
- Roteamento multiagente com sessões isoladas por workspace ou remetente
- Sessões: chats diretos são agrupados no `main`; grupos são isolados
- Streaming e divisão em partes para respostas longas

**Autenticação e provedores:**

- Mais de 35 provedores de modelo (Anthropic, OpenAI, Google e mais)
- Autenticação por assinatura via OAuth (por exemplo, OpenAI Codex)
- Suporte a provedores personalizados e auto-hospedados (vLLM, SGLang, Ollama e qualquer endpoint compatível com OpenAI ou compatível com Anthropic)

**Mídia:**

- Imagens, áudio, vídeo e documentos na entrada e na saída
- Superfícies compartilhadas de capacidade de geração de imagens e geração de vídeo
- Transcrição de notas de voz
- Texto para fala com vários provedores

**Apps e interfaces:**

- WebChat e UI de Controle no navegador
- App complementar de barra de menus do macOS
- Nó iOS com pareamento, Canvas, câmera, gravação de tela, localização e voz
- Nó Android com pareamento, chat, voz, Canvas, câmera e comandos do dispositivo

**Ferramentas e automação:**

- Automação de navegador, exec, sandboxing
- Busca na Web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Jobs Cron e agendamento de Heartbeat
- Skills, plugins e pipelines de workflow (Lobster)

## Relacionados

<CardGroup cols={2}>
  <Card title="Recursos experimentais" href="/pt-BR/concepts/experimental-features" icon="flask">
    Recursos opcionais que ainda não foram lançados para a superfície padrão.
  </Card>
  <Card title="Runtime de agente" href="/pt-BR/concepts/agent" icon="robot">
    Modelo de runtime de agente e como as execuções são despachadas.
  </Card>
  <Card title="Canais" href="/pt-BR/channels" icon="message-square">
    Conecte Telegram, WhatsApp, Discord, Slack e mais a partir de um Gateway.
  </Card>
  <Card title="Plugins" href="/pt-BR/tools/plugin" icon="plug">
    Plugins incluídos e de terceiros que estendem o OpenClaw.
  </Card>
</CardGroup>
