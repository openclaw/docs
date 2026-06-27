---
description: Real-world OpenClaw projects from the community
read_when:
    - Procurando exemplos reais de uso do OpenClaw
    - Atualizando destaques de projetos da comunidade
summary: Projetos e integrações criados pela comunidade com tecnologia OpenClaw
title: Vitrine
x-i18n:
    generated_at: "2026-06-27T18:12:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw projetos não são demonstrações de brinquedo. Pessoas estão entregando loops de revisão de PR, aplicativos móveis, automação residencial, sistemas de voz, devtools e fluxos de trabalho pesados em memória a partir dos canais que já usam — builds nativos de chat no Telegram, WhatsApp, Discord e terminais; automação real para reservas, compras e suporte sem esperar por uma API; e integrações com o mundo físico usando impressoras, aspiradores, câmeras e sistemas domésticos.

<Info>
**Quer aparecer aqui?** Compartilhe seu projeto em [#self-promotion no Discord](https://discord.gg/clawd) ou [marque @openclaw no X](https://x.com/openclaw).
</Info>

## Recém-saídos do Discord

Destaques recentes em programação, devtools, mobile e criação de produtos nativos de chat.

<CardGroup cols={2}>

<Card title="Revisão de PR para feedback no Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode finaliza a alteração, abre um PR, o OpenClaw revisa o diff e responde no Telegram com sugestões e um veredito claro de merge.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Feedback de revisão de PR do OpenClaw entregue no Telegram" />
</Card>

<Card title="Skill de adega em minutos" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Pediu ao "Robby" (@openclaw) uma skill local de adega. Ela solicita uma exportação CSV de amostra e um caminho de armazenamento, depois cria e testa a skill (962 garrafas no exemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw criando uma skill local de adega a partir de CSV" />
</Card>

<Card title="Piloto automático de compras na Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plano semanal de refeições, itens recorrentes, reserva de horário de entrega, confirmação do pedido. Sem APIs, apenas controle do navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automação de compras na Tesco via chat" />
</Card>

<Card title="SNAG de captura de tela para Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Atalho para uma região da tela, visão do Gemini, Markdown instantâneo na sua área de transferência.

  <img src="/assets/showcase/snag.png" alt="Ferramenta SNAG de captura de tela para markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplicativo desktop para gerenciar Skills e comandos entre Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Aplicativo Agents UI" />
</Card>

<Card title="Notas de voz do Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

Envolve o TTS da papla.media e envia resultados como notas de voz no Telegram (sem reprodução automática irritante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Saída de nota de voz do Telegram a partir de TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Auxiliar instalado via Homebrew para listar, inspecionar e monitorar sessões locais do OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor no ClawHub" />
</Card>

<Card title="Controle de impressora 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controle e solucione problemas de impressoras BambuLab: status, trabalhos, câmera, AMS, calibração e mais.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI no ClawHub" />
</Card>

<Card title="Transporte de Viena (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partidas em tempo real, interrupções, status de elevadores e rotas para o transporte público de Viena.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien no ClawHub" />
</Card>

<Card title="Refeições escolares ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Reserva automatizada de refeições escolares no Reino Unido via ParentPay. Usa coordenadas do mouse para cliques confiáveis em células de tabela.
</Card>

<Card title="Upload para R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Faça upload para Cloudflare R2/S3 e gere links seguros de download pré-assinados. Útil para instâncias remotas do OpenClaw.

  <img src="/assets/showcase/r2-upload.png" alt="Skill de upload para R2 no ClawHub" />
</Card>

<Card title="Aplicativo iOS via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Criou um aplicativo iOS completo com mapas e gravação de voz, implantado no TestFlight inteiramente via chat do Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="Aplicativo iOS no TestFlight" />
</Card>

<Card title="Assistente de saúde Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistente pessoal de saúde com IA que integra dados do anel Oura com calendário, compromissos e agenda da academia.

  <img src="/assets/showcase/oura-health.png" alt="Assistente de saúde Oura Ring" />
</Card>

<Card title="Dream Team do Kev (14+ agentes)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ agentes sob um Gateway com um orquestrador Opus 4.5 delegando para workers Codex. Veja o [artigo técnico](https://github.com/adam91holt/orchestrated-ai-articles) e [Clawdspace](https://github.com/adam91holt/clawdspace) para sandboxing de agentes.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI para Linear que se integra a fluxos de trabalho agentic (Claude Code, OpenClaw). Gerencie issues, projetos e fluxos de trabalho pelo terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Leia, envie e arquive mensagens via Beeper Desktop. Usa a API MCP local do Beeper para que agentes possam gerenciar todos os seus chats (iMessage, WhatsApp e mais) em um só lugar.
</Card>

</CardGroup>

## Automação e fluxos de trabalho

Agendamento, controle de navegador, loops de suporte e o lado "simplesmente faça a tarefa por mim" do produto.

<CardGroup cols={2}>

<Card title="Controle de purificador de ar Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code descobriu e confirmou os controles do purificador; depois o OpenClaw assume para gerenciar a qualidade do ar do ambiente.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Controle de purificador de ar Winix via OpenClaw" />
</Card>

<Card title="Belas fotos do céu pela câmera" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Acionado por uma câmera no telhado: peça ao OpenClaw para tirar uma foto do céu sempre que ele parecer bonito. Ele projetou uma skill e capturou a imagem.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Instantâneo do céu por câmera de telhado capturado pelo OpenClaw" />
</Card>

<Card title="Cena visual de briefing matinal" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Um prompt agendado gera uma imagem de cena todas as manhãs (clima, tarefas, data, post favorito ou citação) via uma persona do OpenClaw.
</Card>

<Card title="Reserva de quadra de padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Verificador de disponibilidade do Playtomic mais CLI de reserva. Nunca mais perca uma quadra disponível.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Captura de tela do padel-cli" />
</Card>

<Card title="Entrada contábil" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

Coleta PDFs por e-mail, prepara documentos para um consultor fiscal. Contabilidade mensal no piloto automático.
</Card>

<Card title="Modo dev de sofá" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Reconstruiu um site pessoal inteiro via Telegram enquanto assistia à Netflix — do Notion para Astro, 18 posts migrados, DNS para Cloudflare. Nunca abriu um laptop.
</Card>

<Card title="Agente de busca de emprego" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Pesquisa vagas de emprego, compara com palavras-chave do CV e retorna oportunidades relevantes com links. Criado em 30 minutos usando a API JSearch.
</Card>

<Card title="Construtor de skill para Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw se conectou ao Jira e então gerou uma nova skill na hora (antes de ela existir no ClawHub).
</Card>

<Card title="Skill do Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatizou tarefas do Todoist e fez o OpenClaw gerar a skill diretamente no chat do Telegram.
</Card>

<Card title="Análise do TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Faz login no TradingView via automação de navegador, captura imagens dos gráficos e realiza análise técnica sob demanda. Nenhuma API necessária — apenas controle do navegador.
</Card>

<Card title="Suporte automático no Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Monitora um canal do Slack da empresa, responde de forma útil e encaminha notificações para o Telegram. Corrigiu autonomamente um bug de produção em um aplicativo implantado sem ser solicitado.
</Card>

</CardGroup>

## Conhecimento e memória

Sistemas que indexam, pesquisam, lembram e raciocinam sobre conhecimento pessoal ou de equipe.

<CardGroup cols={2}>

<Card title="Aprendizado de chinês xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Motor de aprendizado de chinês com feedback de pronúncia e fluxos de estudo via OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Feedback de pronúncia do xuezh" />
</Card>

<Card title="Cofre de memória do WhatsApp" icon="vault">
  **Community** • `memory` `transcription` `indexing`

Ingere exportações completas do WhatsApp, transcreve mais de 1 mil notas de voz, faz verificações cruzadas com logs do git e gera relatórios markdown vinculados.
</Card>

<Card title="Busca semântica Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Adiciona busca vetorial aos favoritos do Karakeep usando Qdrant mais embeddings da OpenAI ou Ollama.
</Card>

<Card title="Memória Inside-Out-2" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

Gerenciador de memória separado que transforma arquivos de sessão em memórias, depois em crenças e, em seguida, em um modelo de si mesmo em evolução.
</Card>

</CardGroup>

## Voz e telefone

Pontos de entrada centrados em fala, pontes telefônicas e fluxos de trabalho pesados em transcrição.

<CardGroup cols={2}>

<Card title="Ponte telefônica Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Assistente de voz Vapi para ponte HTTP do OpenClaw. Chamadas telefônicas quase em tempo real com seu agente.
</Card>

<Card title="Transcrição OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcrição de áudio multilíngue via OpenRouter (Gemini e mais). Disponível no ClawHub.

  <img src="/assets/showcase/openrouter-transcribe.png" alt="Skill de transcrição OpenRouter no ClawHub" />
</Card>

</CardGroup>

## Infraestrutura e implantação

Empacotamento, implantação e integrações que tornam o OpenClaw mais fácil de executar e estender.

<CardGroup cols={2}>

<Card title="Complemento Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

OpenClaw gateway em execução no Home Assistant OS com suporte a túnel SSH e estado persistente.
</Card>

<Card title="Skill do Home Assistant" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

Controle e automatize dispositivos do Home Assistant via linguagem natural.

  <img src="/assets/showcase/homeassistant.png" alt="Skill do Home Assistant no ClawHub" />
</Card>

<Card title="Empacotamento Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configuração OpenClaw nixificada completa para implantações reproduzíveis.
</Card>

<Card title="Calendário CalDAV" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

Skill de calendário usando khal e vdirsyncer. Integração de calendário auto-hospedada.

  <img src="/assets/showcase/caldav-calendar.png" alt="Skill de calendário CalDAV no ClawHub" />
</Card>

</CardGroup>

## Casa e hardware

O lado físico do OpenClaw: casas, sensores, câmeras, aspiradores e outros dispositivos.

<CardGroup cols={2}>

<Card title="Automação GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automação residencial nativa em Nix com o OpenClaw como interface, além de painéis do Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Painel do Grafana do GoHome" />
</Card>

<Card title="Aspirador Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Controle seu aspirador robô Roborock por meio de conversa natural.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Status do Roborock" />
</Card>

</CardGroup>

## Projetos da comunidade

Coisas que cresceram além de um único fluxo de trabalho para produtos ou ecossistemas mais amplos.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Comunidade** • `marketplace` `astronomy` `webapp`

Marketplace completo de equipamentos de astronomia. Criado com e ao redor do ecossistema OpenClaw.
</Card>

</CardGroup>

## Envie seu projeto

<Steps>
  <Step title="Compartilhe">
    Publique em [#self-promotion no Discord](https://discord.gg/clawd) ou [tweete @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Inclua detalhes">
    Conte o que ele faz, adicione um link para o repositório ou demo e compartilhe uma captura de tela se tiver uma.
  </Step>
  <Step title="Ganhe destaque">
    Adicionaremos projetos de destaque a esta página.
  </Step>
</Steps>

## Relacionados

- [Primeiros passos](/pt-BR/start/getting-started)
- [OpenClaw](/pt-BR/start/openclaw)
