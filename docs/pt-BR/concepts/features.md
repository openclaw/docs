---
read_when:
    - Você quer uma lista completa do que o OpenClaw oferece suporte
summary: Recursos do OpenClaw em canais, roteamento, mídia e experiência do usuário.
title: Recursos
x-i18n:
    generated_at: "2026-07-12T15:05:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5bc3ebdd87a0f6ea0f3d75d029bf7cae469ecd9db84a165bd47c4896936fe303
    source_path: concepts/features.md
    workflow: 16
---

## Destaques

<Columns>
  <Card title="Canais" icon="message-square" href="/pt-BR/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat e muito mais com um único Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/pt-BR/tools/plugin">
    Plugins oficiais adicionam Matrix, Nextcloud Talk, Nostr, Twitch, Zalo e dezenas de outros com um único comando de instalação.
  </Card>
  <Card title="Roteamento" icon="route" href="/pt-BR/concepts/multi-agent">
    Roteamento multiagente com sessões isoladas.
  </Card>
  <Card title="Mídia" icon="image" href="/pt-BR/nodes/images">
    Imagens, áudio, vídeo, documentos e geração de imagens e vídeos.
  </Card>
  <Card title="Aplicativos e interface" icon="monitor" href="/pt-BR/platforms">
    Windows Hub, Control UI no navegador, aplicativo da barra de menus do macOS e Nodes móveis.
  </Card>
  <Card title="Nodes móveis" icon="smartphone" href="/pt-BR/nodes">
    Nodes iOS e Android com emparelhamento, voz/chat e comandos avançados de dispositivo.
  </Card>
</Columns>

## Lista completa

**Canais:**

- iMessage, Telegram e WebChat são fornecidos com a instalação principal; todos os outros canais são
  Plugins oficiais instalados com `openclaw plugins install @openclaw/<id>` (ou sob demanda
  durante `openclaw onboard` / `openclaw channels add`)
- Canais de Plugins oficiais: Discord, Feishu, Google Chat, IRC, LINE, Matrix, Mattermost,
  Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Raft, Signal, Slack, SMS, Synology Chat,
  Tlon, Twitch, Voice Call, WhatsApp, Zalo e Zalo Personal
- Canais de Plugins externos mantidos fora do repositório do OpenClaw: WeChat, Yuanbao e Zalo ClawBot
- Suporte a chats em grupo com ativação baseada em menções
- Segurança de mensagens diretas com listas de permissões e emparelhamento

**Agente:**

- Ambiente de execução de agente integrado com streaming de ferramentas
- Roteamento multiagente com sessões isoladas por espaço de trabalho ou remetente
- Sessões: conversas diretas são agrupadas na sessão compartilhada `main`; grupos são isolados
- Streaming e divisão em blocos para respostas longas

**Autenticação e provedores:**

- Mais de 35 provedores de modelos (Anthropic, OpenAI, Google e outros)
- Autenticação de assinatura via OAuth (por exemplo, OpenAI Codex)
- Suporte a provedores personalizados e auto-hospedados (vLLM, SGLang, Ollama, llama.cpp, LM Studio e
  qualquer endpoint compatível com OpenAI ou Anthropic)

**Mídia:**

- Entrada e saída de imagens, áudio, vídeo e documentos
- Interfaces de recursos compartilhados para geração de imagens e vídeos
- Transcrição de mensagens de voz
- Conversão de texto em fala com vários provedores

**Aplicativos e interfaces:**

- WebChat e Control UI no navegador
- Aplicativo complementar da barra de menus do macOS
- Node iOS com emparelhamento, Canvas, câmera, gravação de tela, localização e voz
- Node Android com emparelhamento, chat, voz, Canvas, câmera e comandos de dispositivo

**Ferramentas e automação:**

- Automação do navegador, execução e isolamento em sandbox
- Pesquisa na web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tarefas Cron e agendamento de Heartbeat
- Skills, Plugins e pipelines de fluxo de trabalho (Lobster)

## Relacionados

<CardGroup cols={2}>
  <Card title="Recursos experimentais" href="/pt-BR/concepts/experimental-features" icon="flask">
    Recursos opcionais que ainda não foram disponibilizados na interface padrão.
  </Card>
  <Card title="Ambiente de execução do agente" href="/pt-BR/concepts/agent" icon="robot">
    Modelo do ambiente de execução do agente e como as execuções são despachadas.
  </Card>
  <Card title="Canais" href="/pt-BR/channels" icon="message-square">
    Conecte Telegram, WhatsApp, Discord, Slack e outros por meio de um único Gateway.
  </Card>
  <Card title="Plugins" href="/pt-BR/tools/plugin" icon="plug">
    Plugins oficiais e externos que estendem o OpenClaw.
  </Card>
</CardGroup>
