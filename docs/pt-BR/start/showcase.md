---
description: Real-world OpenClaw projects from the community
read_when:
    - Procurando exemplos reais de uso do OpenClaw
    - Atualizando destaques de projetos da comunidade
summary: Projetos e integrações criados pela comunidade e impulsionados pelo OpenClaw
title: Showcase
x-i18n:
    generated_at: "2026-04-24T06:13:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
    source_path: start/showcase.md
    workflow: 15
---

Projetos OpenClaw não são demos de brinquedo. As pessoas estão colocando em produção loops de revisão de PR, aplicativos móveis, automação residencial, sistemas de voz, devtools e fluxos pesados de memória a partir dos canais que já usam — builds nativos de chat em Telegram, WhatsApp, Discord e terminais; automação real para reserva, compras e suporte sem esperar por uma API; e integrações com o mundo físico usando impressoras, aspiradores, câmeras e sistemas residenciais.

<Info>
**Quer aparecer aqui?** Compartilhe seu projeto em [#self-promotion no Discord](https://discord.gg/clawd) ou [marque @openclaw no X](https://x.com/openclaw).
</Info>

## Vídeos

Comece aqui se quiser o caminho mais curto entre "o que é isso?" e "ok, entendi".

<CardGroup cols={3}>

<Card title="Passo a passo completo de configuração" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 minutos. Instalação, onboarding e primeiro assistente funcional de ponta a ponta.
</Card>

<Card title="Reel de showcase da comunidade" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  Uma passada mais rápida por projetos reais, superfícies e fluxos de trabalho construídos em torno do OpenClaw.
</Card>

<Card title="Projetos no mundo real" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  Exemplos da comunidade, de loops de codificação nativos de chat a hardware e automação pessoal.
</Card>

</CardGroup>

## Novidades do Discord

Destaques recentes em codificação, devtools, mobile e construção de produtos nativos de chat.

<CardGroup cols={2}>

<Card title="Revisão de PR com feedback no Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode finaliza a mudança, abre um PR, o OpenClaw revisa o diff e responde no Telegram com sugestões e um veredito claro de merge.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Feedback de revisão de PR do OpenClaw entregue no Telegram" />
</Card>

<Card title="Skill de adega em minutos" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Pediu ao "Robby" (@openclaw) uma skill local de adega. Ela solicita um CSV de exemplo e um caminho de armazenamento, depois cria e testa a skill (962 garrafas no exemplo).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw criando uma skill local de adega a partir de CSV" />
</Card>

<Card title="Piloto automático para compras no Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Plano semanal de refeições, itens habituais, reservar janela de entrega, confirmar pedido. Sem APIs, apenas controle de navegador.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Automação de compras no Tesco via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Atalho para uma região da tela, visão Gemini, Markdown instantâneo na área de transferência.

  <img src="/assets/showcase/snag.png" alt="Ferramenta SNAG de screenshot para markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Aplicativo desktop para gerenciar skills e comandos entre Agents, Claude, Codex e OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Aplicativo Agents UI" />
</Card>

<Card title="Notas de voz no Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Comunidade** • `voice` `tts` `telegram`

Encapsula TTS do papla.media e envia resultados como notas de voz do Telegram (sem autoplay irritante).

  <img src="/assets/showcase/papla-tts.jpg" alt="Saída de nota de voz do Telegram a partir de TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Helper instalável via Homebrew para listar, inspecionar e observar sessões locais do OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor no ClawHub" />
</Card>

<Card title="Controle de impressora 3D Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Controle e solução de problemas de impressoras BambuLab: status, jobs, câmera, AMS, calibração e mais.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI no ClawHub" />
</Card>

<Card title="Transporte de Viena (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Partidas em tempo real, interrupções, status de elevadores e rotas para o transporte público de Viena.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien no ClawHub" />
</Card>

<Card title="Refeições escolares no ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Reserva automatizada de refeições escolares no Reino Unido via ParentPay. Usa coordenadas do mouse para clicar com confiabilidade em células de tabela.
</Card>

<Card title="Upload para R2 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Faz upload para Cloudflare R2/S3 e gera links de download pré-assinados seguros. Útil para instâncias remotas do OpenClaw.
</Card>

<Card title="App iOS via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Criou um aplicativo iOS completo com mapas e gravação de voz, implantado no TestFlight inteiramente via chat no Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="Aplicativo iOS no TestFlight" />
</Card>

<Card title="Assistente de saúde com Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Assistente pessoal de saúde com IA integrando dados do Oura ring com calendário, compromissos e agenda da academia.

  <img src="/assets/showcase/oura-health.png" alt="Assistente de saúde com Oura ring" />
</Card>

<Card title="Kev's Dream Team (14+ agentes)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Mais de 14 agentes sob um gateway com um orquestrador Opus 4.5 delegando a workers Codex. Veja o [texto técnico](https://github.com/adam91holt/orchestrated-ai-articles) e o [Clawdspace](https://github.com/adam91holt/clawdspace) para sandboxing de agentes.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI para Linear que se integra a fluxos de trabalho agentic (Claude Code, OpenClaw). Gerencie issues, projetos e fluxos a partir do terminal.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Lê, envia e arquiva mensagens via Beeper Desktop. Usa a API MCP local do Beeper para que agentes possam gerenciar todos os seus chats (iMessage, WhatsApp e mais) em um só lugar.
</Card>

</CardGroup>

## Automação e fluxos de trabalho

Agendamento, controle de navegador, loops de suporte e o lado "simplesmente faça a tarefa por mim" do produto.

<CardGroup cols={2}>

<Card title="Controle de purificador de ar Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code descobriu e confirmou os controles do purificador e, depois, o OpenClaw assume para gerenciar a qualidade do ar do ambiente.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Controle de purificador de ar Winix via OpenClaw" />
</Card>

<Card title="Fotos bonitas do céu com câmera" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Acionado por uma câmera no telhado: peça ao OpenClaw para tirar uma foto do céu sempre que ele estiver bonito. Ele projetou uma skill e tirou a foto.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Foto do céu capturada por uma câmera no telhado via OpenClaw" />
</Card>

<Card title="Cena visual de briefing matinal" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Um prompt agendado gera uma imagem de cena toda manhã (clima, tarefas, data, post favorito ou citação) por meio de uma persona do OpenClaw.
</Card>

<Card title="Reserva de quadra de padel" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Verificador de disponibilidade do Playtomic mais CLI de reserva. Nunca mais perca uma quadra vaga.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Captura de tela do padel-cli" />
</Card>

<Card title="Entrada contábil" icon="file-invoice-dollar">
  **Comunidade** • `automation` `email` `pdf`

Coleta PDFs por e-mail e prepara documentos para um consultor tributário. Contabilidade mensal no piloto automático.
</Card>

<Card title="Modo dev do sofá" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Reconstruiu um site pessoal inteiro via Telegram enquanto assistia Netflix — Notion para Astro, 18 posts migrados, DNS para Cloudflare. Nunca abriu um laptop.
</Card>

<Card title="Agente de busca de emprego" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Pesquisa vagas, cruza com palavras-chave do CV e retorna oportunidades relevantes com links. Criado em 30 minutos usando a API JSearch.
</Card>

<Card title="Construtor de skill para Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

O OpenClaw se conectou ao Jira e depois gerou uma nova skill em tempo real (antes mesmo de ela existir no ClawHub).
</Card>

<Card title="Skill Todoist via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Automatizou tarefas do Todoist e fez o OpenClaw gerar a skill diretamente no chat do Telegram.
</Card>

<Card title="Análise no TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Faz login no TradingView por automação de navegador, captura screenshots de gráficos e executa análise técnica sob demanda. Sem API — apenas controle de navegador.
</Card>

<Card title="Suporte automático no Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Observa um canal de Slack da empresa, responde de forma útil e encaminha notificações para o Telegram. Corrigiu autonomamente um bug de produção em um app implantado sem que ninguém pedisse.
</Card>

</CardGroup>

## Conhecimento e memória

Sistemas que indexam, pesquisam, lembram e raciocinam sobre conhecimento pessoal ou de equipe.

<CardGroup cols={2}>

<Card title="xuezh aprendizado de chinês" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Motor de aprendizado de chinês com feedback de pronúncia e fluxos de estudo via OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Feedback de pronúncia do xuezh" />
</Card>

<Card title="Cofre de memória do WhatsApp" icon="vault">
  **Comunidade** • `memory` `transcription` `indexing`

Ingere exports completos do WhatsApp, transcreve mais de 1k notas de voz, cruza com logs de git e gera relatórios em markdown com links.
</Card>

<Card title="Busca semântica no Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Adiciona busca vetorial aos bookmarks do Karakeep usando Qdrant mais embeddings da OpenAI ou Ollama.
</Card>

<Card title="Memória estilo Divertida Mente 2" icon="brain">
  **Comunidade** • `memory` `beliefs` `self-model`

Gerenciador de memória separado que transforma arquivos de sessão em memórias, depois em crenças e depois em um modelo de eu em evolução.
</Card>

</CardGroup>

## Voz e telefone

Pontos de entrada com foco em fala, bridges telefônicas e fluxos pesados de transcrição.

<CardGroup cols={2}>

<Card title="Bridge telefônica Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Bridge HTTP do assistente de voz Vapi para OpenClaw. Chamadas telefônicas quase em tempo real com seu agente.
</Card>

<Card title="Transcrição via OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Transcrição de áudio multilíngue via OpenRouter (Gemini e outros). Disponível no ClawHub.
</Card>

</CardGroup>

## Infraestrutura e implantação

Empacotamento, implantação e integrações que tornam o OpenClaw mais fácil de executar e estender.

<CardGroup cols={2}>

<Card title="Add-on do Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw em execução no Home Assistant OS com suporte a túnel SSH e estado persistente.
</Card>

<Card title="Skill do Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

Controle e automatize dispositivos do Home Assistant via linguagem natural.
</Card>

<Card title="Empacotamento Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

Configuração OpenClaw com Nix e baterias incluídas para implantações reproduzíveis.
</Card>

<Card title="Calendário CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

Skill de calendário usando khal e vdirsyncer. Integração de calendário auto-hospedada.
</Card>

</CardGroup>

## Casa e hardware

O lado físico do OpenClaw: casas, sensores, câmeras, aspiradores e outros dispositivos.

<CardGroup cols={2}>

<Card title="Automação GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Automação residencial nativa de Nix com OpenClaw como interface, além de dashboards no Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Dashboard GoHome no Grafana" />
</Card>

<Card title="Aspirador Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Controle seu aspirador robô Roborock por meio de conversa natural.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Status do Roborock" />
</Card>

</CardGroup>

## Projetos da comunidade

Coisas que cresceram além de um fluxo de trabalho isolado e se tornaram produtos ou ecossistemas mais amplos.

<CardGroup cols={2}>

<Card title="Marketplace StarSwap" icon="star" href="https://star-swap.com/">
  **Comunidade** • `marketplace` `astronomy` `webapp`

Marketplace completo de equipamentos de astronomia. Construído com e em torno do ecossistema OpenClaw.
</Card>

</CardGroup>

## Envie seu projeto

<Steps>
  <Step title="Compartilhe">
    Publique em [#self-promotion no Discord](https://discord.gg/clawd) ou [tweet para @openclaw](https://x.com/openclaw).
  </Step>
  <Step title="Inclua detalhes">
    Conte o que ele faz, coloque o link do repositório ou da demo e compartilhe uma captura de tela, se tiver.
  </Step>
  <Step title="Apareça aqui">
    Adicionaremos projetos de destaque a esta página.
  </Step>
</Steps>

## Relacionado

- [Primeiros passos](/pt-BR/start/getting-started)
- [OpenClaw](/pt-BR/start/openclaw)
